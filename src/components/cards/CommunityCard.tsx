import { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import type { CommunityPost } from "@/stores/communityStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface CommunityCardProps {
  post: CommunityPost;
  onLike: () => void;
  onComment: () => void;
  onHide?: (postId: string) => void;
}

const REPORT_REASONS = [
  "Spam or misleading",
  "Harassment or bullying",
  "Inappropriate content",
  "Medical misinformation",
  "Other",
];

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

const CommunityCard = forwardRef<HTMLDivElement, CommunityCardProps>(({ post, onLike, onComment, onHide }, ref) => {
  const user = useAuthStore((s) => s.user);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);

  const initials = (post.author_name || "A")
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isOwnPost = user?.id === post.user_id;

  const handleReport = async () => {
    if (!selectedReason || !user) return;
    setReporting(true);
    const { error } = await (supabase as any).from("reported_posts").insert({
      post_id: post.id,
      reporter_id: user.id,
      reason: selectedReason,
    });
    setReporting(false);
    if (!error) {
      toast.success("Post reported. Our team will review it.");
      setShowReport(false);
      setShowMenu(false);
      setSelectedReason(null);
    } else {
      toast.error("Failed to report post");
    }
  };

  const handleDeleteOwn = async () => {
    const { error } = await supabase.from("community_posts").delete().eq("id", post.id);
    if (!error) {
      toast.success("Post deleted");
      onHide?.(post.id);
    }
    setShowMenu(false);
  };

  return (
    <div
      ref={ref}
      className="rounded-2xl p-4 space-y-3"
      style={{ background: "hsl(var(--surface))", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
    >
      {/* Author row */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold font-sans shrink-0 overflow-hidden"
          style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
        >
          {post.author_avatar ? (
            <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold font-sans truncate" style={{ color: "hsl(var(--dark))" }}>
            {post.author_name}
          </p>
          <span className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
            {timeAgo(post.created_at)}
          </span>
        </div>
        {/* Three-dot menu */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setShowMenu(!showMenu)}
          className="w-8 h-8 rounded-full flex items-center justify-center relative"
        >
          <IonIcon name="ellipsis-vertical" size={16} style={{ color: "hsl(var(--text-muted))" }} />
        </motion.button>
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl overflow-hidden"
            style={{ background: "hsl(var(--bg))", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
          >
            {isOwnPost ? (
              <button
                onClick={handleDeleteOwn}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
              >
                <IonIcon name="trash-outline" size={16} style={{ color: "hsl(var(--coral))" }} />
                <span className="text-[13px] font-sans font-medium" style={{ color: "hsl(var(--coral))" }}>
                  Delete Post
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setShowReport(true); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
                  style={{ borderBottom: "0.5px solid hsl(var(--border))" }}
                >
                  <IonIcon name="flag-outline" size={16} style={{ color: "hsl(var(--coral))" }} />
                  <span className="text-[13px] font-sans font-medium" style={{ color: "hsl(var(--coral))" }}>
                    Report Post
                  </span>
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
                >
                  <IonIcon name="close-outline" size={16} style={{ color: "hsl(var(--text-muted))" }} />
                  <span className="text-[13px] font-sans font-medium" style={{ color: "hsl(var(--text-muted))" }}>
                    Cancel
                  </span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <p className="text-[14px] font-sans leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(var(--dark))" }}>
        {post.content}
      </p>

      {/* Post image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="w-full rounded-xl object-cover max-h-[260px]"
          loading="lazy"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-1" style={{ borderTop: "0.5px solid hsl(var(--border-subtle))" }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onLike}
          className="flex items-center gap-1.5 pt-2"
        >
          <IonIcon
            name={post.liked_by_me ? "heart" : "heart-outline"}
            size={18}
            style={{ color: post.liked_by_me ? "hsl(var(--coral))" : "hsl(var(--text-muted))" }}
          />
          <span
            className="text-[12px] font-sans font-medium"
            style={{ color: post.liked_by_me ? "hsl(var(--coral))" : "hsl(var(--text-muted))" }}
          >
            {post.likes_count || ""}
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onComment}
          className="flex items-center gap-1.5 pt-2"
        >
          <IonIcon name="chatbubble-outline" size={16} style={{ color: "hsl(var(--text-muted))" }} />
          <span className="text-[12px] font-sans font-medium" style={{ color: "hsl(var(--text-muted))" }}>
            {post.comments_count || ""}
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex items-center gap-1.5 ml-auto pt-2"
        >
          <IonIcon name="share-outline" size={16} style={{ color: "hsl(var(--text-muted))" }} />
        </motion.button>
      </div>

      {/* Report Sheet */}
      <AnimatePresence>
        {showReport && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => !reporting && setShowReport(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-7 pb-10"
              style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto" }}
            >
              <h3 className="font-serif text-[20px] mb-1" style={{ color: "hsl(var(--dark))" }}>
                Report Post
              </h3>
              <p className="text-[13px] font-sans mb-5" style={{ color: "hsl(var(--text-muted))" }}>
                Why are you reporting this post?
              </p>
              <div className="space-y-2 mb-6">
                {REPORT_REASONS.map((reason) => (
                  <motion.button
                    key={reason}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedReason(reason)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                    style={{
                      background: selectedReason === reason ? "hsl(var(--light-coral))" : "hsl(var(--bg))",
                      border: selectedReason === reason ? "1.5px solid hsl(var(--coral))" : "1.5px solid transparent",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: selectedReason === reason ? "hsl(var(--coral))" : "hsl(var(--border))" }}
                    >
                      {selectedReason === reason && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(var(--coral))" }} />
                      )}
                    </div>
                    <span className="text-[14px] font-sans" style={{ color: "hsl(var(--dark))" }}>
                      {reason}
                    </span>
                  </motion.button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleReport}
                disabled={!selectedReason || reporting}
                className="w-full py-[14px] rounded-2xl text-white text-[15px] font-semibold font-sans mb-3 disabled:opacity-50"
                style={{ background: "hsl(var(--coral))" }}
              >
                {reporting ? "Submitting…" : "Submit Report"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setShowReport(false); setSelectedReason(null); }}
                className="w-full py-[12px] text-[15px] font-semibold font-sans"
                style={{ color: "hsl(var(--text-muted))" }}
              >
                Cancel
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

CommunityCard.displayName = "CommunityCard";

export default CommunityCard;
