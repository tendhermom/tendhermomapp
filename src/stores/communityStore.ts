import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { usePointsStore } from "./pointsStore";
import { queryCache } from "@/lib/queryCache";

export type ChannelId = "first_trimester" | "second_trimester" | "third_trimester" | "postpartum";

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
  hasMore: boolean;
  setActiveChannel: (channel: ChannelId) => void;
  fetchPosts: (channel: ChannelId, cursor?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (content: string, channel: ChannelId, imageUrl?: string) => Promise<boolean>;
  toggleLike: (postId: string, userId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<PostComment[]>;
  addComment: (postId: string, content: string) => Promise<boolean>;
}

const db = supabase as any;

export const useCommunityStore = create<CommunityState>((set, get) => ({
  activeChannel: "first_trimester",
  posts: [],
  loading: false,
  hasMore: true,

  setActiveChannel: (activeChannel) => {
    set({ activeChannel, posts: [], hasMore: true });
    get().fetchPosts(activeChannel);
  },

  fetchPosts: async (channel, cursor) => {
    set({ loading: true });
    const PAGE_SIZE = 20;
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from("community_posts")
      .select("*")
      .eq("channel", channel)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: postsData } = await query;

    if (!postsData) { set({ posts: [], loading: false }); return; }

    // Batch profile lookup with cache
    const userIds = [...new Set(postsData.map((p: any) => p.user_id))];
    const uncachedIds = userIds.filter(id => !queryCache.get(`profile:${id}`));
    
    if (uncachedIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", uncachedIds);
      
      (profiles || []).forEach((p: any) => {
        queryCache.set(`profile:${p.id}`, p, 5 * 60_000); // Cache 5 min
      });
    }

    const profileMap = new Map(
      userIds.map(id => [id, queryCache.get<any>(`profile:${id}`) || { full_name: "Anonymous" }])
    );

    let likedPostIds = new Set<string>();
    if (user) {
      const { data: likes } = await db
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postsData.map((p: any) => p.id));
      likedPostIds = new Set((likes || []).map((l: any) => l.post_id));
    }

    const newPosts: CommunityPost[] = postsData.map((p: any) => ({
      ...p,
      author_name: profileMap.get(p.user_id)?.full_name || "Anonymous",
      author_avatar: profileMap.get(p.user_id)?.avatar_url || undefined,
      liked_by_me: likedPostIds.has(p.id),
    }));

    set({
      posts: cursor ? [...get().posts, ...newPosts] : newPosts,
      hasMore: postsData.length === PAGE_SIZE,
      loading: false,
    });
  },

  loadMore: async () => {
    const { posts, activeChannel, loading, hasMore } = get();
    if (loading || !hasMore || posts.length === 0) return;
    const lastPost = posts[posts.length - 1];
    await get().fetchPosts(activeChannel, lastPost.created_at);
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
      // Award points for posting
      await usePointsStore.getState().awardPost(user.id);
      await get().fetchPosts(get().activeChannel);
      return true;
    }
    return false;
  },

  toggleLike: async (postId, userId) => {
    const post = get().posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic UI update first
    set({
      posts: get().posts.map(p =>
        p.id === postId
          ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1 }
          : p
      ),
    });

    if (post.liked_by_me) {
      await db.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
      await supabase.rpc("decrement_likes", { p_post_id: postId });
    } else {
      await db.from("post_likes").insert({ post_id: postId, user_id: userId });
      await supabase.rpc("increment_likes", { p_post_id: postId });
      await usePointsStore.getState().awardLike(userId);
    }
  },

  fetchComments: async (postId) => {
    const { data } = await db
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!data) return [];

    const userIds = [...new Set((data as any[]).map((c: any) => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return (data as any[]).map((c: any) => ({
      ...c,
      author_name: profileMap.get(c.user_id)?.full_name || "Anonymous",
      author_avatar: profileMap.get(c.user_id)?.avatar_url || undefined,
    }));
  },

  addComment: async (postId, content) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await db.from("post_comments").insert({
      post_id: postId,
      user_id: user.id,
      content,
    });

    if (!error) {
      await usePointsStore.getState().awardComment(user.id);
      // Atomic increment — no race condition
      await supabase.rpc("increment_comments", { p_post_id: postId });
      set({
        posts: get().posts.map(p =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        ),
      });
      return true;
    }
    return false;
  },
}));
