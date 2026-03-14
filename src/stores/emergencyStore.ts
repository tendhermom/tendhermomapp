import { create } from "zustand";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  whatsapp: boolean;
  email: string | null;
  channels: ("sms" | "whatsapp" | "email")[];
}

interface EmergencyState {
  contacts: EmergencyContact[];
  isSending: boolean;
  lastAlert: { sentAt: string; contactsNotified: number } | null;
  setContacts: (contacts: EmergencyContact[]) => void;
  setSending: (sending: boolean) => void;
  setLastAlert: (alert: EmergencyState["lastAlert"]) => void;
}

export const useEmergencyStore = create<EmergencyState>((set) => ({
  contacts: [
    {
      id: "1",
      name: "Chidi Okafor",
      phone: "+2348023456789",
      relationship: "Husband",
      whatsapp: true,
      email: "chidi@email.com",
      channels: ["sms", "whatsapp", "email"],
    },
  ],
  isSending: false,
  lastAlert: null,
  setContacts: (contacts) => set({ contacts }),
  setSending: (isSending) => set({ isSending }),
  setLastAlert: (lastAlert) => set({ lastAlert }),
}));
