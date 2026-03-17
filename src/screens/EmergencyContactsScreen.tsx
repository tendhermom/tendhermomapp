import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  whatsapp_number: string | null;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  voice_enabled: boolean;
  is_primary: boolean;
}

interface EmergencyContactsScreenProps {
  onBack: () => void;
}

const RELATIONSHIPS = ["Husband", "Mother", "Sister", "Friend", "Brother", "Father", "Other"];
const PHONE_REGEX = /^\+234[0-9]{10}$/;

const emptyContact: Omit<EmergencyContact, "id"> = {
  name: "",
  phone: "",
  relationship: null,
  whatsapp_number: null,
  sms_enabled: true,
  whatsapp_enabled: false,
  voice_enabled: false,
  is_primary: false,
};

const EmergencyContactsScreen = ({ onBack }: EmergencyContactsScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const isFree = user?.plan_type === "free";
  const maxContacts = isFree ? 1 : 5;

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<Partial<EmergencyContact> | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false });
    if (data) {
      setContacts(data.map((c: any) => ({
        ...c,
        voice_enabled: c.email_enabled ?? false, // repurpose email_enabled column for voice
      })));
    }
    setLoading(false);
  };

  const validate = (c: Partial<EmergencyContact>) => {
    const errs: Record<string, string> = {};
    if (!c.name?.trim()) errs.name = "Name is required";
    if (!c.phone?.trim()) errs.phone = "Phone number is required";
    else if (!PHONE_REGEX.test(c.phone.replace(/\s/g, "")))
      errs.phone = "Enter a valid Nigerian phone number (+234XXXXXXXXXX)";
    if (c.whatsapp_enabled && c.whatsapp_number && !PHONE_REGEX.test(c.whatsapp_number.replace(/\s/g, "")))
      errs.whatsapp_number = "Enter a valid Nigerian phone number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!editingContact || !user) return;
    if (!validate(editingContact)) return;

    setSaving(true);
    const payload = {
      user_id: user.id,
      name: editingContact.name!.trim(),
      phone: editingContact.phone!.replace(/\s/g, ""),
      relationship: editingContact.relationship || null,
      whatsapp_number: editingContact.whatsapp_number?.replace(/\s/g, "") || null,
      email: null,
      sms_enabled: editingContact.sms_enabled ?? true,
      whatsapp_enabled: editingContact.whatsapp_enabled ?? false,
      email_enabled: editingContact.voice_enabled ?? false, // store voice in email_enabled column
      is_primary: contacts.length === 0,
    };

    if (editingContact.id) {
      const { error } = await supabase
        .from("emergency_contacts")
        .update(payload)
        .eq("id", editingContact.id);
      if (error) toast.error("Failed to update contact");
      else toast.success("Contact updated");
    } else {
      const { error } = await supabase.from("emergency_contacts").insert(payload);
      if (error) toast.error("Failed to add contact");
      else toast.success("Contact added");
    }

    setSaving(false);
    setEditingContact(null);
    fetchContacts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
    if (error) toast.error("Failed to delete contact");
    else {
      toast.success("Contact removed");
      fetchContacts();
    }
  };

  const handleSendTest = async () => {
    toast.info("Sending test alert to all contacts…");
    try {
      const contactsPayload = contacts.map((c) => ({
        name: c.name,
        phone: c.phone,
        whatsapp: c.whatsapp_number || c.phone,
        channels: [
          ...(c.sms_enabled ? ["sms" as const] : []),
          ...(c.whatsapp_enabled ? ["whatsapp" as const] : []),
          ...(c.voice_enabled ? ["voice" as const] : []),
        ],
      }));

      await supabase.functions.invoke("send-sos", {
        body: {
          user_id: user?.id,
          user_name: user?.full_name,
          user_phone: user?.phone,
          latitude: null,
          longitude: null,
          contacts: contactsPayload,
          is_test: true,
        },
      });

      await supabase.from("emergency_alerts").insert({
        user_id: user!.id,
        contacts_notified: contacts.length,
        is_test: true,
      });

      toast.success("Test alert sent successfully");
    } catch {
      toast.error("Failed to send test alert");
    }
  };

  if (editingContact) {
    return (
      <div className="space-y-5 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3 pt-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditingContact(null); setErrors({}); }}>
            <IonIcon name="arrow-back" size={24} style={{ color: "hsl(var(--dark))" }} />
          </motion.button>
          <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>
            {editingContact.id ? "Edit Contact" : "Add Contact"}
          </h1>
        </div>

        {/* Form */}
        <div className="tend-card p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
              Full Name
            </label>
            <input
              type="text"
              value={editingContact.name || ""}
              onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
              placeholder="e.g. Chidi Okafor"
              className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
              style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
            />
            {errors.name && <p className="text-[12px] font-sans mt-1" style={{ color: "hsl(var(--coral))" }}>{errors.name}</p>}
          </div>

          {/* Relationship */}
          <div>
            <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
              Relationship
            </label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map((r) => (
                <motion.button
                  key={r}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditingContact({ ...editingContact, relationship: r })}
                  className="px-3 py-1.5 rounded-full text-[13px] font-sans font-medium"
                  style={{
                    background: editingContact.relationship === r ? "hsl(var(--green))" : "hsl(var(--bg))",
                    color: editingContact.relationship === r ? "white" : "hsl(var(--dark))",
                  }}
                >
                  {r}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={editingContact.phone || ""}
              onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
              placeholder="+234XXXXXXXXXX"
              className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
              style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
            />
            {errors.phone && <p className="text-[12px] font-sans mt-1" style={{ color: "hsl(var(--coral))" }}>{errors.phone}</p>}
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
              WhatsApp Number <span className="font-normal" style={{ color: "hsl(var(--text-muted))" }}>(if different)</span>
            </label>
            <input
              type="tel"
              value={editingContact.whatsapp_number || ""}
              onChange={(e) => setEditingContact({ ...editingContact, whatsapp_number: e.target.value })}
              placeholder="Same as phone if empty"
              className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
              style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
            />
            {errors.whatsapp_number && <p className="text-[12px] font-sans mt-1" style={{ color: "hsl(var(--coral))" }}>{errors.whatsapp_number}</p>}
          </div>
        </div>

        {/* Channel toggles */}
        <div className="tend-card p-5 space-y-4">
          <h4 className="text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
            Alert Channels
          </h4>
          {[
            { key: "sms_enabled", label: "SMS", icon: "chatbubble", desc: "Text message via Twilio" },
            { key: "whatsapp_enabled", label: "WhatsApp", icon: "logo-whatsapp", desc: "WhatsApp message via Twilio" },
            { key: "voice_enabled", label: "Voice Call", icon: "call", desc: "Automated call via Termii" },
          ].map((ch) => (
            <div key={ch.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <IonIcon name={ch.icon} size={18} style={{ color: "hsl(var(--green))" }} />
                <div>
                  <span className="text-[14px] font-sans block" style={{ color: "hsl(var(--dark))" }}>{ch.label}</span>
                  <span className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{ch.desc}</span>
                </div>
              </div>
              <Switch
                checked={(editingContact as any)[ch.key] ?? false}
                onCheckedChange={(val) => setEditingContact({ ...editingContact, [ch.key]: val })}
              />
            </div>
          ))}
        </div>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans disabled:opacity-60"
          style={{ background: "hsl(var(--green))" }}
        >
          {saving ? "Saving…" : editingContact.id ? "Update Contact" : "Add Contact"}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}>
          <IonIcon name="arrow-back" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif text-[22px] flex-1" style={{ color: "hsl(var(--dark))" }}>
          Emergency Contacts
        </h1>
        {contacts.length < maxContacts && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setEditingContact({ ...emptyContact })}
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--green))" }}
          >
            <IonIcon name="add" size={20} style={{ color: "white" }} />
          </motion.button>
        )}
      </div>

      {/* Contacts list */}
      {loading ? (
        <div className="tend-card p-6 text-center">
          <span className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Loading…</span>
        </div>
      ) : contacts.length === 0 ? (
        <div className="tend-card p-8 text-center">
          <div className="w-[60px] h-[60px] rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: "hsl(var(--light-coral))" }}>
            <IonIcon name="person-add" size={28} style={{ color: "hsl(var(--coral))" }} />
          </div>
          <h3 className="font-serif text-[18px] mb-1" style={{ color: "hsl(var(--dark))" }}>No Contacts Yet</h3>
          <p className="text-[13px] font-sans mb-4" style={{ color: "hsl(var(--text-muted))" }}>
            Add emergency contacts who will be alerted when you trigger SOS.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditingContact({ ...emptyContact })}
            className="px-5 py-2.5 rounded-full text-[14px] font-semibold font-sans text-white"
            style={{ background: "hsl(var(--green))" }}
          >
            Add Your First Contact
          </motion.button>
        </div>
      ) : (
        <div className="tend-card overflow-hidden">
          {contacts.map((c, i) => (
            <motion.div
              key={c.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setEditingContact({ ...c })}
              className="flex items-center gap-3 px-[18px] py-[14px] cursor-pointer"
              style={{ borderBottom: i < contacts.length - 1 ? "0.5px solid hsl(var(--border))" : "none" }}
            >
              <div
                className="w-[44px] h-[44px] rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--light-green))" }}
              >
                <span className="text-[14px] font-bold font-sans" style={{ color: "hsl(var(--green))" }}>
                  {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>{c.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                    {c.relationship || "Contact"}
                  </span>
                  <span className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>·</span>
                  <span className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{c.phone}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {c.sms_enabled && <span className="text-[9px] font-sans font-semibold px-1.5 py-[1px] rounded-full" style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}>SMS</span>}
                  {c.whatsapp_enabled && <span className="text-[9px] font-sans font-semibold px-1.5 py-[1px] rounded-full" style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}>WhatsApp</span>}
                  {c.voice_enabled && <span className="text-[9px] font-sans font-semibold px-1.5 py-[1px] rounded-full" style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}>Voice</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c.id);
                  }}
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--light-coral))" }}
                >
                  <IonIcon name="trash" size={14} style={{ color: "hsl(var(--coral))" }} />
                </motion.button>
                <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--border))" }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Test alert button */}
      {contacts.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSendTest}
          className="w-full tend-card py-[15px] flex items-center justify-center gap-2"
        >
          <IonIcon name="paper-plane" size={18} style={{ color: "hsl(var(--coral))" }} />
          <span className="text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--coral))" }}>
            Send Test Alert
          </span>
        </motion.button>
      )}
    </div>
  );
};

export default EmergencyContactsScreen;
