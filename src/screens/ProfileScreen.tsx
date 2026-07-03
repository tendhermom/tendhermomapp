import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import TopBar from "@/components/navigation/TopBar";
import EditProfileScreen from "@/screens/EditProfileScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import HelpSupportScreen from "@/screens/HelpSupportScreen";
import SafetySettingsScreen from "@/screens/SafetySettingsScreen";
import ComplianceScreen from "@/screens/ComplianceScreen";
import CycleSettingScreen from "@/screens/CycleSettingScreen";
import { useAuthStore } from "@/stores/authStore";
import { nativeShare, hapticLight, screenShield } from "@/lib/despia";
import { supabase } from "@/integrations/supabase/client";
import InlineStatus, { type InlineStatusMsg } from "@/components/InlineStatus";

const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const TechnicalPopups = lazy(() => import("@/pages/TechnicalPopups"));
const HealthSafety = lazy(() => import("@/pages/HealthSafety"));

interface ProfileScreenProps {
  onNavigate: (tab: string) => void;
}

const menuSections = [
  {
    items: [
      { icon: "diamond-outline", label: "TendherMom Plus", route: "premium" },
      { icon: "sync-outline", label: "Cycle Setting", route: "cycle-setting" },
      { icon: "people-outline", label: "Refer & Earn", route: "referrals" },
      { icon: "alert-circle-outline", label: "Emergency Contacts", route: "emergency-contacts" },
      { icon: "shield-checkmark-outline", label: "Safety Net", route: "safety" },
      { icon: "notifications-outline", label: "Notifications", route: "notifications" },
      { icon: "shield-outline", label: "Moderation", route: "moderation", adminOnly: true },
      { icon: "share-social-outline", label: "Share TendherMom", route: "share-app" },
    ],
  },
  {
    items: [
      { icon: "shield-checkmark-outline", label: "Privacy Policy", route: "privacy" },
      { icon: "document-text-outline", label: "Terms of Use", route: "terms" },
      { icon: "information-circle-outline", label: "Technical Pop-Ups", route: "technical-popups" },
      { icon: "medkit-outline", label: "Health & Safety", route: "health-safety" },
      { icon: "ribbon-outline", label: "Compliance", route: "compliance" },
      { icon: "help-circle-outline", label: "Help & Support", route: "help" },
    ],
  },
];

const ProfileScreen = ({ onNavigate }: ProfileScreenProps) => {
  const [subScreen, setSubScreen] = useState<string | null>(null);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<InlineStatusMsg | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { logout, getCurrentWeek } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  // Screen Shield — protect personal profile data from screenshots/screen recording.
  useEffect(() => {
    screenShield.enable();
    return () => { screenShield.disable(); };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const closeDeleteSheet = () => {
    if (isDeleting) return;
    setShowDeleteSheet(false);
    // small delay so users don't see the reset mid-animation
    window.setTimeout(() => {
      setDeleteStep(1);
      setConfirmText("");
      setDeleteStatus(null);
    }, 220);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteStatus(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setDeleteStatus({ kind: "error", text: "You must be signed in to delete your account." });
        setIsDeleting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || (data as any)?.error) throw error || new Error((data as any).error);

      // Mark locally so a future sign-in within 7 days can offer recovery.
      try { localStorage.setItem("deletion_pending", "true"); } catch (_) {}

      await supabase.auth.signOut();
      useAuthStore.getState().setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Delete account failed:", err);
      setDeleteStatus({ kind: "error", text: "Couldn't delete your account. Please try again or contact support." });
      setIsDeleting(false);
    }
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const week = getCurrentWeek();
  const stageName = user?.current_stage?.replace(/_/g, " ") || "First trimester";

  if (subScreen === "edit-profile") {
    return <EditProfileScreen onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === "notifications") {
    return <NotificationsScreen onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === "help") {
    return <HelpSupportScreen onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === "safety") {
    return <SafetySettingsScreen onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === "compliance") {
    return <ComplianceScreen onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === "cycle-setting") {
    return <CycleSettingScreen onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === "privacy" || subScreen === "terms" || subScreen === "technical-popups" || subScreen === "health-safety") {
    return (
      <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} /></div>}>
        {subScreen === "privacy" && <Privacy onBack={() => setSubScreen(null)} />}
        {subScreen === "terms" && <Terms onBack={() => setSubScreen(null)} />}
        {subScreen === "technical-popups" && <TechnicalPopups onBack={() => setSubScreen(null)} />}
        {subScreen === "health-safety" && <HealthSafety onBack={() => setSubScreen(null)} />}
      </Suspense>
    );
  }

  const handleMenuPress = (route: string) => {
    hapticLight();
    if (route === "share-app") {
      nativeShare({
        title: "TendherMom",
        text: "Join TendherMom — maternal health support for Nigerian mothers",
        url: "https://tendhermomapp.lovable.app",
      });
      return;
    }
    if (["privacy", "terms", "help", "technical-popups", "health-safety", "compliance"].includes(route)) {
      setSubScreen(route);
      return;
    }
    if (["edit-profile", "notifications", "safety", "cycle-setting"].includes(route)) {
      setSubScreen(route);
    } else if (route === "premium" || route === "emergency-contacts") {
      onNavigate(route);
    } else if (route) {
      onNavigate(route);
    }
  };

  return (
    <div className="space-y-6 pb-4 pt-1">
      <TopBar onNotificationsPress={() => setSubScreen("notifications")} />

      {/* Profile hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.05 }}
        className="hero-card p-5"
      >
        <div className="relative z-10 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSubScreen("edit-profile")}
            className="w-[64px] h-[64px] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-[22px] font-bold font-sans">{initials}</span>
            )}
          </motion.button>
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-[20px] font-serif truncate">{user?.full_name || "User"}</h3>
            <p className="text-white/60 text-[13px] font-sans mt-0.5 truncate">{user?.email || ""}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="label-caps px-2.5 py-[3px] rounded-full"
                style={{ background: "hsl(var(--coral))", color: "white" }}
              >
                Week {week}
              </span>
              <span
                className="label-caps px-2.5 py-[3px] rounded-full capitalize"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}
              >
                {stageName}
              </span>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSubScreen("edit-profile")}
            className="p-2"
          >
            <IonIcon name="create-outline" size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
          </motion.button>
        </div>
      </motion.div>

      {/* Menu sections */}
      {menuSections.map((section, si) => (
        <motion.div
          key={si}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.12 + si * 0.08 }}
          className="tend-card overflow-hidden"
        >
          {section.items
            .filter((item) => !(item as any).adminOnly || isAdmin)
            .map((item, i, filtered) => (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMenuPress(item.route)}
              className="flex items-center gap-3.5 w-full px-[18px] py-[15px] text-left"
              style={{
                borderBottom: i < filtered.length - 1
                  ? "0.5px solid hsl(var(--border))"
                  : "none",
              }}
            >
              <IonIcon name={item.icon} size={22} style={{ color: "hsl(var(--green))" }} />
              <span className="flex-1 text-[15px] font-medium font-sans" style={{ color: "hsl(var(--dark))" }}>
                {item.label}
              </span>
              <IonIcon name="chevron-forward" size={16} style={{ color: "hsl(var(--border))" }} />
            </motion.button>
          ))}
        </motion.div>
      ))}

      {/* App version */}
      <div className="text-center">
        <p className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
          TendherMom v1.0.0
        </p>
      </div>

      {/* Log out */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleLogout}
        className="w-full tend-card py-[15px] flex items-center justify-center gap-2"
      >
        <IonIcon name="log-out-outline" size={20} style={{ color: "hsl(var(--destructive))" }} />
        <span className="text-destructive text-[15px] font-semibold font-sans">Log Out</span>
      </motion.button>

      {/* Delete account button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { hapticLight(); setShowDeleteSheet(true); }}
        className="w-full tend-card py-[15px] flex items-center justify-center gap-2"
      >
        <IonIcon name="trash-outline" size={20} style={{ color: "hsl(var(--destructive))" }} />
        <span className="text-destructive text-[15px] font-semibold font-sans">Delete Account</span>
      </motion.button>

      {/* Delete confirmation — premium bottom sheet, two-step */}
      <AnimatePresence>
        {showDeleteSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDeleteSheet}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(0,0,0,0.55)" }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[24px] px-6 pt-6 pb-[max(env(safe-area-inset-bottom,32px),32px)]"
              style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto" }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "hsl(var(--border))" }} />

              {deleteStep === 1 ? (
                <>
                  <div
                    className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "hsl(var(--light-coral))" }}
                  >
                    <IonIcon name="warning-outline" size={26} style={{ color: "hsl(var(--coral))" }} />
                  </div>
                  <h3 className="font-serif text-[22px] text-center mb-2" style={{ color: "hsl(var(--dark))" }}>
                    Delete your account?
                  </h3>
                  <p className="text-[13px] font-sans text-center leading-relaxed mb-5" style={{ color: "hsl(var(--text-muted))" }}>
                    This permanently removes your profile, posts, emergency contacts,
                    health records, and all data tied to your account.
                  </p>

                  {/* Recovery / grace info card */}
                  <div
                    className="rounded-2xl p-4 space-y-2.5 mb-5"
                    style={{ background: "hsl(var(--bg))" }}
                  >
                    <div className="flex items-start gap-2.5">
                      <IonIcon name="time-outline" size={16} style={{ color: "hsl(var(--green))", marginTop: 2 }} />
                      <p className="text-[12px] font-sans flex-1 leading-relaxed" style={{ color: "hsl(var(--dark))" }}>
                        <span className="font-semibold">7-day grace period.</span>{" "}
                        Sign in within 7 days to cancel deletion and restore your account.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <IonIcon name="shield-checkmark-outline" size={16} style={{ color: "hsl(var(--green))", marginTop: 2 }} />
                      <p className="text-[12px] font-sans flex-1 leading-relaxed" style={{ color: "hsl(var(--dark))" }}>
                        After 7 days, all your data is permanently deleted and cannot be recovered.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <IonIcon name="card-outline" size={16} style={{ color: "hsl(var(--coral))", marginTop: 2 }} />
                      <p className="text-[12px] font-sans flex-1 leading-relaxed" style={{ color: "hsl(var(--dark))" }}>
                        Active TendherMom Plus subscriptions must be cancelled separately
                        through the App Store or Google Play.
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDeleteStep(2)}
                    className="w-full py-[14px] rounded-2xl text-white text-[15px] font-semibold font-sans mb-2"
                    style={{ background: "hsl(var(--coral))" }}
                  >
                    Continue
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={closeDeleteSheet}
                    className="w-full py-[12px] rounded-2xl text-[15px] font-semibold font-sans"
                    style={{ color: "hsl(var(--text-muted))" }}
                  >
                    Keep my account
                  </motion.button>
                </>
              ) : (
                <>
                  <div
                    className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "hsl(var(--light-coral))" }}
                  >
                    <IonIcon name="trash-outline" size={26} style={{ color: "hsl(var(--coral))" }} />
                  </div>
                  <h3 className="font-serif text-[20px] text-center mb-2" style={{ color: "hsl(var(--dark))" }}>
                    Final confirmation
                  </h3>
                  <p className="text-[13px] font-sans text-center mb-4" style={{ color: "hsl(var(--text-muted))" }}>
                    Type{" "}
                    <span className="font-bold" style={{ color: "hsl(var(--coral))" }}>DELETE</span>
                    {" "}below to confirm.
                  </p>

                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="Type DELETE"
                    autoFocus
                    autoCapitalize="characters"
                    className="w-full px-4 py-3.5 rounded-2xl text-[15px] font-sans font-semibold text-center outline-none mb-3 tracking-widest"
                    style={{
                      background: "hsl(var(--bg))",
                      color: "hsl(var(--dark))",
                      border: "1.5px solid hsl(var(--border))",
                    }}
                  />

                  <InlineStatus status={deleteStatus} spacing="mb-3" />

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || confirmText !== "DELETE"}
                    className="w-full py-[14px] rounded-2xl text-white text-[15px] font-semibold font-sans mb-2 disabled:opacity-50"
                    style={{ background: "hsl(var(--coral))" }}
                  >
                    {isDeleting ? "Scheduling deletion…" : "Schedule deletion"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={closeDeleteSheet}
                    disabled={isDeleting}
                    className="w-full py-[12px] rounded-2xl text-[15px] font-semibold font-sans"
                    style={{ color: "hsl(var(--text-muted))" }}
                  >
                    Cancel
                  </motion.button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileScreen;
