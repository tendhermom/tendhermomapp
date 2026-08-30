import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import PhotoViewer from "@/components/PhotoViewer";
import { pushBackHandler } from "@/lib/backStack";
import type { PostComment } from "@/stores/communityStore";

// Skeleton placeholder shown while comments load
const CommentSkeleton = () => (
  <div className="flex gap-3 animate-pulse">
    <div className="w-9 h-9 rounded-full shrink-0" style={{ background: "hsl(var(--light-green))" }} />
    <div className="flex-1 space-y-2 pt-0.5">
      <div className="h-2.5 rounded-full w-2/5" style={{ background: "hsl(var(--light-green))" }} />
      <div className="h-2.5 rounded-full w-4/5" style={{ background: "hsl(var(--light-green))" }} />
    </div>
  </div>
);

interface CommentsSheetProps {
  open: boolean;
  onClose: () => void;
  comments: PostComment[];
  loading: boolean;
  onAddComment: (text: string) => Promise<boolean>;
  /** Signed-in mum — her own comments show a Delete action. */
  currentUserId?: string;
  onDeleteComment?: (commentId: string) => Promise<boolean>;
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

const CommentsSheet = ({ open, onClose, comments, loading, onAddComment, currentUserId, onDeleteComment }: CommentsSheetProps) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
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
  // Full-screen viewer when a commenter's photo is tapped
  const [viewer, setViewer] = useState<{ photo: string; name: string } | null>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Scroll container of the comments list — its position is restored after the
  // photo viewer closes so back always returns the mum exactly where she was.
  const listRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);

  // Back press while the sheet is open closes the sheet (after any overlay).
  useEffect(() => {
    if (!open) return;
    return pushBackHandler(() => {
      onClose();
      return true;
    });
  }, [open, onClose]);

  // Back press while a commenter's photo is open closes only the photo.
  useEffect(() => {
    if (!viewer) return;
    return pushBackHandler(() => {
      setViewer(null);
      return true;
    });
  }, [viewer]);

  // Restore the list scroll position once the viewer is dismissed.
  useEffect(() => {
    if (viewer) return;
    const el = listRef.current;
    if (el && savedScroll.current) {
      requestAnimationFrame(() => { el.scrollTop = savedScroll.current; });
    }
  }, [viewer]);

  const openPhoto = (photo: string, name: string) => {
    savedScroll.current = listRef.current?.scrollTop ?? 0;
    setViewer({ photo, name });
  };

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
            <div ref={listRef} className="flex-1 overflow-y-auto px-5 space-y-3 min-h-0">
              {loading ? (
                <div className="space-y-4 py-2">
                  <CommentSkeleton />
                  <CommentSkeleton />
                  <CommentSkeleton />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-[13px] font-sans py-6" style={{ color: "hsl(var(--text-muted))" }}>
                  No comments yet. Start the conversation!
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    {c.author_avatar ? (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => openPhoto(c.author_avatar!, c.author_name || "TendherMom member")}
                        className="shrink-0 self-start"
                        aria-label={`View ${c.author_name || "commenter"}'s photo`}
                      >
                        <img
                          src={c.author_avatar}
                          alt={c.author_name || "Commenter"}
                          className="w-9 h-9 rounded-full object-cover"
                          style={{ boxShadow: "0 0 0 1.5px hsl(var(--light-green))" }}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </motion.button>
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold font-sans shrink-0 self-start"
                        style={{
                          background: "hsl(var(--light-green))",
                          color: "hsl(var(--green))",
                          boxShadow: "0 0 0 1.5px hsl(var(--light-green))",
                        }}
                      >
                        {(c.author_name || "A")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-sans">
                        <span className="font-semibold" style={{ color: "hsl(var(--dark))" }}>{c.author_name}</span>
                        <span className="ml-2 text-[11px]" style={{ color: "hsl(var(--text-muted))" }}>
                          {formatCommentTime(c.created_at)}
                        </span>
                      </p>
                      <p className="text-[13px] font-sans mt-0.5 break-words" style={{ color: "hsl(var(--dark))" }}>{c.content}</p>
                    </div>
                    {onDeleteComment && currentUserId === c.user_id && (
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => setConfirmDeleteId(c.id)}
                        aria-label="Delete your comment"
                        className="w-8 h-8 shrink-0 self-start rounded-full flex items-center justify-center"
                        style={{ background: "hsl(var(--bg))" }}
                      >
                        <IonIcon name="trash-outline" size={14} style={{ color: "hsl(var(--text-muted))" }} />
                      </motion.button>
                    )}
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

          {/* Tap-to-view commenter photo */}
          <PhotoViewer
            photos={viewer ? [viewer.photo] : []}
            open={!!viewer}
            onClose={() => setViewer(null)}
            caption={viewer?.name}
          />

          {/* Delete-your-comment confirmation */}
          <AnimatePresence>
            {confirmDeleteId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-end justify-center"
                style={{ background: "rgba(0,0,0,0.45)" }}
                onClick={(e) => { e.stopPropagation(); if (!deleting) setConfirmDeleteId(null); }}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 320 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-[430px] rounded-t-3xl px-5 pt-5"
                  style={{ background: "hsl(var(--surface))", paddingBottom: "max(env(safe-area-inset-bottom, 24px), 24px)" }}
                >
                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "hsl(var(--border-subtle))" }} />
                  <h3 className="font-serif text-[19px] text-center" style={{ color: "hsl(var(--dark))" }}>Delete this comment?</h3>
                  <p className="text-[13px] font-sans text-center mt-1.5" style={{ color: "hsl(var(--text-muted))" }}>
                    It will be removed for everyone. This can't be undone.
                  </p>
                  <div className="flex gap-3 mt-5">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold font-sans"
                      style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
                    >
                      Keep
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={deleting}
                      onClick={async () => {
                        if (!onDeleteComment) return;
                        setDeleting(true);
                        const ok = await onDeleteComment(confirmDeleteId);
                        setDeleting(false);
                        if (ok) setConfirmDeleteId(null);
                        else setError("Couldn't delete that comment. Please try again.");
                      }}
                      className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold font-sans"
                      style={{ background: "hsl(var(--coral))", color: "white", opacity: deleting ? 0.7 : 1 }}
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsSheet;
