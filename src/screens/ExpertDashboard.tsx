import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const ExpertDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  useEffect(() => {
    if (!user) return;
    fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    const { data } = await supabase
      .from("expert_availability")
      .select("*")
      .eq("expert_id", user!.id)
      .order("day_of_week");
    if (data) setSlots(data as any);
    setLoading(false);
  };

  const handleSaveSlot = async () => {
    if (editingDay === null || !user) return;
    setSaving(true);

    const existing = slots.find((s) => s.day_of_week === editingDay);

    if (existing?.id) {
      const { error } = await supabase
        .from("expert_availability")
        .update({ start_time: startTime, end_time: endTime } as any)
        .eq("id", existing.id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`${DAYS[editingDay]} updated`);
      }
    } else {
      const { error } = await supabase
        .from("expert_availability")
        .insert({
          expert_id: user.id,
          day_of_week: editingDay,
          start_time: startTime,
          end_time: endTime,
        } as any);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`${DAYS[editingDay]} added`);
      }
    }

    await fetchAvailability();
    setEditingDay(null);
    setSaving(false);
  };

  const handleRemoveSlot = async (slotId: string, dayIndex: number) => {
    const { error } = await supabase
      .from("expert_availability")
      .delete()
      .eq("id", slotId);
    if (error) {
      toast.error("Failed to remove");
    } else {
      toast.success(`${DAYS[dayIndex]} removed`);
      await fetchAvailability();
    }
  };

  const openEdit = (dayIndex: number) => {
    const existing = slots.find((s) => s.day_of_week === dayIndex);
    setStartTime(existing?.start_time?.slice(0, 5) || "09:00");
    setEndTime(existing?.end_time?.slice(0, 5) || "17:00");
    setEditingDay(dayIndex);
  };

  const isApproved = true; // If they can see this screen, admin already added them

  return (
    <div className="min-h-screen flex justify-center" style={{ background: "hsl(var(--bg))" }}>
      <div className="w-full max-w-[430px]">
        {/* Header */}
        <div className="px-5 pt-14 pb-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[24px]" style={{ color: "hsl(var(--dark))" }}>
              Expert Dashboard
            </h1>
            <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              Welcome, {user?.full_name || "Doctor"} 👋
            </p>
          </div>
          <button
            onClick={logout}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(var(--light-coral))" }}
          >
            <IonIcon name="log-out-outline" size={18} style={{ color: "hsl(var(--coral))" }} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-4">
          {/* Status card */}
          <div className="rounded-2xl p-4" style={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border-subtle))" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--light-green))" }}>
                <IonIcon name="checkmark-circle" size={22} style={{ color: "hsl(var(--green))" }} />
              </div>
              <div>
                <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>Account Approved</p>
                <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Mothers can see your availability</p>
              </div>
            </div>
          </div>

          {/* Availability section */}
          <div>
            <h2 className="font-serif text-[18px] mb-3" style={{ color: "hsl(var(--dark))" }}>
              Your Availability
            </h2>
            <p className="text-[13px] font-sans mb-4" style={{ color: "hsl(var(--text-muted))" }}>
              Set the days and times you're available for consultations.
            </p>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
              </div>
            ) : (
              <div className="space-y-2">
                {DAYS.map((day, i) => {
                  const slot = slots.find((s) => s.day_of_week === i);
                  return (
                    <motion.div
                      key={i}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-2xl p-3.5 flex items-center justify-between cursor-pointer"
                      style={{
                        background: slot ? "hsl(var(--light-green))" : "hsl(var(--surface))",
                        border: `1px solid ${slot ? "hsl(var(--green))" : "hsl(var(--border-subtle))"}`,
                      }}
                      onClick={() => openEdit(i)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-sans font-bold"
                          style={{
                            background: slot ? "hsl(var(--green))" : "hsl(var(--border-subtle))",
                            color: slot ? "white" : "hsl(var(--text-muted))",
                          }}
                        >
                          {day.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[14px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>{day}</p>
                          {slot ? (
                            <p className="text-[12px] font-sans" style={{ color: "hsl(var(--green))" }}>
                              {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                            </p>
                          ) : (
                            <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Not available</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {slot?.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveSlot(slot.id!, i); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "hsl(var(--light-coral))" }}
                          >
                            <IonIcon name="close-outline" size={14} style={{ color: "hsl(var(--coral))" }} />
                          </button>
                        )}
                        <IonIcon name="chevron-forward-outline" size={16} style={{ color: "hsl(var(--text-muted))" }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Edit modal */}
          {editingDay !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-end justify-center"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setEditingDay(null)}
            >
              <motion.div
                initial={{ y: 200 }}
                animate={{ y: 0 }}
                className="w-full max-w-[430px] rounded-t-3xl p-6"
                style={{ background: "hsl(var(--surface))" }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-serif text-[20px] mb-4" style={{ color: "hsl(var(--dark))" }}>
                  {DAYS[editingDay]}
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-[12px] font-sans font-medium mb-1 block" style={{ color: "hsl(var(--text-muted))" }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl text-[15px] font-sans outline-none"
                      style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))", border: "1px solid hsl(var(--border-subtle))" }}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-sans font-medium mb-1 block" style={{ color: "hsl(var(--text-muted))" }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl text-[15px] font-sans outline-none"
                      style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))", border: "1px solid hsl(var(--border-subtle))" }}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingDay(null)}
                    className="flex-1 py-3 rounded-2xl text-[14px] font-sans font-medium"
                    style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSaveSlot}
                    disabled={saving}
                    className="flex-1 py-3 rounded-2xl text-[14px] font-sans font-semibold"
                    style={{ background: "hsl(var(--green))", color: "white", opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard;
