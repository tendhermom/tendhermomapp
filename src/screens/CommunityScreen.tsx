import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CommunityCard from "@/components/cards/CommunityCard";
import IonIcon from "@/components/IonIcon";
import TopBar from "@/components/navigation/TopBar";
import { useCommunityStore, type ChannelId, type PostComment } from "@/stores/communityStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface CommunityScreenProps {
  onNavigate: (tab: string) => void;
}

const CHANNELS: { id: ChannelId; label: string; icon: string }[] = [
  { id: "general", label: "All", icon: "globe-outline" },
  { id: "first_trimester", label: "1st Tri", icon: "leaf-outline" },
  { id: "second_trimester", label: "2nd Tri", icon: "flower-outline" },
  { id: "third_trimester", label: "3rd Tri", icon: "heart-outline" },
  { id: "postpartum", label: "Postpartum", icon: "happy-outline" },
];

const CommunityScreen = ({ onNavigate }: CommunityScreenProps) => {
  const { activeChannel, posts, loading, setActiveChannel, fetchPosts, toggleLike, createPost, fetchComments, addComment } = useCommunityStore();
  const user = useAuthStore((s) => s.user);

  // Create post modal
  const [showCreate, setShowCreate] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newChannel, setNewChannel] = useState<ChannelId>("general");
  const [posting, setPosting] = useState(false);

  // Comments sheet
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts(activeChannel);
  }, []);

  const handleCreatePost = async () => {
    if (!newContent.trim()) return;
    setPosting(true);
    const ok = await createPost(newContent.trim(), newChannel);
    setPosting(false);
    if (ok) {
      setShowCreate(false);
      setNewContent("");
      toast.success("Post shared!");
    } else {
      toast.error("Failed to create post");
    }
  };

  const openComments = async (postId: string) => {
    setCommentsPostId(postId);
    setLoadingComments(true);
    const data = await fetchComments(postId);
    setComments(data);
    setLoadingComments(false);
    setTimeout(() => commentInputRef.current?.focus(), 300);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentsPostId) return;
    const ok = await addComment(commentsPostId, commentText.trim());
    if (ok) {
      setCommentText("");
      const data = await fetchComments(commentsPostId);
      setComments(data);
    }
  };

  return (
    <div className="space-y-5 pb-4 relative">
      <TopBar onProfilePress={() => onNavigate("profile")} onAIChatPress={() => onNavigate("ai-chat")} />

      <div>
        <h1 className="font-serif text-[26px]" style={{ color: "hsl(var(--dark))" }}>Community</h1>
        <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Connect with other moms</p>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {CHANNELS.map((ch) => (
          <motion.button
            key={ch.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveChannel(ch.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-sans font-medium whitespace-nowrap shrink-0 transition-colors"
            style={{
              background: activeChannel === ch.id ? "hsl(var(--green))" : "hsl(var(--surface))",
              color: activeChannel === ch.id ? "white" : "hsl(var(--dark))",
              boxShadow: activeChannel === ch.id ? "0 2px 12px hsla(153,42%,30%,0.3)" : "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <IonIcon name={ch.icon} size={14} style={{ color: activeChannel === ch.id ? "white" : "hsl(var(--text-muted))" }} />
            {ch.label}
          </motion.button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <IonIcon name="chatbubbles-outline" size={40} style={{ color: "hsl(var(--text-muted))" }} />
          <p className="text-[14px] font-sans mt-3" style={{ color: "hsl(var(--text-muted))" }}>
            No posts yet. Be the first to share!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <CommunityCard
              key={post.id}
              post={post}
              onLike={() => user && toggleLike(post.id, user.id)}
              onComment={() => openComments(post.id)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => { setNewChannel(activeChannel === "general" ? "general" : activeChannel); setShowCreate(true); }}
        className="fixed bottom-24 right-6 w-[56px] h-[56px] rounded-full flex items-center justify-center z-40"
        style={{ background: "hsl(var(--coral))", boxShadow: "0 6px 24px hsla(11,74%,63%,0.45)" }}
      >
        <IonIcon name="add" size={28} style={{ color: "white" }} />
      </motion.button>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowCreate(false)}
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
              <h3 className="font-serif text-[20px] mb-4" style={{ color: "hsl(var(--dark))" }}>Share with the community</h3>

              {/* Channel picker */}
              <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                {CHANNELS.filter(c => c.id !== "general").map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setNewChannel(ch.id)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-sans font-medium whitespace-nowrap shrink-0"
                    style={{
                      background: newChannel === ch.id ? "hsl(var(--light-green))" : "hsl(var(--bg))",
                      color: newChannel === ch.id ? "hsl(var(--green))" : "hsl(var(--text-muted))",
                      border: `1px solid ${newChannel === ch.id ? "hsl(var(--green))" : "hsl(var(--border-subtle))"}`,
                    }}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={1000}
                rows={4}
                autoFocus
                className="w-full px-4 py-3 rounded-2xl text-[15px] font-sans outline-none resize-none"
                style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))", border: "1.5px solid hsl(var(--border-subtle))" }}
              />

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCreatePost}
                disabled={!newContent.trim() || posting}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold font-sans mt-4"
                style={{ background: "hsl(var(--green))", color: "white", opacity: !newContent.trim() || posting ? 0.6 : 1 }}
              >
                {posting ? "Posting…" : "Post"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Sheet */}
      <AnimatePresence>
        {commentsPostId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => { setCommentsPostId(null); setComments([]); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] rounded-t-3xl p-5 pb-8 max-h-[70vh] flex flex-col"
              style={{ background: "hsl(var(--surface))" }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "hsl(var(--border-subtle))" }} />
              <h3 className="font-serif text-[18px] mb-4" style={{ color: "hsl(var(--dark))" }}>Comments</h3>

              <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
                {loadingComments ? (
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
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment…"
                  maxLength={500}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[14px] font-sans outline-none"
                  style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))", border: "1.5px solid hsl(var(--border-subtle))" }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--green))", opacity: commentText.trim() ? 1 : 0.5 }}
                >
                  <IonIcon name="send" size={18} style={{ color: "white" }} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityScreen;
