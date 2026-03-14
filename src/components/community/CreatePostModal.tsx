import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
  posting: boolean;
  channelLabel: string;
}

const CreatePostModal = ({ open, onClose, onSubmit, posting, channelLabel }: CreatePostModalProps) => {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    onSubmit(content);
    if (!posting) setContent("");
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
            className="w-full max-w-[430px] rounded-t-3xl p-5 pb-8"
            style={{ background: "hsl(var(--surface))" }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "hsl(var(--border-subtle))" }} />
            <h3 className="font-serif text-[20px] mb-2" style={{ color: "hsl(var(--dark))" }}>Share with the community</h3>
            <p className="text-[13px] font-sans mb-4" style={{ color: "hsl(var(--text-muted))" }}>
              Posting to <span className="font-semibold" style={{ color: "hsl(var(--green))" }}>{channelLabel}</span>
            </p>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={1000}
              rows={4}
              autoFocus
              className="w-full px-4 py-3 rounded-2xl text-[15px] font-sans outline-none resize-none"
              style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))", border: "1.5px solid hsl(var(--border-subtle))" }}
            />

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!content.trim() || posting}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold font-sans mt-4"
              style={{ background: "hsl(var(--green))", color: "white", opacity: !content.trim() || posting ? 0.6 : 1 }}
            >
              {posting ? "Posting…" : "Post"}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
