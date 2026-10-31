import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import { refsGroupedByKind, refShort, type ClinicalRef } from "@/lib/clinicalRefs";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const RefRow = ({ r }: { r: ClinicalRef }) => (
  <a
    href={r.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-start gap-3 p-3.5 rounded-[14px] ios-press"
    style={{
      background: "hsl(var(--surface))",
      boxShadow: "0 2px 10px -2px hsla(0,0%,0%,0.05)",
    }}
  >
    <span
      className="text-[10px] font-sans font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5"
      style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
    >
      {refShort(r)}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[12.5px] font-sans font-medium leading-snug" style={{ color: "hsl(var(--dark))" }}>
        {r.title}
      </span>
      <span className="block text-[10.5px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
        {r.org} · {r.year}
      </span>
    </span>
    <IonIcon name="open-outline" size={14} style={{ color: "hsl(var(--text-muted))", flexShrink: 0, marginTop: 3 }} />
  </a>
);

/**
 * Full clinical bibliography for Apple Guideline 1.4.1 — every medical
 * recommendation in the app traces to one of these published sources.
 */
const ClinicalSourcesScreen = () => {
  const navigate = useNavigate();
  const groups = refsGroupedByKind();

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--bg))" }}>
      <div
        className="max-w-[430px] mx-auto px-5 pb-10"
        style={{ paddingTop: "calc(20px + env(safe-area-inset-top))" }}
      >
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
          {/* Back */}
          <motion.button
            variants={fadeUp}
            whileTap={{ scale: 0.92 }}
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="ios-press flex items-center gap-1 -ml-1.5 py-1"
          >
            <IonIcon name="chevron-back" size={22} style={{ color: "hsl(var(--green))" }} />
            <span className="text-[15px] font-sans font-medium" style={{ color: "hsl(var(--green))" }}>Back</span>
          </motion.button>

          {/* Header */}
          <motion.div variants={fadeUp} className="pt-3">
            <h1 className="font-serif text-[30px] leading-tight tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>
              Medical Sources
            </h1>
            <p className="text-[13px] font-sans mt-1.5 leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
              Where our health guidance comes from — {`53`} published references
            </p>
          </motion.div>

          {/* Intro card */}
          <motion.div
            variants={fadeUp}
            className="rounded-[18px] p-4 mt-4"
            style={{ background: "hsl(var(--light-green))" }}
          >
            <div className="flex items-start gap-2.5">
              <IonIcon name="library-outline" size={18} style={{ color: "hsl(var(--green))", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[12px] font-sans leading-relaxed" style={{ color: "hsl(var(--green))" }}>
                TendHerMom's symptom guidance is adapted from the UK NHS 111 clinical triage protocol and validated against World Health Organization (WHO IMPAC), NICE, RCOG and ACOG guidelines, together with Nigerian clinical data (NDHS, Federal Ministry of Health). Every recommendation in Symptom Triage cites the sources below.
              </p>
            </div>
          </motion.div>

          {/* Grouped references */}
          <div className="mt-6 space-y-6">
            {groups.map((g) => (
              <motion.section key={g.kind} variants={fadeUp}>
                <div className="flex items-baseline justify-between mb-2.5 px-1">
                  <h2 className="font-serif text-[17px]" style={{ color: "hsl(var(--dark))" }}>
                    {g.label}
                  </h2>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wide" style={{ color: "hsl(var(--text-muted))" }}>
                    {g.refs.length} source{g.refs.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {g.refs.map((r) => (
                    <RefRow key={r.num} r={r} />
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Footer */}
          <motion.div variants={fadeUp} className="mt-8 space-y-3">
            <p className="text-[10px] font-sans leading-[1.5] px-1" style={{ color: "hsl(var(--text-muted))" }}>
              Citations refer to the guidance version published by each organisation at the link shown. Sources open in your browser.
            </p>
            <MedicalDisclaimer />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClinicalSourcesScreen;
