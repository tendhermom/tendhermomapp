import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CommunityCard from "@/components/cards/CommunityCard";
import IonIcon from "@/components/IonIcon";
import TopBar from "@/components/navigation/TopBar";
import { useCommunityStore, type ChannelId, type PostComment } from "@/stores/communityStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CreatePostModal from "@/components/community/CreatePostModal";
import CommentsSheet from "@/components/community/CommentsSheet";

interface CommunityScreenProps {
  onNavigate: (tab: string) => void;
}

const CHANNELS: { id: ChannelId; label: string; icon: string }[] = [
  { id: "first_trimester", label: "1st Tri", icon: "leaf-outline" },
  { id: "second_trimester", label: "2nd Tri", icon: "flower-outline" },
  { id: "third_trimester", label: "3rd Tri", icon: "heart-outline" },
  { id: "postpartum", label: "Postpartum", icon: "happy-outline" },
];

const CommunityScreen = ({ onNavigate }: CommunityScreenProps) => {
  const { activeChannel, posts, loading, hasMore, setActiveChannel, fetchPosts, loadMore, toggleLike, createPost, fetchComments, addComment } = useCommunityStore();
  const user = useAuthStore((s) => s.user);

  // Auto-set to user's trimester on mount
  useEffect(() => {
    const userChannel = user?.current_stage || "first_trimester";
    setActiveChannel(userChannel as ChannelId);
  }, [user?.current_stage]);

  // Realtime subscription — throttled to prevent refetch storms at scale
  const lastRefetch = useRef(0);
  const throttledRefetch = useCallback(() => {
    const now = Date.now();
    if (now - lastRefetch.current < 3000) return; // 3s throttle
    lastRefetch.current = now;
    fetchPosts(activeChannel);
  }, [activeChannel, fetchPosts]);

  useEffect(() => {
    const channel = supabase
      .channel(`community-${activeChannel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts", filter: `channel=eq.${activeChannel}` },
        throttledRefetch
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel, throttledRefetch]);

  // Create post modal
  const [showCreate, setShowCreate] = useState(false);
  const [posting, setPosting] = useState(false);

  // Comments sheet
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const handleCreatePost = async (content: string, imageUrl?: string) => {
    if ((!content.trim() && !imageUrl) || !user) return;
    setPosting(true);
    const userChannel = (user.current_stage || "first_trimester") as ChannelId;
    const ok = await createPost(content.trim(), userChannel, imageUrl);
    setPosting(false);
    if (ok) {
      setShowCreate(false);
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
  };

  const handleAddComment = async (text: string) => {
    if (!text.trim() || !commentsPostId) return;
    const ok = await addComment(commentsPostId, text.trim());
    if (ok) {
      const data = await fetchComments(commentsPostId);
      setComments(data);
    }
  };

  const userChannel = user?.current_stage || "first_trimester";

  return (
    <div className="space-y-5 pb-4 relative">
      <TopBar />

      <div>
        <h1 className="font-serif text-[26px]" style={{ color: "hsl(var(--dark))" }}>Community</h1>
        <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Connect with other moms</p>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-2 pb-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {CHANNELS.map((ch) => {
          const isYou = ch.id === userChannel;
          return (
            <motion.button
              key={ch.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveChannel(ch.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-sans font-medium whitespace-nowrap shrink-0 transition-colors relative"
              style={{
                background: activeChannel === ch.id ? "hsl(var(--green))" : "hsl(var(--surface))",
                color: activeChannel === ch.id ? "white" : "hsl(var(--dark))",
                boxShadow: activeChannel === ch.id ? "0 2px 12px hsla(153,42%,30%,0.3)" : "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <IonIcon name={ch.icon} size={14} style={{ color: activeChannel === ch.id ? "white" : "hsl(var(--text-muted))" }} />
              {ch.label}
              {isYou && (
                <span
                  className="text-[9px] font-bold px-1.5 py-[1px] rounded-full ml-0.5"
                  style={{
                    background: activeChannel === ch.id ? "rgba(255,255,255,0.25)" : "hsl(var(--light-green))",
                    color: activeChannel === ch.id ? "white" : "hsl(var(--green))",
                  }}
                >
                  You
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="tend-card p-10 text-center">
          <div className="w-[56px] h-[56px] rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: "hsl(var(--light-green))" }}>
            <IonIcon name="chatbubbles-outline" size={26} style={{ color: "hsl(var(--green))" }} />
          </div>
          <h3 className="font-serif text-[18px] mb-1" style={{ color: "hsl(var(--dark))" }}>No Posts Yet</h3>
          <p className="text-[13px] font-sans mb-4" style={{ color: "hsl(var(--text-muted))" }}>
            Be the first to share in this community!
          </p>
          {activeChannel === userChannel && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-full text-[14px] font-semibold font-sans text-white"
              style={{ background: "hsl(var(--green))" }}
            >
              Create Post
            </motion.button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <CommunityCard
                  post={post}
                  onLike={() => user && toggleLike(post.id, user.id)}
                  onComment={() => openComments(post.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {hasMore && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={loadMore}
              className="w-full py-3 rounded-xl text-[13px] font-sans font-semibold"
              style={{ color: "hsl(var(--green))", background: "hsl(var(--surface))" }}
            >
              Load more
            </motion.button>
          )}
        </div>
      )}

      {/* FAB - only show if viewing own community */}
      {activeChannel === userChannel && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreate(true)}
          className="fixed bottom-24 right-6 w-[56px] h-[56px] rounded-full flex items-center justify-center z-40"
          style={{ background: "hsl(var(--coral))", boxShadow: "0 6px 24px hsla(11,74%,63%,0.45)" }}
        >
          <IonIcon name="add" size={28} style={{ color: "white" }} />
        </motion.button>
      )}

      <CreatePostModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreatePost}
        posting={posting}
        channelLabel={CHANNELS.find(c => c.id === userChannel)?.label || "Your Community"}
      />

      <CommentsSheet
        open={!!commentsPostId}
        onClose={() => { setCommentsPostId(null); setComments([]); }}
        comments={comments}
        loading={loadingComments}
        onAddComment={handleAddComment}
      />
    </div>
  );
};

export default CommunityScreen;
