import { lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const HealthSafety = lazy(() => import("@/pages/HealthSafety"));
const TechnicalPopups = lazy(() => import("@/pages/TechnicalPopups"));

export type LegalDoc = "privacy" | "terms" | "health-safety" | "technical-popups";

interface LegalModalProps {
  doc: LegalDoc | null;
  onClose: () => void;
}

const TITLES: Record<LegalDoc, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Use",
  "health-safety": "Health & Safety",
  "technical-popups": "Technical Popups",
};

/**
 * Apple WebView-safe legal viewer.
 * Renders Privacy / Terms / Health & Safety / Technical Popups inline as a full-screen
 * modal sheet so the user never leaves the WebView (no _blank, no external Safari handoff).
 * Required for Despia/iOS App Store compliance — all in-app legal links must stay in-app.
 */
const LegalModal = ({ doc, onClose }: LegalModalProps) => {
  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="p-0 gap-0 border-0 bg-transparent shadow-none max-w-none w-screen h-screen translate-x-0 translate-y-0 left-0 top-0 rounded-none data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
      >
        <DialogTitle className="sr-only">{doc ? TITLES[doc] : ""}</DialogTitle>
        <div className="w-full h-full overflow-y-auto" style={{ background: "hsl(var(--bg))" }}>
          <Suspense fallback={<div className="w-full h-full" style={{ background: "hsl(var(--bg))" }} />}>
            {doc === "privacy" && <Privacy onBack={onClose} />}
            {doc === "terms" && <Terms onBack={onClose} />}
            {doc === "health-safety" && <HealthSafety onBack={onClose} />}
            {doc === "technical-popups" && <TechnicalPopups onBack={onClose} />}
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalModal;
