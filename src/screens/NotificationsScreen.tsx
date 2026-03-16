import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import IonIcon from "@/components/IonIcon";

interface NotificationsScreenProps {
  onBack: () => void;
}

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

const typeIcons: Record<string, { icon: string; color: string }> = {
  booking: { icon: "calendar-outline", color: "hsl(var(--green))" },
  community: { icon: "people-outline", color: "hsl(var(--sage))" },
  reminder: { icon: "alarm-outline", color: "hsl(var(--coral))" },
  emergency: { icon: "warning-outline", color: "hsl(var(--destructive))" },
  general: { icon: "notifications-outline", color: "hsl(var(--green))" },
};

const NotificationsScreen = ({ onBack }: NotificationsScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user?.id]);

  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const fetchNotifications = async (cursor?: string) => {
    if (!user) return;
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data } = await query;
    const newNotifs = (data as Notification[]) || [];

    if (cursor) {
      setNotifications((prev) => [...prev, ...newNotifs]);
    } else {
      setNotifications(newNotifs);
    }
    setHasMore(newNotifs.length === PAGE_SIZE);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-1">
            <IonIcon name="chevron-back-outline" size={24} style={{ color: "hsl(var(--dark))" }} />
          </motion.button>
          <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-sans font-bold"
              style={{ background: "hsl(var(--coral))", color: "white" }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={markAllRead}
            className="text-[13px] font-sans font-semibold"
            style={{ color: "hsl(var(--green))" }}
          >
            Mark all read
          </motion.button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-[14px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Loading…</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--light-green))" }}
          >
            <IonIcon name="notifications-off-outline" size={28} style={{ color: "hsl(var(--green))" }} />
          </div>
          <p className="text-[15px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
            No notifications yet
          </p>
          <p className="text-[13px] font-sans text-center" style={{ color: "hsl(var(--text-muted))" }}>
            You'll see emergency alerts and community updates here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const t = typeIcons[notif.type] || typeIcons.general;
            return (
              <motion.div
                key={notif.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className="tend-card flex items-start gap-3 p-4 cursor-pointer relative"
                style={{ opacity: notif.read ? 0.7 : 1 }}
              >
                {!notif.read && (
                  <div
                    className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full"
                    style={{ background: "hsl(var(--coral))" }}
                  />
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--light-green))" }}
                >
                  <IonIcon name={t.icon} size={20} style={{ color: t.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[14px] font-sans font-semibold truncate"
                    style={{ color: "hsl(var(--dark))" }}
                  >
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p
                      className="text-[13px] font-sans mt-0.5 line-clamp-2"
                      style={{ color: "hsl(var(--text-muted))" }}
                    >
                      {notif.body}
                    </p>
                  )}
                  <p className="text-[11px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                    {timeAgo(notif.created_at)}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="p-1 shrink-0 mt-1"
                >
                  <IonIcon name="close-outline" size={16} style={{ color: "hsl(var(--text-muted))" }} />
                </motion.button>
              </motion.div>
            );
          })}
          {hasMore && notifications.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const last = notifications[notifications.length - 1];
                fetchNotifications(last.created_at);
              }}
              className="w-full py-3 rounded-xl text-[13px] font-sans font-semibold"
              style={{ color: "hsl(var(--green))", background: "hsl(var(--surface))" }}
            >
              Load more
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;
