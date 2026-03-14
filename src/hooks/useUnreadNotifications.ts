import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";

export const useUnreadNotifications = () => {
  const user = useAuthStore((s) => s.user);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { count: c } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setCount(c || 0);
    };

    fetch();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("notif-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetch()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return count;
};
