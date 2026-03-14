import { create } from "zustand";

type ChannelId = "first" | "second" | "third" | "motherhood" | "shower";

interface CommunityState {
  activeTab: ChannelId;
  setActiveTab: (tab: ChannelId) => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  activeTab: "third",
  setActiveTab: (activeTab) => set({ activeTab }),
}));
