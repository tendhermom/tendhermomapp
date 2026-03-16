import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CommunityCard from "@/components/cards/CommunityCard";
import IonIcon from "@/components/IonIcon";
import TopBar from "@/components/navigation/TopBar";
import { useCommunityStore, type ChannelId, type PostComment } from "@/stores/communityStore";
import { useAuthStore } from "@/stores/authStore";
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

  // Create post modal
  const [showCreate, setShowCreate] = useState(false);
  const [posting, setPosting] = useState(false);

  // Comments sheet
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const handleCreatePost = async (content: string) => {
    if (!content.trim() || !user) return;
    setPosting(true);
    // Users can only post in their own trimester community
    const userChannel = (user.current_stage || "first_trimester") as ChannelId;
    const ok = await createPost(content.trim(), userChannel);
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

  return (
    <div className="space-y-5 pb-4 relative">
      <TopBar onProfilePress={() => onNavigate("profile")} />

      <div>
        <h1 className="font-serif text-[26px]" style={{ color: "hsl(var(--dark))" }}>Community</h1>
        <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Connect with other moms</p>
      </div>

      {/* Channel tabs - no scrollbar */}
      <div className="flex gap-2 pb-1">
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
      {activeChannel === user?.current_stage && (
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
        channelLabel={CHANNELS.find(c => c.id === user?.current_stage)?.label || "Your Community"}
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
