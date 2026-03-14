import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  expertUsers: number;
  totalPosts: number;
  totalBookings: number;
  totalAlerts: number;
  totalReferrals: number;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  plan_type: string;
  user_type: string;
  current_stage: string;
  created_at: string;
}

type AdminTab = "overview" | "users" | "experts" | "content" | "community";

const AdminDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    const [profiles, posts, bookings, alerts, referrals] = await Promise.all([
      supabase.from("profiles").select("id, plan_type, user_type", { count: "exact" }),
      supabase.from("community_posts").select("id", { count: "exact" }),
      supabase.from("bookings").select("id", { count: "exact" }),
      supabase.from("emergency_alerts").select("id", { count: "exact" }),
      supabase.from("referrals").select("id", { count: "exact" }),
    ]);

    const profileRows = profiles.data || [];
    setStats({
      totalUsers: profiles.count || 0,
      premiumUsers: profileRows.filter((p: any) => p.plan_type === "premium").length,
      freeUsers: profileRows.filter((p: any) => p.plan_type === "free").length,
      expertUsers: profileRows.filter((p: any) => p.user_type === "expert").length,
      totalPosts: posts.count || 0,
      totalBookings: bookings.count || 0,
      totalAlerts: alerts.count || 0,
      totalReferrals: referrals.count || 0,
    });
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, plan_type, user_type, current_stage, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setUsers(data as any);
  };

  const approveExpert = async (userId: string) => {
    // Add 'expert' role to user_roles (this is what gates access)
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "expert" as any });
    if (error) {
      if (error.code === "23505") {
        toast.info("Already approved");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Expert approved!");
    fetchUsers();
  };

  const togglePremium = async (userId: string, currentPlan: string) => {
    const newPlan = currentPlan === "premium" ? "free" : "premium";
    const { error } = await supabase
      .from("profiles")
      .update({ plan_type: newPlan })
      .eq("id", userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`User set to ${newPlan}`);
      fetchUsers();
      fetchStats();
    }
  };

  const StatCard = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => (
    <div className="rounded-2xl p-4" style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border-subtle))" }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color }}>
          <IonIcon name={icon} size={18} style={{ color: "white" }} />
        </div>
        <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{label}</p>
      </div>
      <p className="text-[28px] font-serif font-bold" style={{ color: "hsl(var(--dark))" }}>{value}</p>
    </div>
  );

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "grid-outline" },
    { key: "users", label: "Users", icon: "people-outline" },
    { key: "experts", label: "Experts", icon: "medkit-outline" },
    { key: "community", label: "Community", icon: "chatbubbles-outline" },
    { key: "content", label: "Content", icon: "document-text-outline" },
  ];

  const expertPending = users.filter((u) => (u as any).user_type === "expert");

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      {/* Top bar */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between" style={{ background: "hsl(var(--green))" }}>
        <div>
          <h1 className="font-serif text-[22px] text-white">Admin Panel</h1>
          <p className="text-[12px] font-sans text-white/70">TendherMom Management</p>
        </div>
        <button onClick={logout} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20">
          <IonIcon name="log-out-outline" size={18} style={{ color: "white" }} />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto" style={{ background: "hsl(var(--surface))" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-sans font-medium whitespace-nowrap"
            style={{
              background: tab === t.key ? "hsl(var(--green))" : "hsl(var(--bg))",
              color: tab === t.key ? "white" : "hsl(var(--text-muted))",
            }}
          >
            <IonIcon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <>
            {/* Overview tab */}
            {tab === "overview" && stats && (
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Users" value={stats.totalUsers} icon="people" color="hsl(var(--green))" />
                <StatCard label="Premium" value={stats.premiumUsers} icon="diamond" color="hsl(var(--coral))" />
                <StatCard label="Free Users" value={stats.freeUsers} icon="person" color="hsl(var(--sage))" />
                <StatCard label="Experts" value={stats.expertUsers} icon="medkit" color="hsl(153, 42%, 45%)" />
                <StatCard label="Posts" value={stats.totalPosts} icon="chatbubbles" color="hsl(200, 60%, 50%)" />
                <StatCard label="Bookings" value={stats.totalBookings} icon="calendar" color="hsl(270, 50%, 55%)" />
                <StatCard label="SOS Alerts" value={stats.totalAlerts} icon="alert-circle" color="hsl(0, 70%, 55%)" />
                <StatCard label="Referrals" value={stats.totalReferrals} icon="share" color="hsl(40, 70%, 50%)" />
              </div>
            )}

            {/* Users tab */}
            {tab === "users" && (
              <div className="space-y-2">
                <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                  {users.length} users
                </p>
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-2xl p-3 flex items-center justify-between"
                    style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border-subtle))" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-sans font-medium truncate" style={{ color: "hsl(var(--dark))" }}>
                        {u.full_name || "No name"}
                      </p>
                      <p className="text-[11px] font-sans truncate" style={{ color: "hsl(var(--text-muted))" }}>
                        {u.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span
                        className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: u.plan_type === "premium" ? "hsl(var(--light-coral))" : "hsl(var(--light-green))",
                          color: u.plan_type === "premium" ? "hsl(var(--coral))" : "hsl(var(--green))",
                        }}
                      >
                        {u.plan_type}
                      </span>
                      <button
                        onClick={() => togglePremium(u.id, u.plan_type)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "hsl(var(--bg))" }}
                      >
                        <IonIcon name="swap-horizontal-outline" size={14} style={{ color: "hsl(var(--text-muted))" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Experts tab */}
            {tab === "experts" && (
              <div className="space-y-3">
                <h3 className="font-serif text-[16px]" style={{ color: "hsl(var(--dark))" }}>
                  Pending Approval ({expertPending.length})
                </h3>
                {expertPending.length === 0 ? (
                  <p className="text-[13px] font-sans py-6 text-center" style={{ color: "hsl(var(--text-muted))" }}>
                    No pending expert requests
                  </p>
                ) : (
                  expertPending.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-2xl p-3 flex items-center justify-between"
                      style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border-subtle))" }}
                    >
                      <div>
                        <p className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>
                          {u.full_name || "No name"}
                        </p>
                        <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{u.email}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => approveExpert(u.id)}
                        className="px-3 py-1.5 rounded-xl text-[12px] font-sans font-semibold"
                        style={{ background: "hsl(var(--green))", color: "white" }}
                      >
                        Approve
                      </motion.button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Community tab */}
            {tab === "community" && (
              <div className="text-center py-8">
                <IonIcon name="chatbubbles-outline" size={40} style={{ color: "hsl(var(--text-muted))" }} />
                <p className="text-[14px] font-sans mt-3" style={{ color: "hsl(var(--text-muted))" }}>
                  Community moderation tools coming soon
                </p>
              </div>
            )}

            {/* Content tab */}
            {tab === "content" && (
              <div className="text-center py-8">
                <IonIcon name="document-text-outline" size={40} style={{ color: "hsl(var(--text-muted))" }} />
                <p className="text-[14px] font-sans mt-3" style={{ color: "hsl(var(--text-muted))" }}>
                  Content management tools coming soon
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
