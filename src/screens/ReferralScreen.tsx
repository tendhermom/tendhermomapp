import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface ReferralScreenProps {
  onBack: () => void;
}

const REFERRAL_TARGET = 10;

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  created_at: string;
}

const ReferralScreen = ({ onBack }: ReferralScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.id) fetchReferrals();
  }, [user?.id]);

  const fetchReferrals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });
    setReferrals((data as Referral[]) || []);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!user || !email.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email");
      return;
    }
    if (referrals.some((r) => r.referred_email === email.trim())) {
      toast.error("You've already invited this person");
      return;
    }

    setSending(true);
    const { error } = await supabase.from("referrals").insert({
      referrer_id: user.id,
      referred_email: email.trim(),
    });

    if (error) {
      toast.error("Failed to send invite");
    } else {
      toast.success("Invite sent!");
      setEmail("");
      fetchReferrals();
    }
    setSending(false);
  };

  const handleShare = async () => {
    const shareText = `Hey! Join me on TendherMom — the best maternal health app for Nigerian mums. Sign up with my referral: ${user?.email || ""}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join TendherMom", text: shareText });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Referral link copied!");
    }
  };

  const completedReferrals = referrals.filter((r) => r.status === "completed").length;
  const totalReferrals = referrals.length;
  const remaining = Math.max(0, REFERRAL_TARGET - completedReferrals);
  const progress = (completedReferrals / REFERRAL_TARGET) * 100;
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center ios-press"
          style={{ background: "hsl(var(--light-green))" }}
        >
          <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--green))" }} />
        </motion.button>
        <div>
          <h1 className="font-serif" style={{ fontSize: "26px", color: "hsl(var(--dark))" }}>Free Antenatal</h1>
          <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Refer friends, earn free care</p>
        </div>
      </div>

      {/* Progress hero */}
      <div className="hero-card p-6">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative w-[120px] h-[120px] mb-4">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="52" fill="none"
                stroke="hsl(var(--coral))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
                transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white text-[28px] font-bold font-sans">{completedReferrals}</span>
              <span className="text-white/50 text-[11px] font-sans">of {REFERRAL_TARGET}</span>
            </div>
          </div>
          <h3 className="text-white text-[18px] font-serif">
            {remaining > 0 ? `${remaining} more to go!` : "You did it!"}
          </h3>
          <p className="text-white/50 text-[13px] font-sans mt-1">
            {remaining > 0
              ? "Refer friends to unlock free antenatal care"
              : "Claim your free antenatal care below"}
          </p>
        </div>
      </div>

      {/* Invite by email */}
      <div className="tend-card p-4 space-y-3">
        <h3 className="text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
          Invite a Friend
        </h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@email.com"
            className="flex-1 px-4 py-3 rounded-xl text-[14px] font-sans outline-none"
            style={{
              background: "hsl(var(--bg))",
              color: "hsl(var(--dark))",
              border: "1.5px solid hsl(var(--border-subtle))",
            }}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleInvite}
            disabled={sending || !email.trim()}
            className="px-4 py-3 rounded-xl font-sans font-semibold text-[13px]"
            style={{
              background: "hsl(var(--green))",
              color: "white",
              opacity: sending || !email.trim() ? 0.6 : 1,
            }}
          >
            {sending ? "..." : "Invite"}
          </motion.button>
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="font-serif text-[20px] mb-3" style={{ color: "hsl(var(--dark))" }}>How It Works</h2>
        <div className="tend-card overflow-hidden">
          {[
            { step: "1", text: "Share your referral link with friends", icon: "share-social-outline" },
            { step: "2", text: "They sign up and start using TendherMom", icon: "person-add-outline" },
            { step: "3", text: `Complete ${REFERRAL_TARGET} referrals for free antenatal`, icon: "gift-outline" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 px-[18px] py-[15px]"
              style={{ borderBottom: i < 2 ? "0.5px solid hsl(var(--border))" : "none" }}
            >
              <div
                className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--light-green))" }}
              >
                <IonIcon name={item.icon} size={18} style={{ color: "hsl(var(--green))" }} />
              </div>
              <span className="text-[14px] font-sans flex-1" style={{ color: "hsl(var(--dark))" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Referral history */}
      {referrals.length > 0 && (
        <div>
          <h2 className="font-serif text-[20px] mb-3" style={{ color: "hsl(var(--dark))" }}>
            Your Referrals ({totalReferrals})
          </h2>
          <div className="tend-card overflow-hidden">
            {referrals.map((ref, i) => (
              <div
                key={ref.id}
                className="flex items-center gap-3 px-[18px] py-[13px]"
                style={{ borderBottom: i < referrals.length - 1 ? "0.5px solid hsl(var(--border))" : "none" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--light-green))" }}
                >
                  <IonIcon name="person-outline" size={16} style={{ color: "hsl(var(--green))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-sans font-medium truncate" style={{ color: "hsl(var(--dark))" }}>
                    {ref.referred_email}
                  </p>
                </div>
                <span
                  className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: ref.status === "completed" ? "hsl(var(--light-green))" : "hsl(var(--light-coral))",
                    color: ref.status === "completed" ? "hsl(var(--green))" : "hsl(var(--coral))",
                  }}
                >
                  {ref.status === "completed" ? "Joined" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleShare}
        className="w-full py-[16px] rounded-2xl text-[15px] font-bold font-sans flex items-center justify-center gap-2"
        style={{ background: "hsl(var(--green))", color: "white" }}
      >
        <IonIcon name="share-social" size={20} style={{ color: "white" }} />
        Share Referral Link
      </motion.button>
    </div>
  );
};

export default ReferralScreen;
