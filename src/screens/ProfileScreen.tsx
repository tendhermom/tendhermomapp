import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import TopBar from "@/components/navigation/TopBar";
import EditProfileScreen from "@/screens/EditProfileScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import { useAuthStore } from "@/stores/authStore";
import { nativeShare, hapticLight } from "@/lib/despia";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));

interface ProfileScreenProps {
  onNavigate: (tab: string) => void;
}

const menuSections = [
  {
    items: [
      { icon: "diamond-outline", label: "TendherMom Plus", route: "premium" },
      { icon: "people-outline", label: "Refer & Earn", route: "referrals" },
      { icon: "alert-circle-outline", label: "Emergency Contacts", route: "emergency-contacts" },
      { icon: "notifications-outline", label: "Notifications", route: "notifications" },
      { icon: "shield-outline", label: "Moderation", route: "moderation", adminOnly: true },
      { icon: "share-social-outline", label: "Share TendherMom", route: "share-app" },
    ],
  },
  {
    items: [
      { icon: "shield-checkmark-outline", label: "Privacy Policy", route: "privacy" },
      { icon: "help-circle-outline", label: "Help & Support", route: "help" },
      { icon: "document-text-outline", label: "Terms of Service", route: "terms" },
    ],
  },
];

const ProfileScreen = ({ onNavigate }: ProfileScreenProps) => {
  const [subScreen, setSubScreen] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to delete your account.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      await supabase.auth.signOut();
      useAuthStore.getState().setUser(null);
      navigate("/login");
      toast.success("Your account has been deleted.");
    } catch (err) {
      console.error("Delete account failed:", err);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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
  if (subScreen === "privacy" || subScreen === "terms") {
    return (
      <div className="space-y-4 pb-4">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSubScreen(null)} className="p-1">
            <IonIcon name="chevron-back-outline" size={24} style={{ color: "hsl(var(--dark))" }} />
          </motion.button>
          <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>
            {subScreen === "privacy" ? "Privacy Policy" : "Terms of Service"}
          </h1>
        </div>
        <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} /></div>}>
          {subScreen === "privacy" ? <Privacy onBack={() => setSubScreen(null)} /> : <Terms onBack={() => setSubScreen(null)} />}
        </Suspense>
      </div>
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
    if (route === "privacy" || route === "terms") {
      setSubScreen(route);
      return;
    }
    if (["edit-profile", "notifications"].includes(route)) {
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

      {/* Delete account */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { hapticLight(); setShowDeleteDialog(true); }}
        className="w-full tend-card py-[15px] flex items-center justify-center gap-2"
      >
        <IonIcon name="trash-outline" size={20} style={{ color: "hsl(var(--destructive))" }} />
        <span className="text-destructive text-[15px] font-semibold font-sans">Delete Account</span>
      </motion.button>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl max-w-[340px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[17px] font-serif">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-[14px]">
              This will permanently delete your profile, posts, emergency contacts, and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="flex-1 mt-0 rounded-xl"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
              className="flex-1 bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfileScreen;
