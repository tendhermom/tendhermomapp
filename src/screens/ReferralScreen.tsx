import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { hapticLight, hapticSuccess } from "@/lib/despia";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Sentry } from "@/lib/sentry";
import { ListItemSkeleton } from "@/components/skeletons/Skeletons";

interface ReferralScreenProps {
  onBack: () => void;
}

interface Referral {
  id: string;
  referred_email: string | null;
  referred_phone: string | null;
  status: string;
  created_at: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const GOAL = 5;

const ReferralScreen = ({ onBack }: ReferralScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReferrals((data as Referral[]) || []);
        setLoading(false);
      });
  }, [user?.id]);

  const completedCount = referrals.filter((r) => r.status === "completed").length;
  const pendingCount = referrals.filter((r) => r.status === "pending").length;
  const progressPercent = Math.min((completedCount / GOAL) * 100, 100);
  const premiumUnlocked = completedCount >= GOAL;

  const formatPhone = (input: string): string => {
    let cleaned = input.replace(/[^\d+]/g, "");
    // Auto-prepend +234 if user types a local number starting with 0
    if (cleaned.startsWith("0") && cleaned.length >= 10) {
      cleaned = "+234" + cleaned.slice(1);
    }
    return cleaned;
  };

  const handleInviteByPhone = async () => {
    const formatted = formatPhone(phone.trim());
    if (formatted.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!user?.id) return;

    setSending(true);
    Sentry.addBreadcrumb({
      category: "referral",
      level: "info",
      message: "invite-send",
      data: { phoneLength: formatted.length },
    });
    try {
      const existing = referrals.find((r) => r.referred_phone === formatted);
      if (existing) {
        toast.error("You've already invited this number");
        setSending(false);
        return;
      }

      // Insert referral record
      const { error } = await supabase.from("referrals").insert({
        referrer_id: user.id,
        referred_email: "",
        referred_phone: formatted,
      });
      if (error) throw error;

      // Send SMS via edge function
      const { data: session } = await supabase.auth.getSession();
      const { error: smsError } = await supabase.functions.invoke("send-referral-sms", {
        body: { phone: formatted, referrer_name: user.full_name },
        headers: session?.session
          ? { Authorization: `Bearer ${session.session.access_token}` }
          : undefined,
      });
      if (smsError) throw smsError;

      hapticSuccess();
      toast.success("Invitation sent via SMS!");
      setPhone("");

      // Refresh list
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      setReferrals((data as Referral[]) || []);
    } catch (err: any) {
      Sentry.captureException(err, { tags: { feature: "referral-sms" } });
      toast.error(err.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "completed") return { bg: "hsl(var(--light-green))", color: "hsl(var(--green))", label: "Joined" };
    return { bg: "hsl(var(--light-coral))", color: "hsl(var(--coral))", label: "Pending" };
  };

  const getDisplayName = (ref: Referral) => {
    return ref.referred_phone || ref.referred_email || "—";
  };

  return (
    <motion.div
      className="space-y-5 pb-4"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <button onClick={onBack} className="ios-press">
          <IonIcon name="arrow-back" size={22} style={{ color: "hsl(var(--dark))" }} />
        </button>
        <h1 className="text-[24px] font-serif" style={{ color: "hsl(var(--dark))" }}>
          Refer & Earn
        </h1>
      </motion.div>

      {/* Progress Hero */}
      <motion.div variants={fadeUp} className="hero-card p-5 text-center">
        <div className="text-[40px] mb-1">{premiumUnlocked ? "🎉" : "🎁"}</div>
        <h2 className="text-white text-[20px] font-serif">
          {premiumUnlocked ? "TendherMom Plus Unlocked!" : "Invite 5 Friends, Get 60 Days Plus"}
        </h2>
        <p className="text-white/60 text-[12px] font-sans mt-1">
          {premiumUnlocked
            ? "Congratulations! You've earned 60 days of free TendherMom Plus access."
            : `${completedCount} of ${GOAL} friends joined • ${GOAL - completedCount} more to go`}
        </p>
        <div className="mt-4 px-4">
          <Progress value={progressPercent} className="h-2.5 bg-white/10" />
        </div>
        <div className="flex justify-between px-4 mt-1.5">
          <span className="text-[9px] font-sans font-semibold text-white/40 uppercase tracking-wider">
            {completedCount} joined
          </span>
          <span className="text-[9px] font-sans font-semibold text-white/40 uppercase tracking-wider">
            {GOAL} goal
          </span>
        </div>
      </motion.div>

      {/* Invite by Phone */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2">INVITE BY PHONE</p>
        <div className="tend-card p-4">
          <p className="text-[12px] font-sans mb-3" style={{ color: "hsl(var(--text-muted))" }}>
            Enter your friend's phone number and we'll send them a text with the download link.
          </p>
          <div className="flex gap-2">
            <div
              className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl"
              style={{ background: "hsl(var(--muted))" }}
            >
              <IonIcon name="call-outline" size={16} style={{ color: "hsl(var(--green))" }} />
              <input
                type="tel"
                placeholder="+234 801 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 text-[13px] font-sans border-none outline-none bg-transparent"
                style={{ color: "hsl(var(--dark))" }}
                onKeyDown={(e) => e.key === "Enter" && handleInviteByPhone()}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleInviteByPhone}
              disabled={sending}
              className="px-5 py-2.5 rounded-xl text-[13px] font-sans font-semibold text-white disabled:opacity-50"
              style={{ background: "hsl(var(--coral))" }}
            >
              {sending ? "…" : "Invite"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Rewards Info */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2">REWARDS</p>
        <div className="tend-card overflow-hidden">
          {[
            { icon: "diamond-outline", label: "5 referrals = 60 days Plus", desc: "Unlimited AI, SOS & more", color: "coral" },
            { icon: "trophy-outline", label: "+25 points per referral", desc: "Climb the leaderboard", color: "green" },
            { icon: "star-outline", label: "+50 bonus for Plus referral", desc: "When they upgrade", color: "coral" },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className="flex items-center px-4 py-3.5 gap-3"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--border-subtle))" : "none" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: item.color === "green" ? "hsl(var(--light-green))" : "hsl(var(--light-coral))",
                }}
              >
                <IonIcon
                  name={item.icon}
                  size={18}
                  style={{ color: item.color === "green" ? "hsl(var(--green))" : "hsl(var(--coral))" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                  {item.label}
                </p>
                <p className="text-[11px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Referral List */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-2">
          <p className="label-caps text-text-muted">
            YOUR REFERRALS ({referrals.length})
          </p>
          <div className="flex gap-3">
            <span className="text-[10px] font-sans font-semibold" style={{ color: "hsl(var(--green))" }}>
              {completedCount} joined
            </span>
            <span className="text-[10px] font-sans font-semibold" style={{ color: "hsl(var(--coral))" }}>
              {pendingCount} pending
            </span>
          </div>
        </div>

        {loading ? (
          <div className="tend-card overflow-hidden divide-y" style={{ borderColor: "hsl(var(--border-subtle))" }}>
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </div>
        ) : referrals.length === 0 ? (
          <div className="tend-card p-8 text-center">
            <div
              className="w-[56px] h-[56px] rounded-full mx-auto flex items-center justify-center mb-3"
              style={{ background: "hsl(var(--light-coral))" }}
            >
              <IonIcon name="paper-plane-outline" size={26} style={{ color: "hsl(var(--coral))" }} />
            </div>
            <p className="text-[15px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
              No referrals yet
            </p>
            <p className="text-[12px] font-sans mt-1 leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
              Invite a friend above and you'll see their status appear here.
            </p>
          </div>
        ) : (
          <div className="tend-card overflow-hidden">
            {referrals.map((ref, i) => {
              const style = getStatusStyle(ref.status);
              return (
                <div
                  key={ref.id}
                  className="flex items-center px-4 py-3 gap-3"
                  style={{
                    borderBottom: i < referrals.length - 1 ? "1px solid hsl(var(--border-subtle))" : "none",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: style.bg }}
                  >
                    <IonIcon
                      name={ref.status === "completed" ? "checkmark-circle" : "time-outline"}
                      size={16}
                      style={{ color: style.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-sans font-medium truncate" style={{ color: "hsl(var(--dark))" }}>
                      {getDisplayName(ref)}
                    </p>
                    <p className="text-[10px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                      {new Date(ref.created_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: style.bg, color: style.color }}
                  >
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReferralScreen;
