import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import type { PostComment } from "@/stores/communityStore";

interface CommentsSheetProps {
  open: boolean;
  onClose: () => void;
  comments: PostComment[];
  loading: boolean;
  onAddComment: (text: string) => Promise<boolean>;
}

const DRAFT_KEY = "tendher_comment_draft_v1";

// Same day → show the time (e.g. 3:42 PM). Older → show the date.
const formatCommentTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString();
};

const CommentsSheet = ({ open, onClose, comments, loading, onAddComment }: CommentsSheetProps) => {
  // Keep any half-typed comment if the app is minimised and reopened
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(DRAFT_KEY) || ""; } catch { return ""; }
  });

  useEffect(() => {
    try {
      if (text) localStorage.setItem(DRAFT_KEY, text);
      else localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, [text]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Grow the comment box up to 3 lines as the user types
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 84)}px`;
  });
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Detect virtual keyboard via visualViewport
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const heightDiff = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOpen(heightDiff > 100);
      setKeyboardOffset(heightDiff > 100 ? heightDiff : 0);
    };

    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    onResize();
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
      setKeyboardOffset(0);
    };
  }, [open]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const ok = await onAddComment(text.trim());
    setSubmitting(false);
    if (ok) {
      setText("");
      // Keep the composer ready so another comment can be posted right away
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setError("Couldn't post your comment. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-x-0 top-0 z-[80] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.4)", bottom: keyboardOffset }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
            style={{
              background: "hsl(var(--surface))",
               maxHeight: keyboardOpen ? "65vh" : "70vh",
            }}
          >
            {/* Handle + Title */}
            <div className="px-5 pt-5 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "hsl(var(--border-subtle))" }} />
              <h3 className="font-serif text-[18px]" style={{ color: "hsl(var(--dark))" }}>Comments</h3>
            </div>

            {/* Scrollable comments list */}
            <div className="flex-1 overflow-y-auto px-5 space-y-3 min-h-0">
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-[13px] font-sans py-6" style={{ color: "hsl(var(--text-muted))" }}>
                  No comments yet. Start the conversation!
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    {c.author_avatar ? (
                      <img
                        src={c.author_avatar}
                        alt={c.author_name || "Commenter"}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold font-sans shrink-0"
                        style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
                      >
                        {(c.author_name || "A")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-[13px] font-sans">
                        <span className="font-semibold" style={{ color: "hsl(var(--dark))" }}>{c.author_name}</span>
                        <span className="ml-2 text-[11px]" style={{ color: "hsl(var(--text-muted))" }}>
                          {formatCommentTime(c.created_at)}
                        </span>
                      </p>
                      <p className="text-[13px] font-sans mt-0.5" style={{ color: "hsl(var(--dark))" }}>{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input bar — always visible at bottom */}
            <div
              className="relative shrink-0 px-4 py-3 flex items-center gap-2 border-t"
              style={{
                borderColor: "hsl(var(--border-subtle))",
                paddingBottom: keyboardOpen ? "12px" : "max(env(safe-area-inset-bottom, 16px), 16px)",
              }}
            >
              {error && (
                <p className="absolute -top-7 left-5 right-5 text-center text-[11px] font-sans" style={{ color: "hsl(var(--coral))" }}>
                  {error}
                </p>
              )}
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a comment…"
                maxLength={500}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit();
                  }
                }}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl text-[14px] font-sans outline-none resize-none leading-[20px]"
                style={{
                  background: "hsl(var(--bg))",
                  color: "hsl(var(--dark))",
                  border: "1.5px solid hsl(var(--border-subtle))",
                  minHeight: 44,
                  maxHeight: 84,
                  overflowY: "auto",
                }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => void handleSubmit()}
                disabled={!text.trim() || submitting}
                className="w-11 h-11 shrink-0 grow-0 basis-11 rounded-xl flex items-center justify-center"
                style={{ background: "hsl(var(--green))", opacity: text.trim() ? 1 : 0.5 }}
              >
                <IonIcon name={submitting ? "hourglass-outline" : "send"} size={18} style={{ color: "white" }} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsSheet;
