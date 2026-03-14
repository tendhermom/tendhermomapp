import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface RecordsScreenProps {
  onBack: () => void;
}

type Tab = "visits" | "tests" | "vitals";

interface Visit {
  id: string;
  visit_date: string;
  doctor_name: string | null;
  hospital: string | null;
  notes: string | null;
  week_number: number | null;
}

interface TestResult {
  id: string;
  test_name: string;
  test_date: string;
  result: string | null;
  status: string;
  notes: string | null;
}

interface Vital {
  id: string;
  recorded_at: string;
  weight_kg: number | null;
  blood_pressure: string | null;
  blood_sugar: string | null;
  notes: string | null;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "visits", label: "Visits", icon: "calendar-outline" },
  { id: "tests", label: "Tests", icon: "flask-outline" },
  { id: "vitals", label: "Vitals", icon: "pulse-outline" },
];

const RecordsScreen = ({ onBack }: RecordsScreenProps) => {
  const [tab, setTab] = useState<Tab>("visits");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const user = useAuthStore((s) => s.user);
  const currentWeek = useAuthStore((s) => s.getCurrentWeek());

  useEffect(() => {
    if (user?.id) fetchAll();
  }, [user?.id]);

  const fetchAll = async () => {
    setLoading(true);
    const [v, t, vt] = await Promise.all([
      supabase.from("antenatal_visits").select("*").eq("user_id", user!.id).order("visit_date", { ascending: false }),
      supabase.from("test_results").select("*").eq("user_id", user!.id).order("test_date", { ascending: false }),
      supabase.from("vitals").select("*").eq("user_id", user!.id).order("recorded_at", { ascending: false }),
    ]);
    if (v.data) setVisits(v.data as any);
    if (t.data) setTests(t.data as any);
    if (vt.data) setVitals(vt.data as any);
    setLoading(false);
  };

  // Add Visit
  const [visitForm, setVisitForm] = useState({ visit_date: new Date().toISOString().split("T")[0], doctor_name: "", hospital: "", notes: "" });
  const addVisit = async () => {
    const { error } = await supabase.from("antenatal_visits").insert({ user_id: user!.id, ...visitForm, week_number: currentWeek } as any);
    if (error) { toast.error("Failed to save visit"); return; }
    toast.success("Visit recorded!");
    setShowAdd(false);
    setVisitForm({ visit_date: new Date().toISOString().split("T")[0], doctor_name: "", hospital: "", notes: "" });
    fetchAll();
  };

  // Add Test
  const [testForm, setTestForm] = useState({ test_name: "", test_date: new Date().toISOString().split("T")[0], result: "", status: "pending", notes: "" });
  const addTest = async () => {
    if (!testForm.test_name) { toast.error("Test name required"); return; }
    const { error } = await supabase.from("test_results").insert({ user_id: user!.id, ...testForm } as any);
    if (error) { toast.error("Failed to save test"); return; }
    toast.success("Test recorded!");
    setShowAdd(false);
    setTestForm({ test_name: "", test_date: new Date().toISOString().split("T")[0], result: "", status: "pending", notes: "" });
    fetchAll();
  };

  // Add Vital
  const [vitalForm, setVitalForm] = useState({ weight_kg: "", blood_pressure: "", blood_sugar: "", notes: "" });
  const addVital = async () => {
    const { error } = await supabase.from("vitals").insert({
      user_id: user!.id,
      weight_kg: vitalForm.weight_kg ? parseFloat(vitalForm.weight_kg) : null,
      blood_pressure: vitalForm.blood_pressure || null,
      blood_sugar: vitalForm.blood_sugar || null,
      notes: vitalForm.notes || null,
    } as any);
    if (error) { toast.error("Failed to save vitals"); return; }
    toast.success("Vitals recorded!");
    setShowAdd(false);
    setVitalForm({ weight_kg: "", blood_pressure: "", blood_sugar: "", notes: "" });
    fetchAll();
  };

  const inputStyle = "w-full px-4 py-3 rounded-xl text-[14px] font-sans outline-none";

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="w-[36px] h-[36px] rounded-full flex items-center justify-center" style={{ background: "hsl(var(--light-coral))" }}>
          <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--coral))" }} />
        </motion.button>
        <h1 className="font-serif flex-1" style={{ fontSize: "26px", color: "hsl(var(--dark))" }}>Health Records</h1>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(!showAdd)} className="w-[36px] h-[36px] rounded-full flex items-center justify-center" style={{ background: "hsl(var(--green))" }}>
          <IonIcon name={showAdd ? "close" : "add"} size={20} style={{ color: "white" }} />
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => { setTab(t.id); setShowAdd(false); }}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold font-sans flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: tab === t.id ? "hsl(var(--green))" : "hsl(var(--surface))",
              color: tab === t.id ? "white" : "hsl(var(--text-muted))",
            }}
          >
            <IonIcon name={t.icon} size={16} style={{ color: tab === t.id ? "white" : "hsl(var(--text-muted))" }} />
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* Add Forms */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="tend-card p-4 space-y-3">
              <h3 className="text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
                Add {tab === "visits" ? "Visit" : tab === "tests" ? "Test Result" : "Vitals"}
              </h3>

              {tab === "visits" && (
                <>
                  <input type="date" value={visitForm.visit_date} onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })} className={inputStyle} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <input placeholder="Doctor name" value={visitForm.doctor_name} onChange={(e) => setVisitForm({ ...visitForm, doctor_name: e.target.value })} className={inputStyle} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <input placeholder="Hospital / Clinic" value={visitForm.hospital} onChange={(e) => setVisitForm({ ...visitForm, hospital: e.target.value })} className={inputStyle} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <textarea placeholder="Notes from your visit..." value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} rows={2} className={inputStyle + " resize-none"} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <motion.button whileTap={{ scale: 0.96 }} onClick={addVisit} className="w-full py-3 rounded-xl text-[14px] font-bold font-sans" style={{ background: "hsl(var(--green))", color: "white" }}>Save Visit</motion.button>
                </>
              )}

              {tab === "tests" && (
                <>
                  <input placeholder="Test name (e.g., Blood group, HIV)" value={testForm.test_name} onChange={(e) => setTestForm({ ...testForm, test_name: e.target.value })} className={inputStyle} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <input type="date" value={testForm.test_date} onChange={(e) => setTestForm({ ...testForm, test_date: e.target.value })} className={inputStyle} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <input placeholder="Result (optional)" value={testForm.result} onChange={(e) => setTestForm({ ...testForm, result: e.target.value })} className={inputStyle} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <select value={testForm.status} onChange={(e) => setTestForm({ ...testForm, status: e.target.value })} className={inputStyle} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="abnormal">Abnormal</option>
                  </select>
                  <textarea placeholder="Notes..." value={testForm.notes} onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })} rows={2} className={inputStyle + " resize-none"} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <motion.button whileTap={{ scale: 0.96 }} onClick={addTest} className="w-full py-3 rounded-xl text-[14px] font-bold font-sans" style={{ background: "hsl(var(--green))", color: "white" }}>Save Test</motion.button>
                </>
              )}

              {tab === "vitals" && (
                <>
                  <input type="number" step="0.1" placeholder="Weight (kg)" value={vitalForm.weight_kg} onChange={(e) => setVitalForm({ ...vitalForm, weight_kg: e.target.value })} className={inputStyle} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <input placeholder="Blood pressure (e.g., 120/80)" value={vitalForm.blood_pressure} onChange={(e) => setVitalForm({ ...vitalForm, blood_pressure: e.target.value })} className={inputStyle} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <input placeholder="Blood sugar (mg/dL)" value={vitalForm.blood_sugar} onChange={(e) => setVitalForm({ ...vitalForm, blood_sugar: e.target.value })} className={inputStyle} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <textarea placeholder="Notes..." value={vitalForm.notes} onChange={(e) => setVitalForm({ ...vitalForm, notes: e.target.value })} rows={2} className={inputStyle + " resize-none"} style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <motion.button whileTap={{ scale: 0.96 }} onClick={addVital} className="w-full py-3 rounded-xl text-[14px] font-bold font-sans" style={{ background: "hsl(var(--green))", color: "white" }}>Save Vitals</motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Lists */}
      {loading ? (
        <div className="tend-card p-8 text-center">
          <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Loading records...</p>
        </div>
      ) : (
        <>
          {tab === "visits" && (
            <div className="space-y-2.5">
              {visits.length === 0 ? (
                <EmptyState icon="calendar-outline" text="No antenatal visits recorded yet" />
              ) : visits.map((v) => (
                <div key={v.id} className="tend-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-[40px] h-[40px] rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--light-coral))" }}>
                      <IonIcon name="calendar" size={20} style={{ color: "hsl(var(--coral))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
                        {v.doctor_name || "Antenatal Visit"}
                      </h4>
                      <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                        {new Date(v.visit_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        {v.week_number && ` · Week ${v.week_number}`}
                      </p>
                    </div>
                  </div>
                  {v.hospital && <p className="text-[12px] font-sans mt-2 ml-[52px]" style={{ color: "hsl(var(--text-muted))" }}>📍 {v.hospital}</p>}
                  {v.notes && <p className="text-[12px] font-sans mt-1 ml-[52px] leading-relaxed" style={{ color: "hsl(var(--dark))" }}>{v.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === "tests" && (
            <div className="space-y-2.5">
              {tests.length === 0 ? (
                <EmptyState icon="flask-outline" text="No test results recorded yet" />
              ) : tests.map((t) => (
                <div key={t.id} className="tend-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-[40px] h-[40px] rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.status === "abnormal" ? "hsl(0 84% 95%)" : "hsl(var(--light-coral))" }}>
                      <IonIcon name="flask" size={20} style={{ color: t.status === "abnormal" ? "hsl(0 84% 60%)" : "hsl(var(--coral))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>{t.test_name}</h4>
                      <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                        {new Date(t.test_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className="label-caps px-2 py-1 rounded-full" style={{
                      background: t.status === "completed" ? "hsl(153 42% 92%)" : t.status === "abnormal" ? "hsl(0 84% 95%)" : "hsl(40 100% 93%)",
                      color: t.status === "completed" ? "hsl(var(--green))" : t.status === "abnormal" ? "hsl(0 84% 60%)" : "hsl(40 80% 40%)",
                    }}>
                      {t.status}
                    </span>
                  </div>
                  {t.result && <p className="text-[13px] font-sans mt-2 ml-[52px] font-medium" style={{ color: "hsl(var(--dark))" }}>Result: {t.result}</p>}
                  {t.notes && <p className="text-[12px] font-sans mt-1 ml-[52px]" style={{ color: "hsl(var(--text-muted))" }}>{t.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === "vitals" && (
            <div className="space-y-2.5">
              {vitals.length === 0 ? (
                <EmptyState icon="pulse-outline" text="No vitals recorded yet" />
              ) : vitals.map((v) => (
                <div key={v.id} className="tend-card p-4">
                  <p className="text-[12px] font-sans font-medium mb-2" style={{ color: "hsl(var(--text-muted))" }}>
                    {new Date(v.recorded_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <div className="flex gap-3">
                    {v.weight_kg && <VitalBadge icon="scale-outline" label="Weight" value={`${v.weight_kg} kg`} />}
                    {v.blood_pressure && <VitalBadge icon="heart-outline" label="BP" value={v.blood_pressure} />}
                    {v.blood_sugar && <VitalBadge icon="water-outline" label="Sugar" value={`${v.blood_sugar}`} />}
                  </div>
                  {v.notes && <p className="text-[12px] font-sans mt-2" style={{ color: "hsl(var(--text-muted))" }}>{v.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <div className="tend-card p-8 flex flex-col items-center gap-2">
    <IonIcon name={icon} size={32} style={{ color: "hsl(var(--text-muted))" }} />
    <p className="text-[13px] font-sans text-center" style={{ color: "hsl(var(--text-muted))" }}>{text}</p>
  </div>
);

const VitalBadge = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "hsl(var(--bg))" }}>
    <IonIcon name={icon} size={18} style={{ color: "hsl(var(--green))" }} />
    <p className="text-[10px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>{label}</p>
    <p className="text-[14px] font-bold font-sans" style={{ color: "hsl(var(--dark))" }}>{value}</p>
  </div>
);

export default RecordsScreen;
