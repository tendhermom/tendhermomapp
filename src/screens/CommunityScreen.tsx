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

import img1st from "@/assets/community-1st-trimester.jpg";
import img2nd from "@/assets/community-2nd-trimester.jpg";
import img3rd from "@/assets/community-3rd-trimester.jpg";
import imgPost from "@/assets/community-postpartum.jpg";

interface CommunityScreenProps {
  onNavigate: (tab: string) => void;
}

const COMMUNITIES = [
  { id: "first_trimester" as ChannelId, label: "1st Trimester", subtitle: "Weeks 1–13", image: img1st, members: "2.1k" },
  { id: "second_trimester" as ChannelId, label: "2nd Trimester", subtitle: "Weeks 14–26", image: img2nd, members: "1.8k" },
  { id: "third_trimester" as ChannelId, label: "3rd Trimester", subtitle: "Weeks 27–40", image: img3rd, members: "1.5k" },
  { id: "postpartum" as ChannelId, label: "Postpartum", subtitle: "After birth", image: imgPost, members: "3.2k" },
];

const db = supabase as any;

const CommunityScreen = ({ onNavigate }: CommunityScreenProps) => {
  const { activeChannel, posts, loading, hasMore, setActiveChannel, fetchPosts, loadMore, toggleLike, createPost, fetchComments, addComment } = useCommunityStore();
  const user = useAuthStore((s) => s.user);

  // Membership state
  const [memberships, setMemberships] = useState<string[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [activeCommunity, setActiveCommunity] = useState<ChannelId | null>(null);

  // Join flow
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joiningCommunity, setJoiningCommunity] = useState<ChannelId | null>(null);
  const [joining, setJoining] = useState(false);

  // Leave confirmation
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Create post modal
  const [showCreate, setShowCreate] = useState(false);
  const [posting, setPosting] = useState(false);

  // Comments sheet
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Fetch memberships
  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data } = await db
        .from("community_memberships")
        .select("community")
        .eq("user_id", user.id);
      setMemberships((data || []).map((d: any) => d.community));
      setLoadingMemberships(false);
    };
    fetch();
  }, [user]);

  // Realtime subscription — throttled
  const lastRefetch = useRef(0);
  const throttledRefetch = useCallback(() => {
    const now = Date.now();
    if (now - lastRefetch.current < 3000) return;
    lastRefetch.current = now;
    if (activeCommunity) fetchPosts(activeCommunity);
  }, [activeCommunity, fetchPosts]);

  useEffect(() => {
    if (!activeCommunity) return;
    const channel = supabase
      .channel(`community-${activeCommunity}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts", filter: `channel=eq.${activeCommunity}` },
        throttledRefetch
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeCommunity, throttledRefetch]);

  // Handle tapping a community card
  const handleCommunityTap = (communityId: ChannelId) => {
    if (memberships.includes(communityId)) {
      // Already a member — enter the feed
      setActiveCommunity(communityId);
      setActiveChannel(communityId);
    } else {
      // Not a member — show join modal
      setJoiningCommunity(communityId);
      setShowJoinModal(true);
    }
  };

  // Join community
  const handleJoin = async () => {
    if (!user || !joiningCommunity) return;
    setJoining(true);
    const { error } = await db
      .from("community_memberships")
      .insert({ user_id: user.id, community: joiningCommunity });

    if (!error) {
      setMemberships([...memberships, joiningCommunity]);
      setShowJoinModal(false);
      setActiveCommunity(joiningCommunity);
      setActiveChannel(joiningCommunity);
      toast.success(`Welcome to the ${COMMUNITIES.find(c => c.id === joiningCommunity)?.label} community!`);
    } else {
      toast.error("Failed to join community");
    }
    setJoining(false);
  };

  // Leave community
  const handleLeave = async () => {
    if (!user || !activeCommunity) return;
    setLeaving(true);
    await db
      .from("community_memberships")
      .delete()
      .eq("user_id", user.id)
      .eq("community", activeCommunity);

    setMemberships(memberships.filter(m => m !== activeCommunity));
    setShowLeaveConfirm(false);
    setActiveCommunity(null);
    setLeaving(false);
    toast("You left the community");
  };

  const handleCreatePost = async (content: string, imageUrl?: string) => {
    if ((!content.trim() && !imageUrl) || !user || !activeCommunity) return;
    setPosting(true);
    const ok = await createPost(content.trim(), activeCommunity, imageUrl);
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

  // ─── FEED VIEW (inside a community) ───
  if (activeCommunity) {
    const communityInfo = COMMUNITIES.find(c => c.id === activeCommunity)!;
    return (
      <div className="space-y-4 pb-4 pt-1 relative">
        {/* Header with back button */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveCommunity(null)}
            className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--surface))" }}
          >
            <IonIcon name="arrow-back" size={20} style={{ color: "hsl(var(--dark))" }} />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-[22px] leading-tight truncate" style={{ color: "hsl(var(--dark))" }}>
              {communityInfo.label}
            </h1>
            <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              {communityInfo.subtitle}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowLeaveConfirm(true)}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold font-sans"
            style={{ background: "hsl(var(--surface))", color: "hsl(var(--coral))", border: "1px solid hsl(var(--border))" }}
          >
            Leave
          </motion.button>
        </div>

        {/* Posts feed — Facebook-style */}
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
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-full text-[14px] font-semibold font-sans text-white"
              style={{ background: "hsl(var(--green))" }}
            >
              Create Post
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Create post prompt — Facebook style */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: "hsl(var(--surface))", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold font-sans shrink-0"
                style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
              >
                {(user?.full_name || "?")[0].toUpperCase()}
              </div>
              <span className="text-[14px] font-sans flex-1 text-left" style={{ color: "hsl(var(--text-muted))" }}>
                What's on your mind?
              </span>
              <IonIcon name="camera-outline" size={20} style={{ color: "hsl(var(--green))" }} />
            </motion.button>

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

        {/* FAB */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreate(true)}
          className="fixed bottom-24 right-6 w-[56px] h-[56px] rounded-full flex items-center justify-center z-40"
          style={{ background: "hsl(var(--coral))", boxShadow: "0 6px 24px hsla(11,74%,63%,0.45)" }}
        >
          <IonIcon name="add" size={28} style={{ color: "white" }} />
        </motion.button>

        <CreatePostModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreatePost}
          posting={posting}
          channelLabel={communityInfo.label}
        />

        <CommentsSheet
          open={!!commentsPostId}
          onClose={() => { setCommentsPostId(null); setComments([]); }}
          comments={comments}
          loading={loadingComments}
          onAddComment={handleAddComment}
        />

        {/* Leave confirmation sheet */}
        <AnimatePresence>
          {showLeaveConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100]"
                style={{ background: "rgba(0,0,0,0.5)" }}
                onClick={() => !leaving && setShowLeaveConfirm(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-8 pb-[max(env(safe-area-inset-bottom,40px),40px)]"
                style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto" }}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-[56px] h-[56px] rounded-full flex items-center justify-center mb-4"
                    style={{ background: "hsl(var(--light-coral))" }}
                  >
                    <IonIcon name="exit-outline" size={28} style={{ color: "hsl(var(--coral))" }} />
                  </div>
                  <h3 className="font-serif text-[20px] mb-2" style={{ color: "hsl(var(--dark))" }}>
                    Leave {communityInfo.label}?
                  </h3>
                  <p className="text-[14px] font-sans mb-6" style={{ color: "hsl(var(--text-muted))" }}>
                    You won't see posts from this community anymore. You can rejoin anytime.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLeave}
                    disabled={leaving}
                    className="w-full py-[14px] rounded-2xl text-white text-[15px] font-semibold font-sans mb-3 disabled:opacity-60"
                    style={{ background: "hsl(var(--coral))" }}
                  >
                    {leaving ? "Leaving…" : "Leave Community"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowLeaveConfirm(false)}
                    className="w-full py-[12px] rounded-2xl text-[15px] font-semibold font-sans"
                    style={{ color: "hsl(var(--text-muted))" }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── DISCOVERY VIEW (community grid) ───
  return (
    <div className="space-y-5 pb-4 pt-1">
      <TopBar />

      <div className="pt-1">
        <h1 className="font-serif text-[30px] leading-tight tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>Community</h1>
        <p className="text-[13px] font-sans mt-1.5 leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
          Join a community that matches your journey
        </p>
      </div>

      {loadingMemberships ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--green))", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {COMMUNITIES.map((community) => {
            const isMember = memberships.includes(community.id);
            return (
              <motion.button
                key={community.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCommunityTap(community.id)}
                className="relative rounded-[20px] overflow-hidden text-left"
                style={{ aspectRatio: "3/4", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.15)" }}
              >
                {/* Background image */}
                <img
                  src={community.image}
                  alt={community.label}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%)" }}
                />
                {/* Member badge */}
                {isMember && (
                  <div className="absolute top-3 right-3">
                    <span
                      className="text-[10px] font-sans font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{ background: "hsl(var(--green))", color: "white" }}
                    >
                      <IonIcon name="checkmark-circle" size={12} style={{ color: "white" }} />
                      Joined
                    </span>
                  </div>
                )}
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-serif text-[18px] leading-tight">{community.label}</h3>
                  <p className="text-white/60 text-[12px] font-sans mt-0.5">{community.subtitle}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <IonIcon name="people" size={12} style={{ color: "rgba(255,255,255,0.5)" }} />
                    <span className="text-[11px] font-sans font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {community.members} members
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Join confirmation modal */}
      <AnimatePresence>
        {showJoinModal && joiningCommunity && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => !joining && setShowJoinModal(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-8 pb-[max(env(safe-area-inset-bottom,40px),40px)]"
              style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto" }}
            >
              <div className="flex flex-col items-center text-center">
                {/* Community image preview */}
                <div className="w-[80px] h-[80px] rounded-full overflow-hidden mb-4" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
                  <img
                    src={COMMUNITIES.find(c => c.id === joiningCommunity)?.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-serif text-[22px] mb-1" style={{ color: "hsl(var(--dark))" }}>
                  Join {COMMUNITIES.find(c => c.id === joiningCommunity)?.label}?
                </h3>
                <p className="text-[13px] font-sans mb-2" style={{ color: "hsl(var(--text-muted))" }}>
                  {COMMUNITIES.find(c => c.id === joiningCommunity)?.subtitle}
                </p>
                <p className="text-[14px] font-sans mb-6 leading-relaxed" style={{ color: "hsl(var(--dark))" }}>
                  Are you currently in your <span className="font-semibold" style={{ color: "hsl(var(--green))" }}>
                    {COMMUNITIES.find(c => c.id === joiningCommunity)?.label}
                  </span>? Joining lets you share, post pictures, comment, and connect with moms in the same stage.
                </p>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans mb-3 disabled:opacity-60"
                  style={{ background: "hsl(var(--green))" }}
                >
                  {joining ? "Joining…" : "Yes, Join Community"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowJoinModal(false)}
                  disabled={joining}
                  className="w-full py-[13px] rounded-2xl text-[15px] font-semibold font-sans"
                  style={{ color: "hsl(var(--text-muted))" }}
                >
                  Not yet
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityScreen;
