import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import IonIcon from "@/components/IonIcon";
import { compressImage } from "@/lib/imageCompression";

type StatusMsg = { kind: "error" | "success" | "info"; text: string } | null;

interface EditProfileScreenProps {
  onBack: () => void;
}

const EditProfileScreen = ({ onBack }: EditProfileScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [babyName, setBabyName] = useState(user?.baby_name || "");
  const [dueDate, setDueDate] = useState(user?.due_date || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<StatusMsg>(null);

  const showStatus = (msg: StatusMsg, autoHide = 3500) => {
    setStatus(msg);
    if (msg && autoHide) setTimeout(() => setStatus(null), autoHide);
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      showStatus({ kind: "error", text: "Image must be under 5MB." });
      return;
    }

    // Compress image before upload
    file = await compressImage(file, { maxDimension: 400, quality: 0.85, maxSizeKB: 200 });

    setUploading(true);
    setStatus(null);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      showStatus({ kind: "error", text: "Avatar upload failed. Try again." });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) {
      showStatus({ kind: "error", text: "Couldn't save avatar. Try again." });
    } else {
      await fetchProfile(user.id);
      showStatus({ kind: "success", text: "Avatar updated." });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      showStatus({ kind: "error", text: "Name is required." });
      return;
    }

    setSaving(true);
    setStatus(null);
    const updates: Record<string, unknown> = {
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      baby_name: babyName.trim() || null,
      due_date: dueDate || null,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      showStatus({ kind: "error", text: "Couldn't save profile. Try again." });
      setSaving(false);
    } else {
      await fetchProfile(user.id);
      setSaving(false);
      onBack();
    }
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-1">
          <IonIcon name="chevron-back-outline" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>
          Edit Profile
        </h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div
            className="w-[80px] h-[80px] rounded-full flex items-center justify-center overflow-hidden"
            style={{ background: "hsl(var(--green))" }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-[28px] font-bold font-sans">{initials}</span>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--coral))" }}
          >
            <IonIcon name="camera-outline" size={16} style={{ color: "white" }} />
          </motion.button>
        </div>
        {uploading && (
          <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Uploading…</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
      </div>

      {/* Form */}
      <div className="space-y-4">
        <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="Your name" />
        <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+234..." type="tel" />
        <Field label="Baby's Name" value={babyName} onChange={setBabyName} placeholder="Nickname or name" />
        <div>
          <label className="text-[12px] font-sans font-semibold mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-[15px] font-sans outline-none"
            style={{
              background: "hsl(var(--surface))",
              color: "hsl(var(--dark))",
              border: "1.5px solid hsl(var(--border-subtle))",
            }}
          />
        </div>

        {/* Read-only fields */}
        <div>
          <label className="text-[12px] font-sans font-semibold mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
            Email
          </label>
          <div
            className="w-full px-4 py-3 rounded-xl text-[15px] font-sans"
            style={{
              background: "hsl(var(--border-subtle))",
              color: "hsl(var(--text-muted))",
              border: "1.5px solid hsl(var(--border-subtle))",
            }}
          >
            {user?.email || "—"}
          </div>
        </div>

        <div>
          <label className="text-[12px] font-sans font-semibold mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
            Trimester
          </label>
          <div
            className="w-full px-4 py-3 rounded-xl text-[15px] font-sans capitalize"
            style={{
              background: "hsl(var(--border-subtle))",
              color: "hsl(var(--text-muted))",
              border: "1.5px solid hsl(var(--border-subtle))",
            }}
          >
            {user?.current_stage?.replace("_", " ") || "—"}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="px-4 py-3 rounded-2xl flex items-start gap-2"
            style={{
              background:
                status.kind === "error"
                  ? "hsl(var(--light-coral))"
                  : status.kind === "success"
                  ? "hsl(var(--light-green))"
                  : "hsl(var(--surface))",
            }}
          >
            <IonIcon
              name={status.kind === "error" ? "alert-circle" : status.kind === "success" ? "checkmark-circle" : "information-circle"}
              size={18}
              style={{ color: status.kind === "error" ? "hsl(var(--coral))" : "hsl(var(--green))" }}
            />
            <span className="text-[13px] font-sans" style={{ color: "hsl(var(--dark))" }}>
              {status.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center"
        style={{ background: "hsl(var(--green))", color: "white", opacity: saving ? 0.7 : 1 }}
      >
        {saving ? "Saving…" : "Save Changes"}
      </motion.button>
    </div>
  );
};

const Field = ({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) => (
  <div>
    <label className="text-[12px] font-sans font-semibold mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl text-[15px] font-sans outline-none"
      style={{
        background: "hsl(var(--surface))",
        color: "hsl(var(--dark))",
        border: "1.5px solid hsl(var(--border-subtle))",
      }}
    />
  </div>
);

export default EditProfileScreen;
