import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

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

const awardPoints = async (userId: string, points: number, field: string): Promise<UserPoints | null> => {
  const { data, error } = await db.rpc("award_community_points", {
    _user_id: userId,
    _points_to_add: points,
    _field: field,
  });
  if (error || !data) return null;
  return {
    points: data.points,
    posts_count: data.posts_count,
    likes_count: data.likes_count,
    comments_count: data.comments_count,
  };
};

export const usePointsStore = create<PointsState>((set) => ({
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
      // Use atomic upsert to create initial row
      const result = await awardPoints(userId, 0, "posts_count");
      set({ userPoints: result || { points: 0, posts_count: 0, likes_count: 0, comments_count: 0 }, loading: false });
    }
  },

  awardPost: async (userId) => {
    const result = await awardPoints(userId, POINTS_PER_POST, "posts_count");
    if (result) set({ userPoints: result });
  },

  awardLike: async (userId) => {
    const result = await awardPoints(userId, POINTS_PER_LIKE, "likes_count");
    if (result) set({ userPoints: result });
  },

  awardComment: async (userId) => {
    const result = await awardPoints(userId, POINTS_PER_COMMENT, "comments_count");
    if (result) set({ userPoints: result });
  },
}));
