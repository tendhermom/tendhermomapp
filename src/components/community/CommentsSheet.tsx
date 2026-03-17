import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import type { PostComment } from "@/stores/communityStore";

interface CommentsSheetProps {
  open: boolean;
  onClose: () => void;
  comments: PostComment[];
  loading: boolean;
  onAddComment: (text: string) => void;
}

const CommentsSheet = ({ open, onClose, comments, loading, onAddComment }: CommentsSheetProps) => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const handleSubmit = () => {
    onAddComment(text);
    setText("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] rounded-t-3xl p-5 pb-[max(env(safe-area-inset-bottom,32px),32px)] max-h-[70vh] flex flex-col"
            style={{ background: "hsl(var(--surface))" }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "hsl(var(--border-subtle))" }} />
            <h3 className="font-serif text-[18px] mb-4" style={{ color: "hsl(var(--dark))" }}>Comments</h3>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
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
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold font-sans shrink-0"
                      style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
                    >
                      {(c.author_name || "A")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-sans">
                        <span className="font-semibold" style={{ color: "hsl(var(--dark))" }}>{c.author_name}</span>
                        <span className="ml-2 text-[11px]" style={{ color: "hsl(var(--text-muted))" }}>
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="text-[13px] font-sans mt-0.5" style={{ color: "hsl(var(--dark))" }}>{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a comment…"
                maxLength={500}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="flex-1 px-4 py-2.5 rounded-xl text-[14px] font-sans outline-none"
                style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))", border: "1.5px solid hsl(var(--border-subtle))" }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(var(--green))", opacity: text.trim() ? 1 : 0.5 }}
              >
                <IonIcon name="send" size={18} style={{ color: "white" }} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsSheet;
