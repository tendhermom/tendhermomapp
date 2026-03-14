import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

const typeIcons: Record<string, string> = {
  medication: "medkit-outline",
  appointment: "calendar-outline",
  hydration: "water-outline",
};

export interface Reminder {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  time: string;
  type: "medication" | "appointment" | "hydration";
  done: boolean;
}

interface RemindersState {
  reminders: Reminder[];
  isLoading: boolean;
  fetchReminders: () => Promise<void>;
  addReminder: (reminder: Omit<Reminder, "id" | "done">) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
  reminders: [],
  isLoading: false,

  fetchReminders: async () => {
    set({ isLoading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ isLoading: false }); return; }

    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("time", { ascending: true });

    if (data) {
      set({
        reminders: data.map((r) => ({
          id: r.id,
          icon: typeIcons[r.type] || "alarm-outline",
          title: r.title,
          subtitle: "",
          time: r.time,
          type: r.type as Reminder["type"],
          done: r.done,
        })),
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  addReminder: async (reminder) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("reminders")
      .insert({
        user_id: user.id,
        title: reminder.title,
        type: reminder.type,
        time: reminder.time,
      })
      .select()
      .single();

    if (data && !error) {
      set((state) => ({
        reminders: [
          ...state.reminders,
          {
            id: data.id,
            icon: typeIcons[data.type] || "alarm-outline",
            title: data.title,
            subtitle: "",
            time: data.time,
            type: data.type as Reminder["type"],
            done: false,
          },
        ],
      }));
    }
  },

  toggleReminder: async (id) => {
    const r = get().reminders.find((r) => r.id === id);
    if (!r) return;
    const newDone = !r.done;
    set((state) => ({
      reminders: state.reminders.map((r) => (r.id === id ? { ...r, done: newDone } : r)),
    }));
    await supabase.from("reminders").update({ done: newDone }).eq("id", id);
  },

  removeReminder: async (id) => {
    set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) }));
    await supabase.from("reminders").delete().eq("id", id);
  },
}));
