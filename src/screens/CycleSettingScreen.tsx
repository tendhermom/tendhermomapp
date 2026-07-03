import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { reportError } from "@/lib/errorMessage";

type StatusMsg = { kind: "error" | "success" | "info"; text: string } | null;

interface Props {
  onBack: () => void;
}

const MIN_CYCLE = 20;
const MAX_CYCLE = 45;

const fmtLong = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

const CycleSettingScreen = ({ onBack }: Props) => {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const initialCycle = ((user as any)?.cycle_length as number) || 28;
  const [lmp, setLmp] = useState<string>(user?.lmp_date || "");
  const [cycle, setCycle] = useState<number>(initialCycle);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<StatusMsg>(null);

  const showStatus = (msg: StatusMsg, autoHide = 3500) => {
    setStatus(msg);
    if (msg && autoHide) setTimeout(() => setStatus(null), autoHide);
  };

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const insights = useMemo(() => {
    if (!lmp) return null;
    const lmpDate = new Date(lmp);
    if (Number.isNaN(lmpDate.getTime())) return null;

    // Pregnancy view (LMP-based, standard obstetric calc)
    const daysSinceLmp = Math.floor((today.getTime() - lmpDate.getTime()) / 86400000);
    const pregWeek = Math.max(0, Math.floor(daysSinceLmp / 7));
    const dueDate = addDays(lmpDate, 280);

    // Cycle view
    const ovulation = addDays(lmpDate, cycle - 14);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = addDays(ovulation, 1);
    const nextPeriod = addDays(lmpDate, cycle);

    return { pregWeek, dueDate, ovulation, fertileStart, fertileEnd, nextPeriod };
  }, [lmp, cycle, today]);

  const handleSave = async () => {
    if (!user) return;
    if (!lmp) {
      showStatus({ kind: "error", text: "Please pick your last period date." });
      return;
    }
    if (new Date(lmp) > today) {
      showStatus({ kind: "error", text: "Last period date can't be in the future." });
      return;
    }
    if (cycle < MIN_CYCLE || cycle > MAX_CYCLE) {
      showStatus({ kind: "error", text: `Cycle must be between ${MIN_CYCLE} and ${MAX_CYCLE} days.` });
      return;
    }

    setSaving(true);
    setStatus(null);
    // Recompute due date from LMP for consistency across the app.
    const due = addDays(new Date(lmp), 280).toISOString().slice(0, 10);
    const { error } = await supabase
      .from("profiles")
      .update({ lmp_date: lmp, due_date: due, cycle_length: cycle } as any)
      .eq("id", user.id);

    if (error) {
      reportError(error, { feature: "cycle-setting.save", fallback: "Couldn't save your cycle settings." });
      setSaving(false);
      return;
    }

    await fetchProfile(user.id);
    setSaving(false);
    showStatus({ kind: "success", text: "Cycle settings updated." });
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-1">
          <IonIcon name="chevron-back-outline" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>
          Cycle Setting
        </h1>
      </div>

      {/* Intro */}
      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "hsl(var(--light-green))" }}
      >
        <IonIcon name="information-circle" size={20} style={{ color: "hsl(var(--green))", marginTop: 2 }} />
        <p className="text-[13px] font-sans leading-relaxed" style={{ color: "hsl(var(--dark))" }}>
          Adjust your last period date and cycle length. We'll recalculate your
          pregnancy week, due date, fertile window, and ovulation day.
        </p>
      </div>

      {/* Last period */}
      <div>
        <label className="text-[12px] font-sans font-semibold mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
          When did your last period start?
        </label>
        <input
          type="date"
          value={lmp}
          max={todayStr}
          onChange={(e) => setLmp(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-[15px] font-sans outline-none"
          style={{
            background: "hsl(var(--surface))",
            color: "hsl(var(--dark))",
            border: "1.5px solid hsl(var(--border-subtle))",
          }}
        />
        <p className="text-[11px] font-sans mt-1.5" style={{ color: "hsl(var(--text-muted))" }}>
          This is the first day you last saw bleeding.
        </p>
      </div>

      {/* Cycle length */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[12px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
            Cycle length
          </label>
          <span className="text-[13px] font-sans font-semibold" style={{ color: "hsl(var(--green))" }}>
            {cycle} days
          </span>
        </div>
        <input
          type="range"
          min={MIN_CYCLE}
          max={MAX_CYCLE}
          step={1}
          value={cycle}
          onChange={(e) => setCycle(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "hsl(var(--green))" }}
        />
        <div className="flex justify-between text-[11px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
          <span>{MIN_CYCLE}d</span>
          <span>Average 28d</span>
          <span>{MAX_CYCLE}d</span>
        </div>

        {/* Quick presets */}
        <div className="flex gap-2 mt-3">
          {[21, 26, 28, 30, 32].map((n) => {
            const active = cycle === n;
            return (
              <motion.button
                key={n}
                whileTap={{ scale: 0.94 }}
                onClick={() => setCycle(n)}
                className="flex-1 py-2 rounded-xl text-[12px] font-sans font-semibold"
                style={{
                  background: active ? "hsl(var(--green))" : "hsl(var(--surface))",
                  color: active ? "white" : "hsl(var(--dark))",
                  border: "1.5px solid hsl(var(--border-subtle))",
                }}
              >
                {n}d
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      {insights && (
        <div className="tend-card p-4 space-y-3">
          <h3 className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
            Your calculation
          </h3>

          <Row icon="calendar-outline" label="Pregnancy week" value={`Week ${insights.pregWeek}`} />
          <Row icon="heart-outline" label="Estimated due date" value={fmtLong(insights.dueDate)} />
          <Row
            icon="flower-outline"
            label="Fertile window"
            value={`${fmtLong(insights.fertileStart)} – ${fmtLong(insights.fertileEnd)}`}
          />
          <Row icon="sparkles-outline" label="Ovulation day" value={fmtLong(insights.ovulation)} />
          <Row icon="repeat-outline" label="Next expected period" value={fmtLong(insights.nextPeriod)} />

          <p className="text-[11px] font-sans leading-relaxed pt-1" style={{ color: "hsl(var(--text-muted))" }}>
            These are estimates based on a regular cycle. Always confirm important dates with your healthcare provider.
          </p>
        </div>
      )}

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="px-4 py-3 rounded-2xl flex items-start gap-2"
            style={{
              background:
                status.kind === "error"
                  ? "hsl(var(--light-coral))"
                  : status.kind === "success"
                  ? "hsl(var(--light-green))"
                  : "hsl(var(--surface))",
            }}
          >
            <IonIcon
              name={status.kind === "error" ? "alert-circle" : status.kind === "success" ? "checkmark-circle" : "information-circle"}
              size={18}
              style={{ color: status.kind === "error" ? "hsl(var(--coral))" : "hsl(var(--green))" }}
            />
            <span className="text-[13px] font-sans" style={{ color: "hsl(var(--dark))" }}>
              {status.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center"
        style={{ background: "hsl(var(--green))", color: "white", opacity: saving ? 0.7 : 1 }}
      >
        {saving ? "Saving…" : "Save Cycle Settings"}
      </motion.button>
    </div>
  );
};

const Row = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <IonIcon name={icon} size={18} style={{ color: "hsl(var(--green))" }} />
      <span className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>{label}</span>
    </div>
    <span className="text-[13px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>{value}</span>
  </div>
);

export default CycleSettingScreen;
