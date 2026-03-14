import { create } from "zustand";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  due_date: string | null;
  lmp_date: string | null;
  birth_date: string | null;
  baby_name: string | null;
  plan_type: "free" | "premium";
  current_stage: "first_trimester" | "second_trimester" | "third_trimester" | "postpartum";
  phone: string | null;
  can_post: boolean;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  getCurrentWeek: () => number;
  getDaysRemaining: () => number;
  getProgressPercent: () => number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: {
    id: "demo-user",
    full_name: "Amara Okafor",
    email: "amara@email.com",
    due_date: "2026-06-15",
    lmp_date: "2025-09-08",
    birth_date: null,
    baby_name: null,
    plan_type: "free",
    current_stage: "third_trimester",
    phone: "+2348012345678",
    can_post: true,
  },
  isAuthenticated: true,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false }),

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
