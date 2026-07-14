import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface GiftSettingsScreenProps {
  onBack: () => void;
}

const GiftSettingsScreen = ({ onBack }: GiftSettingsScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await (supabase as any)
        .from("profiles")
        .select("gift_account_name, gift_account_number, gift_bank_name, full_name")
        .eq("id", user.id)
        .maybeSingle();
      setAccountName(data?.gift_account_name || data?.full_name || "");
      setAccountNumber(data?.gift_account_number || "");
      setBankName(data?.gift_bank_name || "");
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        gift_account_name: accountName.trim(),
        gift_account_number: accountNumber.trim(),
        gift_bank_name: bankName.trim(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save gift settings");
      return;
    }
    toast.success("Gift settings saved 🎁");
  };

  return (
    <div className="space-y-5 pb-6 pt-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
          style={{ background: "hsl(var(--surface))" }}
        >
          <IonIcon name="arrow-back" size={20} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <div className="flex-1">
          <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>Gift Settings</h1>
          <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
            For P2P Baby Shower gifts
          </p>
        </div>
      </div>

      {/* Info card */}
      <div className="tend-card p-4">
        <div className="flex items-start gap-3">
          <div className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--light-coral))" }}>
            <IonIcon name="gift-outline" size={20} style={{ color: "hsl(var(--coral))" }} />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
              Receive gifts directly
            </h3>
            <p className="text-[12px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
              Your account details show when other mums tap <b>Gift</b> on your Baby Shower post.
              Transfers go straight to your bank — TendherMom never touches the money.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--coral))", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div className="tend-card p-5 space-y-4">
          <div>
            <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. Ngozi Okafor"
              className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
              style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
              Account Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="10-digit account number"
              maxLength={10}
              className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none tracking-wider"
              style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
              Bank Name
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. GTBank"
              className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
              style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans disabled:opacity-60"
            style={{ background: "hsl(var(--green))" }}
          >
            {saving ? "Saving…" : "Save Gift Settings"}
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default GiftSettingsScreen;
