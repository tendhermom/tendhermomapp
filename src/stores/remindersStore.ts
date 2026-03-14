import { create } from "zustand";

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
  addReminder: (reminder: Omit<Reminder, "id" | "done">) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;
}

const defaultReminders: Reminder[] = [
  {
    id: "1",
    icon: "medkit-outline",
    title: "Prenatal Vitamins",
    subtitle: "Take with breakfast",
    time: "8:00 AM",
    type: "medication",
    done: false,
  },
  {
    id: "2",
    icon: "calendar-outline",
    title: "Dr. Adaeze – Checkup",
    subtitle: "Lagos Women's Clinic",
    time: "10:30 AM",
    type: "appointment",
    done: false,
  },
  {
    id: "3",
    icon: "water-outline",
    title: "Drink Water",
    subtitle: "Glass 4 of 8 today",
    time: "12:00 PM",
    type: "hydration",
    done: false,
  },
];

export const useRemindersStore = create<RemindersState>((set) => ({
  reminders: defaultReminders,

  addReminder: (reminder) =>
    set((state) => ({
      reminders: [
        ...state.reminders,
        { ...reminder, id: Date.now().toString(), done: false },
      ],
    })),

  toggleReminder: (id) =>
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, done: !r.done } : r
      ),
    })),

  removeReminder: (id) =>
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    })),
}));
