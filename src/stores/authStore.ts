import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  due_date: string | null;
  lmp_date: string | null;
  birth_date: string | null;
  baby_name: string | null;
  plan_type: "free" | "premium";
  current_stage: "first_trimester" | "second_trimester" | "third_trimester" | "postpartum";
  phone: string | null;
  can_post: boolean;
  avatar_url: string | null;
  user_type: "mother";
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentWeek: () => number;
  getDaysRemaining: () => number;
  getProgressPercent: () => number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchProfile: async (userId: string) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data && !error) {
      set({
        user: {
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          due_date: data.due_date,
          lmp_date: data.lmp_date,
          birth_date: data.birth_date,
          baby_name: data.baby_name,
          plan_type: data.plan_type as "free" | "premium",
          current_stage: data.current_stage as UserProfile["current_stage"],
          phone: data.phone,
          can_post: data.can_post,
          avatar_url: data.avatar_url,
          user_type: "mother",
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  getCurrentWeek: () => {
    const { user } = get();
    if (!user?.lmp_date) return 1;
    const lmp = new Date(user.lmp_date);
    const now = new Date();
    const diffMs = now.getTime() - lmp.getTime();
    const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(weeks, 42));
  },

  getDaysRemaining: () => {
    const { user } = get();
    if (!user?.due_date) return 0;
    const due = new Date(user.due_date);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  },

  getProgressPercent: () => {
    const week = get().getCurrentWeek();
    return Math.round((week / 40) * 100);
  },
}));
