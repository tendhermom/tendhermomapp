import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

// Points config
const POINTS_PER_POST = 10;
const POINTS_PER_LIKE = 2;
const POINTS_PER_COMMENT = 5;

export interface UserPoints {
  points: number;
  posts_count: number;
  likes_count: number;
  comments_count: number;
}

export const LEVELS = [
  { name: "Newcomer", min: 0, icon: "🌱" },
  { name: "Active Mom", min: 25, icon: "🌿" },
  { name: "Community Star", min: 100, icon: "⭐" },
  { name: "Super Mom", min: 250, icon: "💫" },
  { name: "Legend", min: 500, icon: "👑" },
];

export const getLevel = (points: number) => {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.min) level = l;
  }
  return level;
};

export const getNextLevel = (points: number) => {
  for (const l of LEVELS) {
    if (points < l.min) return l;
  }
  return null;
};

const db = supabase as any;

interface PointsState {
  userPoints: UserPoints | null;
  loading: boolean;
  fetchPoints: (userId: string) => Promise<void>;
  awardPost: (userId: string) => Promise<void>;
  awardLike: (userId: string) => Promise<void>;
  awardComment: (userId: string) => Promise<void>;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  userPoints: null,
  loading: false,

  fetchPoints: async (userId) => {
    set({ loading: true });
    const { data } = await db
      .from("community_points")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      set({ userPoints: { points: data.points, posts_count: data.posts_count, likes_count: data.likes_count, comments_count: data.comments_count }, loading: false });
    } else {
      // Create initial row
      await db.from("community_points").insert({ user_id: userId, points: 0, posts_count: 0, likes_count: 0, comments_count: 0 });
      set({ userPoints: { points: 0, posts_count: 0, likes_count: 0, comments_count: 0 }, loading: false });
    }
  },

  awardPost: async (userId) => {
    const current = get().userPoints;
    if (!current) return;
    const newPoints = current.points + POINTS_PER_POST;
    const newPosts = current.posts_count + 1;
    await db.from("community_points").update({ points: newPoints, posts_count: newPosts, updated_at: new Date().toISOString() }).eq("user_id", userId);
    set({ userPoints: { ...current, points: newPoints, posts_count: newPosts } });
  },

  awardLike: async (userId) => {
    const current = get().userPoints;
    if (!current) return;
    const newPoints = current.points + POINTS_PER_LIKE;
    const newLikes = current.likes_count + 1;
    await db.from("community_points").update({ points: newPoints, likes_count: newLikes, updated_at: new Date().toISOString() }).eq("user_id", userId);
    set({ userPoints: { ...current, points: newPoints, likes_count: newLikes } });
  },

  awardComment: async (userId) => {
    const current = get().userPoints;
    if (!current) return;
    const newPoints = current.points + POINTS_PER_COMMENT;
    const newComments = current.comments_count + 1;
    await db.from("community_points").update({ points: newPoints, comments_count: newComments, updated_at: new Date().toISOString() }).eq("user_id", userId);
    set({ userPoints: { ...current, points: newPoints, comments_count: newComments } });
  },
}));
