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
  gift_enabled: boolean;
  gift_total: number;
}

interface Gift {
  id: string;
  sender_name: string;
  amount: number;
  message: string | null;
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

  // Gift modals
  const [sendGiftPost, setSendGiftPost] = useState<BabyShowerPost | null>(null);
  const [viewGiftsPost, setViewGiftsPost] = useState<BabyShowerPost | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [giftSenderName, setGiftSenderName] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [sendingGift, setSendingGift] = useState(false);

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
    if (data) setPosts(data as any);
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

  const handleReaction = async (postId: string, type: "congrats" | "love" | "like" | "celebrate") => {
    if (!user) return;
    const existing = userReactions[postId];
    if (existing === type) {
      await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", user.id);
      setUserReactions((prev) => { const next = { ...prev }; delete next[postId]; return next; });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reactions_count: Math.max(0, p.reactions_count - 1) } : p)));
    } else if (existing) {
      await supabase.from("reactions").update({ type }).eq("post_id", postId).eq("user_id", user.id);
      setUserReactions((prev) => ({ ...prev, [postId]: type }));
    } else {
      await supabase.from("reactions").insert({ post_id: postId, user_id: user.id, type });
      setUserReactions((prev) => ({ ...prev, [postId]: type }));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reactions_count: p.reactions_count + 1 } : p)));
    }
  };

  const handleToggleGift = async (postId: string) => {
    if (!user || !isPremium) {
      toast.error("Gift-giving is a premium feature");
      return;
    }
    const { error } = await supabase
      .from("baby_shower_posts")
      .update({ gift_enabled: true } as any)
      .eq("id", postId)
      .eq("user_id", user.id);
    if (!error) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, gift_enabled: true } : p)));
      toast.success("Gifts enabled! Share your post so friends & family can send gifts 🎁");
    }
  };

  const handleSendGift = async () => {
    if (!sendGiftPost || !giftSenderName.trim() || !giftAmount) return;
    setSendingGift(true);
    try {
      const amount = parseFloat(giftAmount);
      if (isNaN(amount) || amount <= 0) { toast.error("Please enter a valid amount"); return; }

      const db = supabase as any;
      const { error } = await db.from("baby_shower_gifts").insert({
        post_id: sendGiftPost.id,
        sender_name: giftSenderName.trim(),
        amount,
        message: giftMessage.trim() || null,
        status: "completed",
      });
      if (error) throw error;

      // Update gift_total on post
      await supabase.from("baby_shower_posts").update({ gift_total: sendGiftPost.gift_total + amount } as any)
        .eq("id", sendGiftPost.id);

      setPosts((prev) => prev.map((p) => p.id === sendGiftPost.id ? { ...p, gift_total: p.gift_total + amount } : p));
      toast.success("Gift sent! 🎉");
      setSendGiftPost(null);
      setGiftSenderName(""); setGiftAmount(""); setGiftMessage("");
    } catch { toast.error("Failed to send gift"); }
    finally { setSendingGift(false); }
  };

  const handleViewGifts = async (post: BabyShowerPost) => {
    setViewGiftsPost(post);
    const db = supabase as any;
    const { data } = await db.from("baby_shower_gifts").select("*").eq("post_id", post.id).order("created_at", { ascending: false });
    if (data) setGifts(data);
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
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("baby-shower-images").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("baby-shower-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      const now = new Date();
      const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const { error } = await supabase.from("baby_shower_posts").insert({
        user_id: user.id, baby_name: babyName.trim(), parent_names: parentNames.trim(),
        gender, month_label: monthLabel, image_url: imageUrl,
      });
      if (error) throw error;
      toast.success("Baby post created! 🎉");
      setShowCreateForm(false);
      setBabyName(""); setParentNames(""); setGender("boy"); setImageFile(null); setImagePreview(null);
      fetchPosts();
    } catch (err) { console.error(err); toast.error("Failed to create post"); }
    finally { setSubmitting(false); }
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
        <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}>
          <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <h1 className="font-serif flex-1 text-[24px]" style={{ color: "hsl(var(--dark))" }}>Baby Shower 🎉</h1>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreateForm(true)}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
          style={{ background: "hsl(var(--coral))" }}>
          <IonIcon name="add" size={20} style={{ color: "white" }} />
        </motion.button>
      </motion.div>

      {/* Posts grouped by month */}
      {loading ? (
        <div className="tend-card p-8 text-center">
          <span className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Loading…</span>
        </div>
      ) : monthKeys.length === 0 ? (
        <motion.div variants={fadeUp} className="tend-card p-10 text-center">
          <div className="w-[64px] h-[64px] rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: "hsl(var(--light-coral))" }}>
            <IonIcon name="gift" size={30} style={{ color: "hsl(var(--coral))" }} />
          </div>
          <h3 className="font-serif text-[18px] mb-1" style={{ color: "hsl(var(--dark))" }}>No Celebrations Yet</h3>
          <p className="text-[13px] font-sans mb-4" style={{ color: "hsl(var(--text-muted))" }}>
            Be the first to celebrate your baby with the community!
          </p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCreateForm(true)}
            className="px-5 py-2.5 rounded-full text-[14px] font-semibold font-sans text-white"
            style={{ background: "hsl(var(--coral))" }}>
            Post Your Baby
          </motion.button>
        </motion.div>
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
                <motion.div key={post.id}
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 300, damping: 28 }}>
                  <BabyShowerCard
                    name={post.baby_name} parentName={post.parent_names} date={post.month_label}
                    imageUrl={post.image_url || "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop"}
                    gender={post.gender as "boy" | "girl"}
                    reactionsCount={post.reactions_count}
                    userReaction={userReactions[post.id] || null}
                    onReaction={(type) => handleReaction(post.id, type)}
                    giftEnabled={post.gift_enabled}
                    giftTotal={post.gift_total}
                    isPremium={isPremium}
                    isOwner={user?.id === post.user_id}
                    onToggleGift={() => handleToggleGift(post.id)}
                    onSendGift={() => setSendGiftPost(post)}
                    onViewGifts={() => handleViewGifts(post)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))
      )}

      {/* Post CTA */}
      {!showCreateForm && monthKeys.length > 0 && (
        <motion.div variants={fadeUp}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowCreateForm(true)}
            className="w-full py-4 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center gap-2"
            style={{ background: "hsl(var(--coral))", color: "white" }}>
            <IonIcon name="camera-outline" size={20} style={{ color: "white" }} />
            Post Your Baby
          </motion.button>
        </motion.div>
      )}

      {/* Send Gift Sheet */}
      <AnimatePresence>
        {sendGiftPost && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]" style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => !sendingGift && setSendGiftPost(null)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-6 pb-10"
              style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto", maxHeight: "85vh", overflowY: "auto" }}>
              <h3 className="font-serif text-[20px] mb-1" style={{ color: "hsl(var(--dark))" }}>Send a Gift 🎁</h3>
              <p className="text-[13px] font-sans mb-5" style={{ color: "hsl(var(--text-muted))" }}>
                Celebrate Baby {sendGiftPost.baby_name} with a gift!
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>Your Name</label>
                  <input type="text" value={giftSenderName} onChange={(e) => setGiftSenderName(e.target.value)} placeholder="e.g. Auntie Ngozi"
                    className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
                    style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                </div>
                <div>
                  <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>Gift Amount (₦)</label>
                  <input type="number" value={giftAmount} onChange={(e) => setGiftAmount(e.target.value)} placeholder="e.g. 5000"
                    className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
                    style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  <div className="flex gap-2 mt-2">
                    {[1000, 2000, 5000, 10000].map((amt) => (
                      <motion.button key={amt} whileTap={{ scale: 0.95 }} onClick={() => setGiftAmount(String(amt))}
                        className="px-3 py-1.5 rounded-full text-[12px] font-semibold font-sans"
                        style={{ background: giftAmount === String(amt) ? "hsl(45 93% 92%)" : "hsl(var(--bg))",
                          color: giftAmount === String(amt) ? "hsl(45 90% 40%)" : "hsl(var(--text-muted))" }}>
                        ₦{amt.toLocaleString()}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>Message (optional)</label>
                  <textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} placeholder="Congratulations! 🎉"
                    rows={2} className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none resize-none"
                    style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSendGift} disabled={sendingGift}
                  className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans disabled:opacity-60"
                  style={{ background: "hsl(45 90% 50%)" }}>
                  {sendingGift ? "Sending…" : `Send ₦${giftAmount ? parseInt(giftAmount).toLocaleString() : "0"} Gift`}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSendGiftPost(null)} disabled={sendingGift}
                  className="w-full py-[13px] text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* View Gifts Sheet */}
      <AnimatePresence>
        {viewGiftsPost && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]" style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setViewGiftsPost(null)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-6 pb-10"
              style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto", maxHeight: "85vh", overflowY: "auto" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-[20px]" style={{ color: "hsl(var(--dark))" }}>Gifts Received 🎁</h3>
                <div className="px-3 py-1 rounded-full" style={{ background: "hsl(45 93% 92%)" }}>
                  <span className="text-[13px] font-bold font-sans" style={{ color: "hsl(45 90% 40%)" }}>₦{viewGiftsPost.gift_total.toLocaleString()}</span>
                </div>
              </div>
              {gifts.length === 0 ? (
                <div className="text-center py-8">
                  <IonIcon name="gift-outline" size={40} style={{ color: "hsl(var(--text-muted))" }} />
                  <p className="text-[13px] font-sans mt-2" style={{ color: "hsl(var(--text-muted))" }}>No gifts yet. Share your post to receive gifts!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {gifts.map((g) => (
                    <div key={g.id} className="tend-card p-4 flex items-start gap-3">
                      <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(45 93% 92%)" }}>
                        <IonIcon name="gift" size={18} style={{ color: "hsl(45 90% 40%)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>{g.sender_name}</span>
                          <span className="text-[13px] font-sans font-bold" style={{ color: "hsl(45 90% 40%)" }}>₦{g.amount.toLocaleString()}</span>
                        </div>
                        {g.message && <p className="text-[11px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{g.message}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setViewGiftsPost(null)}
                className="w-full py-[13px] mt-4 text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                Close
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Post Sheet */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]" style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => !submitting && setShowCreateForm(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-6 pb-10"
              style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto", maxHeight: "85vh", overflowY: "auto" }}>
              <h3 className="font-serif text-[20px] mb-5" style={{ color: "hsl(var(--dark))" }}>Celebrate Your Baby 🎉</h3>
              <div className="space-y-4">
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
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileInputRef.current?.click()}
                      className="w-full h-[140px] rounded-2xl flex flex-col items-center justify-center gap-2"
                      style={{ background: "hsl(var(--bg))", border: "2px dashed hsl(var(--border))" }}>
                      <IonIcon name="camera-outline" size={28} style={{ color: "hsl(var(--text-muted))" }} />
                      <span className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Add a photo</span>
                    </motion.button>
                  )}
                </div>
                <div>
                  <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>Baby's Name</label>
                  <input type="text" value={babyName} onChange={(e) => setBabyName(e.target.value)} placeholder="e.g. Adaeze"
                    className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
                    style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                </div>
                <div>
                  <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>Parent Names</label>
                  <input type="text" value={parentNames} onChange={(e) => setParentNames(e.target.value)} placeholder="e.g. Ngozi & Emeka"
                    className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
                    style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                </div>
                <div>
                  <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>Gender</label>
                  <div className="flex gap-3">
                    {(["boy", "girl"] as const).map((g) => (
                      <motion.button key={g} whileTap={{ scale: 0.95 }} onClick={() => setGender(g)}
                        className="flex-1 py-3 rounded-2xl text-[14px] font-semibold font-sans"
                        style={{
                          background: gender === g ? g === "boy" ? "hsl(214 80% 94%)" : "hsl(var(--light-coral))" : "hsl(var(--bg))",
                          color: gender === g ? g === "boy" ? "hsl(214 60% 55%)" : "hsl(var(--coral))" : "hsl(var(--text-muted))",
                        }}>
                        {g === "boy" ? "👶 Boy" : "👶 Girl"}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmitPost} disabled={submitting}
                  className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans disabled:opacity-60"
                  style={{ background: "hsl(var(--coral))" }}>
                  {submitting ? "Posting…" : "Share with Community"}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreateForm(false)} disabled={submitting}
                  className="w-full py-[13px] text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--text-muted))" }}>
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
