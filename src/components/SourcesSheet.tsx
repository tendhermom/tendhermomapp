import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { type ClinicalRef, refShort } from "@/lib/clinicalRefs";

interface SourcesSheetProps {
  open: boolean;
  onClose: () => void;
  refs: ClinicalRef[];
  title?: string;
}

/**
 * In-place bottom sheet listing the clinical references behind a triage result.
 * Keeps the outcome state intact — used instead of route navigation from the
 * outcome screen. Each source opens the publisher's page in a new tab.
 */
const SourcesSheet = ({ open, onClose, refs, title = "Clinical sources" }: SourcesSheetProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "hsla(0,0%,0%,0.4)", backdropFilter: "blur(6px)" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-[430px] rounded-t-[28px] overflow-hidden"
            style={{
              background: "hsl(var(--bg))",
              boxShadow: "0 -8px 40px -8px hsla(0,0%,0%,0.25)",
              maxHeight: "78vh",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-2.5">
              <div className="w-[38px] h-[5px] rounded-full" style={{ background: "hsl(var(--border-subtle))" }} />
            </div>

            <div className="px-5 pt-3 pb-1 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-[19px] leading-tight" style={{ color: "hsl(var(--dark))" }}>
                  {title}
                </h3>
                <p className="text-[11px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                  Peer-reviewed guidance behind this result. Tap any source to read it.
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                aria-label="Close sources"
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 ios-press"
                style={{ background: "hsl(var(--light-green))" }}
              >
                <IonIcon name="close" size={16} style={{ color: "hsl(var(--green))" }} />
              </motion.button>
            </div>

            <div
              className="overflow-y-auto px-4 pt-2"
              style={{
                maxHeight: "calc(78vh - 90px)",
                paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
              }}
            >
              <div className="space-y-2">
                {refs.map((r) => (
                  <a
                    key={r.num}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-[14px] transition-colors"
                    style={{ background: "hsl(var(--light-green))" }}
                  >
                    <span
                      className="text-[10px] font-sans font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5"
                      style={{ background: "hsl(var(--surface))", color: "hsl(var(--green))" }}
                    >
                      {refShort(r)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12px] font-sans font-medium leading-snug" style={{ color: "hsl(var(--dark))" }}>
                        {r.title}
                      </span>
                      <span className="block text-[10.5px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                        {r.org} · {r.year}
                      </span>
                    </span>
                    <IonIcon name="open-outline" size={14} style={{ color: "hsl(var(--text-muted))", flexShrink: 0, marginTop: 3 }} />
                  </a>
                ))}
              </div>

              <p className="text-[10px] font-sans leading-[1.5] px-1 pt-3" style={{ color: "hsl(var(--text-muted))" }}>
                TendHerMom's guidance is adapted from the UK NHS 111 clinical triage protocol and validated against WHO IMPAC, NICE, RCOG and Nigerian clinical data.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SourcesSheet;
