import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface ModerationScreenProps {
  onBack: () => void;
}

interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
  post_content?: string;
  post_author?: string;
  post_user_id?: string;
}

interface BannedUser {
  id: string;
  user_id: string;
  reason: string | null;
  banned_at: string;
  expires_at: string | null;
  is_active: boolean;
  user_name?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const ModerationScreen = ({ onBack }: ModerationScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"reports" | "banned">("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check admin role
  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      const [reportsRes, bannedRes] = await Promise.all([
        (supabase as any).from("reported_posts").select("*").order("created_at", { ascending: false }),
        (supabase as any).from("banned_users").select("*").eq("is_active", true).order("banned_at", { ascending: false }),
      ]);

      // Enrich reports with post content
      if (reportsRes.data) {
        const postIds = [...new Set(reportsRes.data.map((r: any) => r.post_id))] as string[];
        const { data: posts } = await supabase
          .from("community_posts")
          .select("id, content, user_id")
          .in("id", postIds);

        const userIds = [
          ...new Set([
            ...reportsRes.data.map((r: any) => r.reporter_id),
            ...(posts || []).map((p: any) => p.user_id),
          ]),
        ];
        const { data: profiles } = await (supabase as any)
          .from("public_profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.full_name]));
        const postMap = Object.fromEntries((posts || []).map((p: any) => [p.id, p]));

        setReports(
          reportsRes.data.map((r: any) => ({
            ...r,
            post_content: postMap[r.post_id]?.content?.slice(0, 120) || "[Deleted]",
            post_author: profileMap[postMap[r.post_id]?.user_id] || "Unknown",
            post_user_id: postMap[r.post_id]?.user_id,
          }))
        );
      }

      if (bannedRes.data) {
        const userIds = bannedRes.data.map((b: any) => b.user_id);
        const { data: profiles } = await (supabase as any)
          .from("public_profiles")
          .select("id, full_name")
          .in("id", userIds);
        const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.full_name]));

        setBannedUsers(
          bannedRes.data.map((b: any) => ({
            ...b,
            user_name: profileMap[b.user_id] || "Unknown",
          }))
        );
      }

      setLoading(false);
    };
    load();
  }, [isAdmin]);

  const handleHidePost = async (postId: string, reportId: string) => {
    setActionLoading(reportId);
    await supabase.from("community_posts").update({ is_hidden: true }).eq("id", postId);
    await (supabase as any)
      .from("reported_posts")
      .update({ status: "resolved", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", reportId);
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)));
    setActionLoading(null);
    toast.success("Post hidden");
  };

  const handleDismiss = async (reportId: string) => {
    setActionLoading(reportId);
    await (supabase as any)
      .from("reported_posts")
      .update({ status: "dismissed", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", reportId);
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "dismissed" } : r)));
    setActionLoading(null);
    toast("Report dismissed");
  };

  const handleBanUser = async (userId: string, reportId: string) => {
    setActionLoading(reportId);
    // Ban user
    await (supabase as any).from("banned_users").upsert({
      user_id: userId,
      reason: "Repeated policy violations",
      banned_by: user!.id,
      is_active: true,
    }, { onConflict: "user_id" });
    // Also hide the post and resolve report
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      await supabase.from("community_posts").update({ is_hidden: true }).eq("id", report.post_id);
    }
    await (supabase as any)
      .from("reported_posts")
      .update({ status: "resolved", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", reportId);
    // Update can_post to false
    if (userId) {
      await supabase.from("profiles").update({ can_post: false }).eq("id", userId);
    }
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)));
    setActionLoading(null);
    toast.success("User banned and post hidden");
  };

  const handleUnban = async (banId: string, userId: string) => {
    setActionLoading(banId);
    await (supabase as any).from("banned_users").update({ is_active: false }).eq("id", banId);
    await supabase.from("profiles").update({ can_post: true }).eq("id", userId);
    setBannedUsers((prev) => prev.filter((b) => b.id !== banId));
    setActionLoading(null);
    toast.success("User unbanned");
  };

  if (!isAdmin) {
    return (
      <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
        <motion.div variants={fadeUp} className="flex items-center gap-3 pt-1">
          <button onClick={onBack} className="ios-press">
            <IonIcon name="arrow-back" size={22} style={{ color: "hsl(var(--dark))" }} />
          </button>
          <h1 className="text-[24px] font-serif" style={{ color: "hsl(var(--dark))" }}>Moderation</h1>
        </motion.div>
        <motion.div variants={fadeUp} className="flex flex-col items-center text-center py-12">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: "hsl(var(--light-coral))" }}>
            <IonIcon name="shield-outline" size={32} style={{ color: "hsl(var(--coral))" }} />
          </div>
          <h2 className="text-[20px] font-serif mb-2" style={{ color: "hsl(var(--dark))" }}>Admin Only</h2>
          <p className="text-[13px] font-sans max-w-[260px]" style={{ color: "hsl(var(--text-muted))" }}>
            This feature is restricted to administrators.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  const pendingReports = reports.filter((r) => r.status === "pending");
  const resolvedReports = reports.filter((r) => r.status !== "pending");

  return (
    <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 pt-1">
        <button onClick={onBack} className="ios-press">
          <IonIcon name="arrow-back" size={22} style={{ color: "hsl(var(--dark))" }} />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-[24px]" style={{ color: "hsl(var(--dark))" }}>Moderation</h1>
        </div>
        {pendingReports.length > 0 && (
          <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--coral))", color: "white" }}>
            {pendingReports.length} pending
          </span>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-2">
        {[
          { id: "reports" as const, label: "Reports", count: pendingReports.length },
          { id: "banned" as const, label: "Banned Users", count: bannedUsers.length },
        ].map((t) => (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-sans font-semibold flex items-center justify-center gap-1.5"
            style={{
              background: tab === t.id ? "hsl(var(--green))" : "hsl(var(--surface))",
              color: tab === t.id ? "white" : "hsl(var(--dark))",
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className="text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold"
                style={{
                  background: tab === t.id ? "rgba(255,255,255,0.25)" : "hsl(var(--coral))",
                  color: "white",
                }}
              >
                {t.count}
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <>
          {/* Reports Tab */}
          {tab === "reports" && (
            <div className="space-y-3">
              {pendingReports.length === 0 && resolvedReports.length === 0 ? (
                <div className="tend-card p-8 text-center">
                  <IonIcon name="checkmark-circle-outline" size={36} style={{ color: "hsl(var(--green))" }} />
                  <p className="text-[14px] font-sans mt-3" style={{ color: "hsl(var(--text-muted))" }}>
                    No reports to review
                  </p>
                </div>
              ) : (
                <>
                  {pendingReports.length > 0 && (
                    <>
                      <p className="label-caps text-text-muted">PENDING REVIEW</p>
                      {pendingReports.map((report) => (
                        <div key={report.id} className="tend-card p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--light-coral))" }}>
                              <IonIcon name="flag" size={16} style={{ color: "hsl(var(--coral))" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                                {report.reason}
                              </p>
                              <p className="text-[11px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                                Post by {report.post_author} · {new Date(report.created_at).toLocaleDateString("en-NG")}
                              </p>
                            </div>
                          </div>
                          {/* Post preview */}
                          <div className="rounded-xl p-3" style={{ background: "hsl(var(--bg))" }}>
                            <p className="text-[12px] font-sans line-clamp-3" style={{ color: "hsl(var(--dark))" }}>
                              {report.post_content}
                            </p>
                          </div>
                          {/* Actions */}
                          <div className="flex gap-2">
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleHidePost(report.post_id, report.id)}
                              disabled={actionLoading === report.id}
                              className="flex-1 py-2 rounded-xl text-[12px] font-sans font-semibold disabled:opacity-50"
                              style={{ background: "hsl(var(--light-coral))", color: "hsl(var(--coral))" }}
                            >
                              Hide Post
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => report.post_user_id && handleBanUser(report.post_user_id, report.id)}
                              disabled={actionLoading === report.id}
                              className="flex-1 py-2 rounded-xl text-[12px] font-sans font-semibold text-white disabled:opacity-50"
                              style={{ background: "hsl(var(--coral))" }}
                            >
                              Ban User
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDismiss(report.id)}
                              disabled={actionLoading === report.id}
                              className="flex-1 py-2 rounded-xl text-[12px] font-sans font-semibold disabled:opacity-50"
                              style={{ background: "hsl(var(--surface))", color: "hsl(var(--text-muted))", border: "1px solid hsl(var(--border))" }}
                            >
                              Dismiss
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {resolvedReports.length > 0 && (
                    <>
                      <p className="label-caps text-text-muted mt-4">RESOLVED</p>
                      {resolvedReports.slice(0, 10).map((report) => (
                        <div key={report.id} className="tend-card p-4 flex items-center gap-3" style={{ opacity: 0.6 }}>
                          <IonIcon
                            name={report.status === "resolved" ? "checkmark-circle" : "close-circle"}
                            size={20}
                            style={{ color: report.status === "resolved" ? "hsl(var(--green))" : "hsl(var(--text-muted))" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-sans truncate" style={{ color: "hsl(var(--dark))" }}>
                              {report.reason}
                            </p>
                            <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                              {report.status === "resolved" ? "Resolved" : "Dismissed"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Banned Users Tab */}
          {tab === "banned" && (
            <div className="space-y-3">
              {bannedUsers.length === 0 ? (
                <div className="tend-card p-8 text-center">
                  <IonIcon name="people-outline" size={36} style={{ color: "hsl(var(--green))" }} />
                  <p className="text-[14px] font-sans mt-3" style={{ color: "hsl(var(--text-muted))" }}>
                    No banned users
                  </p>
                </div>
              ) : (
                bannedUsers.map((ban) => (
                  <div key={ban.id} className="tend-card p-4 flex items-center gap-3">
                    <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--light-coral))" }}>
                      <IonIcon name="ban" size={18} style={{ color: "hsl(var(--coral))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                        {ban.user_name}
                      </p>
                      <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                        {ban.reason || "No reason"} · {new Date(ban.banned_at).toLocaleDateString("en-NG")}
                      </p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUnban(ban.id, ban.user_id)}
                      disabled={actionLoading === ban.id}
                      className="px-3 py-1.5 rounded-full text-[11px] font-sans font-semibold disabled:opacity-50"
                      style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
                    >
                      Unban
                    </motion.button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default ModerationScreen;
