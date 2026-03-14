import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import BabyShowerCard from "@/components/cards/BabyShowerCard";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BabyShowerPost {
  id: string;
  baby_name: string;
  parent_names: string;
  month_label: string;
  gender: string;
  image_url: string | null;
  reactions_count: number;
  user_id: string;
  created_at: string;
}

interface BabyShowerScreenProps {
  onBack: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const BabyShowerScreen = ({ onBack }: BabyShowerScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan_type === "premium";

  const [posts, setPosts] = useState<BabyShowerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});

  // Create form state
  const [babyName, setBabyName] = useState("");
  const [parentNames, setParentNames] = useState("");
  const [gender, setGender] = useState<"boy" | "girl">("boy");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    if (user) fetchUserReactions();
  }, [user]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("baby_shower_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  };

  const fetchUserReactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reactions")
      .select("post_id, type")
      .eq("user_id", user.id);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((r) => (map[r.post_id] = r.type));
      setUserReactions(map);
    }
  };

  const handleReaction = async (postId: string, type: "congrats" | "love" | "celebrate") => {
    if (!user) return;
    if (!isPremium) {
      toast.error("Upgrade to Premium to react");
      return;
    }

    const existing = userReactions[postId];
    if (existing) {
      // Remove existing reaction
      await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", user.id);
      setUserReactions((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      // Decrement count
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, reactions_count: Math.max(0, p.reactions_count - 1) } : p))
      );
    } else {
      // Add reaction
      await supabase.from("reactions").insert({ post_id: postId, user_id: user.id, type });
      setUserReactions((prev) => ({ ...prev, [postId]: type }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, reactions_count: p.reactions_count + 1 } : p))
      );
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitPost = async () => {
    if (!user || !babyName.trim() || !parentNames.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    let imageUrl: string | null = null;

    try {
      // Upload image if selected
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("baby-shower-images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("baby-shower-images")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const now = new Date();
      const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      const { error } = await supabase.from("baby_shower_posts").insert({
        user_id: user.id,
        baby_name: babyName.trim(),
        parent_names: parentNames.trim(),
        gender,
        month_label: monthLabel,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast.success("Baby post created!");
      setShowCreateForm(false);
      setBabyName("");
      setParentNames("");
      setGender("boy");
      setImageFile(null);
      setImagePreview(null);
      fetchPosts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  // Group posts by month
  const grouped = posts.reduce<Record<string, BabyShowerPost[]>>((acc, post) => {
    if (!acc[post.month_label]) acc[post.month_label] = [];
    acc[post.month_label].push(post);
    return acc;
  }, {});

  const monthKeys = Object.keys(grouped);

  return (
    <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.88 }} onClick={onBack} className="ios-press">
          <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif flex-1 text-[24px]" style={{ color: "hsl(var(--dark))" }}>Baby Shower</h1>
        {isPremium && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCreateForm(true)}
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--coral))" }}
          >
            <IonIcon name="add" size={20} style={{ color: "white" }} />
          </motion.button>
        )}
      </motion.div>

      {/* Premium banner */}
      {!isPremium && (
        <motion.div variants={fadeUp} className="tend-card p-4 flex items-center gap-3" style={{ background: "hsl(var(--light-coral))" }}>
          <IonIcon name="lock-closed" size={20} style={{ color: "hsl(var(--coral))" }} />
          <div className="flex-1">
            <p className="text-[13px] font-semibold font-sans" style={{ color: "hsl(var(--coral))" }}>Premium Feature</p>
            <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Upgrade to celebrate & post your baby</p>
          </div>
        </motion.div>
      )}

      {/* Posts grouped by month */}
      {loading ? (
        <div className="tend-card p-8 text-center">
          <span className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Loading…</span>
        </div>
      ) : monthKeys.length === 0 ? (
        <div className="tend-card p-8 text-center">
          <IonIcon name="gift" size={32} style={{ color: "hsl(var(--border))" }} />
          <p className="text-[14px] font-sans mt-2" style={{ color: "hsl(var(--text-muted))" }}>No baby shower posts yet</p>
        </div>
      ) : (
        monthKeys.map((month) => (
          <motion.div key={month} variants={fadeUp}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-[18px]" style={{ color: "hsl(var(--dark))" }}>{month}</h2>
              <div className="px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--light-coral))" }}>
                <span className="text-[11px] font-bold font-sans" style={{ color: "hsl(var(--coral))" }}>
                  {grouped[month].length} {grouped[month].length === 1 ? "baby" : "babies"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {grouped[month].map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 300, damping: 28 }}
                >
                  <BabyShowerCard
                    name={post.baby_name}
                    parentName={post.parent_names}
                    date={post.month_label}
                    imageUrl={post.image_url || "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop"}
                    gender={post.gender as "boy" | "girl"}
                    reactionsCount={post.reactions_count}
                    userReaction={userReactions[post.id] || null}
                    onReaction={(type) => handleReaction(post.id, type)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))
      )}

      {/* Post your baby CTA (for premium without + button) */}
      {isPremium && !showCreateForm && (
        <motion.div variants={fadeUp}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowCreateForm(true)}
            className="w-full py-4 rounded-2xl text-[15px] font-semibold font-sans ios-press flex items-center justify-center gap-2"
            style={{ background: "hsl(var(--coral))", color: "white" }}
          >
            <IonIcon name="camera-outline" size={20} style={{ color: "white" }} />
            Post Your Baby
          </motion.button>
        </motion.div>
      )}

      {/* Create Post Sheet */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => !submitting && setShowCreateForm(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-6 pb-10"
              style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto", maxHeight: "85vh", overflowY: "auto" }}
            >
              <h3 className="font-serif text-[20px] mb-5" style={{ color: "hsl(var(--dark))" }}>
                Celebrate Your Baby
              </h3>

              <div className="space-y-4">
                {/* Image upload */}
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  {imagePreview ? (
                    <motion.div whileTap={{ scale: 0.98 }} onClick={() => fileInputRef.current?.click()} className="relative cursor-pointer">
                      <img src={imagePreview} alt="Preview" className="w-full h-[180px] object-cover rounded-2xl" />
                      <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                        <IonIcon name="camera" size={28} style={{ color: "white" }} />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-[140px] rounded-2xl flex flex-col items-center justify-center gap-2"
                      style={{ background: "hsl(var(--bg))", border: "2px dashed hsl(var(--border))" }}
                    >
                      <IonIcon name="camera-outline" size={28} style={{ color: "hsl(var(--text-muted))" }} />
                      <span className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Add a photo</span>
                    </motion.button>
                  )}
                </div>

                {/* Baby name */}
                <div>
                  <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
                    Baby's Name
                  </label>
                  <input
                    type="text"
                    value={babyName}
                    onChange={(e) => setBabyName(e.target.value)}
                    placeholder="e.g. Adaeze"
                    className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
                    style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
                  />
                </div>

                {/* Parent names */}
                <div>
                  <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
                    Parent Names
                  </label>
                  <input
                    type="text"
                    value={parentNames}
                    onChange={(e) => setParentNames(e.target.value)}
                    placeholder="e.g. Ngozi & Emeka"
                    className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
                    style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
                    Gender
                  </label>
                  <div className="flex gap-3">
                    {(["boy", "girl"] as const).map((g) => (
                      <motion.button
                        key={g}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setGender(g)}
                        className="flex-1 py-3 rounded-2xl text-[14px] font-semibold font-sans"
                        style={{
                          background: gender === g
                            ? g === "boy" ? "hsl(214 80% 94%)" : "hsl(var(--light-coral))"
                            : "hsl(var(--bg))",
                          color: gender === g
                            ? g === "boy" ? "hsl(214 60% 55%)" : "hsl(var(--coral))"
                            : "hsl(var(--text-muted))",
                        }}
                      >
                        {g === "boy" ? "Boy" : "Girl"}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmitPost}
                  disabled={submitting}
                  className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans disabled:opacity-60"
                  style={{ background: "hsl(var(--coral))" }}
                >
                  {submitting ? "Posting…" : "Share with Community"}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCreateForm(false)}
                  disabled={submitting}
                  className="w-full py-[13px] text-[15px] font-semibold font-sans"
                  style={{ color: "hsl(var(--text-muted))" }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BabyShowerScreen;
