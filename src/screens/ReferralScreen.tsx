import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { nativeShare, hapticLight, hapticSuccess } from "@/lib/despia";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface ReferralScreenProps {
  onBack: () => void;
}

interface Referral {
  id: string;
  referred_email: string;
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
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const referralLink = `https://tendhermomapp.lovable.app/signup?ref=${user?.id?.slice(0, 8) || ""}`;

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

  const handleShareLink = () => {
    hapticLight();
    nativeShare({
      title: "Join TendherMom",
      text: "Hey mama! Join TendherMom — maternal health support built for Nigerian mothers 💚",
      url: referralLink,
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      hapticSuccess();
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleInviteByEmail = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!user?.id) return;

    setSending(true);
    try {
      const existing = referrals.find((r) => r.referred_email === email.trim().toLowerCase());
      if (existing) {
        toast.error("You've already invited this person");
        setSending(false);
        return;
      }

      const { error } = await supabase.from("referrals").insert({
        referrer_id: user.id,
        referred_email: email.trim().toLowerCase(),
      });

      if (error) throw error;

      hapticSuccess();
      toast.success("Invitation sent!");
      setEmail("");

      // Refresh list
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      setReferrals((data as Referral[]) || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "completed") return { bg: "hsl(var(--light-green))", color: "hsl(var(--green))", label: "Joined" };
    return { bg: "hsl(var(--light-coral))", color: "hsl(var(--coral))", label: "Pending" };
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
          {premiumUnlocked ? "Premium Unlocked!" : "Invite 10 Friends, Get Premium Free"}
        </h2>
        <p className="text-white/60 text-[12px] font-sans mt-1">
          {premiumUnlocked
            ? "Congratulations! You've earned free Premium access."
            : `${completedCount} of ${GOAL} friends joined • ${GOAL - completedCount} more to go`}
        </p>
        <div className="mt-4 px-4">
          <Progress
            value={progressPercent}
            className="h-2.5 bg-white/10"
          />
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

      {/* Share Actions */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2">SHARE YOUR LINK</p>
        <div className="tend-card p-4 space-y-3">
          {/* Referral link preview */}
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-[12px] font-mono truncate"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--dark))" }}
          >
            <IonIcon name="link-outline" size={16} style={{ color: "hsl(var(--green))" }} />
            <span className="truncate flex-1">{referralLink}</span>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-sans font-semibold"
              style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
            >
              <IonIcon name="copy-outline" size={16} />
              Copy Link
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleShareLink}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-sans font-semibold text-white"
              style={{ background: "hsl(var(--green))" }}
            >
              <IonIcon name="share-social-outline" size={16} />
              Share
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Invite by Email */}
      <motion.div variants={fadeUp}>
        <p className="label-caps text-text-muted mb-2">INVITE BY EMAIL</p>
        <div className="tend-card p-4">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="friend@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl text-[13px] font-sans border-none outline-none"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--dark))" }}
              onKeyDown={(e) => e.key === "Enter" && handleInviteByEmail()}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleInviteByEmail}
              disabled={sending}
              className="px-4 py-2.5 rounded-xl text-[13px] font-sans font-semibold text-white disabled:opacity-50"
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
            { icon: "diamond-outline", label: "10 referrals = Free Premium", desc: "Unlimited AI, SOS & more", color: "coral" },
            { icon: "trophy-outline", label: "+25 points per referral", desc: "Climb the leaderboard", color: "green" },
            { icon: "star-outline", label: "+50 bonus for premium referral", desc: "When they upgrade", color: "coral" },
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
          <div className="flex items-center justify-center py-12">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }}
            />
          </div>
        ) : referrals.length === 0 ? (
          <div className="tend-card p-8 text-center">
            <div className="text-[32px] mb-2">👋</div>
            <p className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>
              No referrals yet
            </p>
            <p className="text-[12px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
              Share your link and start earning rewards!
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
                      {ref.referred_email}
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
