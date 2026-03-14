import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export type ChannelId = "general" | "first_trimester" | "second_trimester" | "third_trimester" | "postpartum";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  channel: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  liked_by_me?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

interface CommunityState {
  activeChannel: ChannelId;
  posts: CommunityPost[];
  loading: boolean;
  setActiveChannel: (channel: ChannelId) => void;
  fetchPosts: (channel: ChannelId) => Promise<void>;
  createPost: (content: string, channel: ChannelId, imageUrl?: string) => Promise<boolean>;
  toggleLike: (postId: string, userId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<PostComment[]>;
  addComment: (postId: string, content: string) => Promise<boolean>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  activeChannel: "general",
  posts: [],
  loading: false,

  setActiveChannel: (activeChannel) => {
    set({ activeChannel });
    get().fetchPosts(activeChannel);
  },

  fetchPosts: async (channel) => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (channel !== "general") {
      query = query.eq("channel", channel);
    }

    const { data: postsData } = await query;
    if (!postsData) { set({ posts: [], loading: false }); return; }

    // Fetch author profiles
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Fetch user's likes
    let likedPostIds = new Set<string>();
    if (user) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postsData.map(p => p.id));
      likedPostIds = new Set(likes?.map(l => l.post_id) || []);
    }

    const posts: CommunityPost[] = postsData.map(p => ({
      ...p,
      author_name: profileMap.get(p.user_id)?.full_name || "Anonymous",
      author_avatar: profileMap.get(p.user_id)?.avatar_url || undefined,
      liked_by_me: likedPostIds.has(p.id),
    }));

    set({ posts, loading: false });
  },

  createPost: async (content, channel, imageUrl) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content,
      channel,
      image_url: imageUrl || null,
    });

    if (!error) {
      await get().fetchPosts(get().activeChannel);
      return true;
    }
    return false;
  },

  toggleLike: async (postId, userId) => {
    const post = get().posts.find(p => p.id === postId);
    if (!post) return;

    if (post.liked_by_me) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
      await supabase.from("community_posts").update({ likes_count: Math.max(0, post.likes_count - 1) }).eq("id", postId);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
      await supabase.from("community_posts").update({ likes_count: post.likes_count + 1 }).eq("id", postId);
    }

    // Optimistic update
    set({
      posts: get().posts.map(p =>
        p.id === postId
          ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1 }
          : p
      ),
    });
  },

  fetchComments: async (postId) => {
    const { data } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!data) return [];

    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return data.map(c => ({
      ...c,
      author_name: profileMap.get(c.user_id)?.full_name || "Anonymous",
      author_avatar: profileMap.get(c.user_id)?.avatar_url || undefined,
    }));
  },

  addComment: async (postId, content) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: user.id,
      content,
    });

    if (!error) {
      // Increment comments_count
      const post = get().posts.find(p => p.id === postId);
      if (post) {
        await supabase.from("community_posts").update({ comments_count: post.comments_count + 1 }).eq("id", postId);
        set({
          posts: get().posts.map(p =>
            p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
          ),
        });
      }
      return true;
    }
    return false;
  },
}));
