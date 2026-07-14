import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import BabyShowerCard from "@/components/cards/BabyShowerCard";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PremiumGate from "@/components/PremiumGate";
import { uploadWithProgress } from "@/lib/uploadWithProgress";
import UploadProgress from "@/components/UploadProgress";

import babyShower1 from "@/assets/baby-shower-1.jpg";
import babyShower2 from "@/assets/baby-shower-2.jpg";
import babyShower3 from "@/assets/baby-shower-3.jpg";
import babyShower4 from "@/assets/baby-shower-4.jpg";

interface BabyShowerPost {
  id: string;
  baby_name: string;
  parent_names: string;
  month_label: string;
  gender: string;
  birth_type: "single" | "twins" | "triplets" | "quadruplets";
  image_url: string | null;
  reactions_count: number;
  user_id: string;
  created_at: string;
}

interface GiftAccount {
  account_name: string;
  account_number: string;
  bank_name: string;
}

interface BabyShowerScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

// Generate month cards — past 2 months + current + next 9 months
const generateMonthCards = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const months: { label: string; month: number; year: number; isCurrent: boolean }[] = [];

  for (let offset = -2; offset <= 9; offset++) {
    const d = new Date(currentYear, currentMonth + offset, 1);
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    months.push({
      label,
      month: d.getMonth(),
      year: d.getFullYear(),
      isCurrent: offset === 0,
    });
  }
  return months;
};

const MONTH_CARDS = generateMonthCards();

const MONTH_IMAGES = [babyShower1, babyShower2, babyShower3, babyShower4];

const BabyShowerScreen = ({ onBack, onNavigate }: BabyShowerScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan_type === "premium";

  const [posts, setPosts] = useState<BabyShowerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  // P2P Give-a-Gift sheet (visitor sees poster's bank account details from their Gift Settings)
  const [giveGiftPost, setGiveGiftPost] = useState<BabyShowerPost | null>(null);
  const [giftAccount, setGiftAccount] = useState<GiftAccount | null>(null);
  const [loadingGift, setLoadingGift] = useState(false);

  // Create form state
  const [babyName, setBabyName] = useState("");
  const [parentNames, setParentNames] = useState("");
  const [gender, setGender] = useState<"boy" | "girl" | "mixed">("boy");
  const [birthType, setBirthType] = useState<"single" | "twins" | "triplets" | "quadruplets">("single");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPosts();
    if (user) fetchUserReactions();
  }, [user]);

  // Auto-scroll to current month card on mount
  useEffect(() => {
    if (scrollRef.current) {
      const currentIndex = MONTH_CARDS.findIndex((m) => m.isCurrent);
      if (currentIndex >= 0) {
        const cardWidth = 160 + 12; // width + gap
        scrollRef.current.scrollLeft = Math.max(0, currentIndex * cardWidth - 20);
      }
    }
  }, []);

  const fetchPosts = async () => {
    const { data } = await (supabase as any)
      .from("baby_shower_posts_public")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data || []) as any);
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

  const handleReaction = async (postId: string, type: "congrats" | "love" | "gifted") => {
    if (!user) return;
    const existing = userReactions[postId];
    if (existing === type) {
      await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", user.id);
      setUserReactions((prev) => { const next = { ...prev }; delete next[postId]; return next; });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reactions_count: Math.max(0, p.reactions_count - 1) } : p)));
    } else if (existing) {
      await (supabase.from("reactions") as any).update({ type }).eq("post_id", postId).eq("user_id", user.id);
      setUserReactions((prev) => ({ ...prev, [postId]: type }));
    } else {
      await (supabase.from("reactions") as any).insert({ post_id: postId, user_id: user.id, type });
      setUserReactions((prev) => ({ ...prev, [postId]: type }));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reactions_count: p.reactions_count + 1 } : p)));
    }
  };

  const openGiveGift = async (post: BabyShowerPost) => {
    setGiveGiftPost(post);
    setGiftAccount(null);
    setLoadingGift(true);
    const { data, error } = await (supabase as any).rpc("get_gift_account", { _user_id: post.user_id });
    setLoadingGift(false);
    if (error) {
      toast.error("Couldn't load gift details");
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      setGiftAccount(null);
      return;
    }
    setGiftAccount({
      account_name: row.account_name,
      account_number: row.account_number,
      bank_name: row.bank_name,
    });
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
    if (!activeMonth) return;
    setSubmitting(true);
    setUploadProgress(null);
    let imageUrl: string | null = null;
    try {
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        setUploadProgress(0);
        const { publicUrl } = await uploadWithProgress({
          bucket: "baby-shower-images",
          path,
          file: imageFile,
          onProgress: (p) => setUploadProgress(p),
        });
        imageUrl = publicUrl;
      }
      const { error } = await supabase.from("baby_shower_posts").insert({
        user_id: user.id, baby_name: babyName.trim(), parent_names: parentNames.trim(),
        gender, birth_type: birthType, month_label: activeMonth, image_url: imageUrl,
      } as any);
      if (error) throw error;
      toast.success("Baby post created! 🎉");
      setShowCreateForm(false);
      setBabyName(""); setParentNames(""); setGender("boy"); setBirthType("single"); setImageFile(null); setImagePreview(null);
      await fetchPosts();
    } catch (err) { console.error(err); toast.error("Failed to create post"); }
    finally { setSubmitting(false); setUploadProgress(null); }
  };

  const handleMonthTap = (monthLabel: string, isCurrent: boolean) => {
    if (!isCurrent) {
      toast("Only the current month is open for posting and viewing", { icon: "🔒" });
      return;
    }
    setActiveMonth(monthLabel);
  };

  // Posts for the active month
  const monthPosts = posts.filter((p) => p.month_label === activeMonth);

  // ─── MONTH FEED VIEW ───
  if (activeMonth) {
    const currentMonthCard = MONTH_CARDS.find((m) => m.label === activeMonth);
    return (
      <motion.div className="space-y-4 pb-4" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveMonth(null)}
            className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--surface))" }}>
            <IonIcon name="arrow-back" size={20} style={{ color: "hsl(var(--dark))" }} />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-[22px] leading-tight truncate" style={{ color: "hsl(var(--dark))" }}>
              {activeMonth} 🎉
            </h1>
            <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              {monthPosts.length} {monthPosts.length === 1 ? "baby" : "babies"} celebrated
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreateForm(true)}
            className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--coral))" }}>
            <IonIcon name="add" size={20} style={{ color: "white" }} />
          </motion.button>
        </motion.div>

        {/* Post your baby CTA */}
        <motion.div variants={fadeUp}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowCreateForm(true)}
            className="w-full py-4 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center gap-2"
            style={{ background: "hsl(var(--light-coral))", color: "hsl(var(--coral))" }}>
            <IonIcon name="camera-outline" size={20} style={{ color: "hsl(var(--coral))" }} />
            Post Your Baby
          </motion.button>
        </motion.div>

        {/* Posts grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--coral))", borderTopColor: "transparent" }} />
          </div>
        ) : monthPosts.length === 0 ? (
          <motion.div variants={fadeUp} className="tend-card p-10 text-center">
            <div className="w-[64px] h-[64px] rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: "hsl(var(--light-coral))" }}>
              <IonIcon name="gift" size={30} style={{ color: "hsl(var(--coral))" }} />
            </div>
            <h3 className="font-serif text-[18px] mb-1" style={{ color: "hsl(var(--dark))" }}>No Babies Yet</h3>
            <p className="text-[13px] font-sans mb-4" style={{ color: "hsl(var(--text-muted))" }}>
              Be the first to celebrate your baby this month!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {monthPosts.map((post) => (
              <div key={post.id}>
                <BabyShowerCard
                  name={post.baby_name} parentName={post.parent_names} date={post.month_label}
                  imageUrl={post.image_url || "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop"}
                  gender={post.gender as "boy" | "girl" | "mixed"}
                  birthType={post.birth_type}
                  reactionsCount={post.reactions_count}
                  userReaction={userReactions[post.id] || null}
                  onReaction={(type) => handleReaction(post.id, type)}
                  isOwner={user?.id === post.user_id}
                  onGiveGift={() => openGiveGift(post)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Give a Gift Sheet — visitor sees poster's bank details (from Gift Settings) to make P2P transfer */}
        <AnimatePresence>
          {giveGiftPost && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100]" style={{ background: "rgba(0,0,0,0.5)" }}
                onClick={() => { setGiveGiftPost(null); setGiftAccount(null); }} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-6 pb-[max(env(safe-area-inset-bottom,40px),40px)] no-scrollbar"
                style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto", maxHeight: "85vh", overflowY: "auto" }}>
                <h3 className="font-serif text-[20px] mb-1" style={{ color: "hsl(var(--dark))" }}>Give a Gift 🎁</h3>
                <p className="text-[13px] font-sans mb-5" style={{ color: "hsl(var(--text-muted))" }}>
                  Send your gift directly to {giveGiftPost.parent_names} via bank transfer.
                </p>

                {loadingGift ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--coral))", borderTopColor: "transparent" }} />
                  </div>
                ) : giftAccount ? (
                  <>
                    <div className="tend-card p-5 space-y-3">
                      <div>
                        <p className="text-[10px] font-sans uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>Account Name</p>
                        <p className="text-[15px] font-semibold font-sans mt-0.5" style={{ color: "hsl(var(--dark))" }}>{giftAccount.account_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-sans uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>Account Number</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[18px] font-bold font-sans tracking-wider" style={{ color: "hsl(var(--dark))" }}>{giftAccount.account_number}</p>
                          <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => { navigator.clipboard.writeText(giftAccount.account_number || ""); toast.success("Account number copied"); }}
                            className="px-3 py-1.5 rounded-full text-[11px] font-semibold font-sans"
                            style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}>
                            Copy
                          </motion.button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-sans uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>Bank</p>
                        <p className="text-[15px] font-semibold font-sans mt-0.5" style={{ color: "hsl(var(--dark))" }}>{giftAccount.bank_name}</p>
                      </div>
                    </div>
                    <p className="text-[11px] font-sans mt-3 text-center" style={{ color: "hsl(var(--text-muted))" }}>
                      TendherMom does not process this transfer — your gift goes directly to the parent's bank account.
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={async () => {
                        const postId = giveGiftPost.id;
                        await handleReaction(postId, "gifted");
                        toast.success("Thank you for gifting 🎁");
                        setGiveGiftPost(null);
                        setGiftAccount(null);
                      }}
                      className="w-full py-[14px] mt-4 rounded-2xl text-[15px] font-semibold font-sans flex items-center justify-center gap-2"
                      style={{ background: "hsl(45 90% 50%)", color: "white" }}
                    >
                      <IonIcon name="gift" size={18} style={{ color: "white" }} />
                      I've Gifted
                    </motion.button>
                  </>
                ) : (
                  <div className="tend-card p-6 text-center">
                    <div className="w-[52px] h-[52px] rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: "hsl(var(--bg))" }}>
                      <IonIcon name="card-outline" size={24} style={{ color: "hsl(var(--text-muted))" }} />
                    </div>
                    <h4 className="font-serif text-[16px] mb-1" style={{ color: "hsl(var(--dark))" }}>Gift details not set</h4>
                    <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                      {giveGiftPost.parent_names} hasn't added their account details yet. Please check back later.
                    </p>
                  </div>
                )}

                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setGiveGiftPost(null); setGiftAccount(null); }}
                  className="w-full py-[13px] mt-2 text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--text-muted))" }}>
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
                className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-6 pb-[max(env(safe-area-inset-bottom,40px),40px)] no-scrollbar"
                style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto", maxHeight: "85vh", overflowY: "auto" }}>
                <h3 className="font-serif text-[20px] mb-5" style={{ color: "hsl(var(--dark))" }}>Celebrate Your Baby 🎉</h3>
                <div className="space-y-4">
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    {imagePreview ? (
                      <motion.div whileTap={{ scale: 0.98 }} onClick={() => !submitting && fileInputRef.current?.click()} className="relative cursor-pointer">
                        <img src={imagePreview} alt="Preview" className="w-full h-[180px] object-cover rounded-2xl" />
                        <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                          <IonIcon name="camera" size={28} style={{ color: "white" }} />
                        </div>
                        <UploadProgress progress={uploadProgress} rounded="rounded-2xl" label="Uploading photo" />
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
                    <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>Birth Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { v: "single", label: "Single" },
                        { v: "twins", label: "Twins" },
                        { v: "triplets", label: "Triplets" },
                        { v: "quadruplets", label: "Quadruplets" },
                      ] as const).map((b) => (
                        <motion.button key={b.v} whileTap={{ scale: 0.95 }} onClick={() => setBirthType(b.v)}
                          className="py-2.5 rounded-2xl text-[13px] font-semibold font-sans"
                          style={{
                            background: birthType === b.v ? "hsl(var(--light-coral))" : "hsl(var(--bg))",
                            color: birthType === b.v ? "hsl(var(--coral))" : "hsl(var(--text-muted))",
                          }}>
                          {b.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>
                      {birthType === "single" ? "Gender" : "Genders"}
                    </label>
                    <div className="flex gap-2">
                      {(birthType === "single" ? (["boy", "girl"] as const) : (["boy", "girl", "mixed"] as const)).map((g) => (
                        <motion.button key={g} whileTap={{ scale: 0.95 }} onClick={() => setGender(g)}
                          className="flex-1 py-3 rounded-2xl text-[13px] font-semibold font-sans"
                          style={{
                            background: gender === g
                              ? g === "boy" ? "hsl(214 80% 94%)" : g === "girl" ? "hsl(var(--light-coral))" : "hsl(var(--light-green))"
                              : "hsl(var(--bg))",
                            color: gender === g
                              ? g === "boy" ? "hsl(214 60% 55%)" : g === "girl" ? "hsl(var(--coral))" : "hsl(var(--green))"
                              : "hsl(var(--text-muted))",
                          }}>
                          {g === "boy" ? "👶 Boys" : g === "girl" ? "👶 Girls" : "👶 Mixed"}
                        </motion.button>
                      ))}
                    </div>
                    {birthType !== "single" && (
                      <p className="text-[11px] font-sans mt-1.5" style={{ color: "hsl(var(--text-muted))" }}>
                        Choose "Mixed" if your {birthType} include both boys and girls.
                      </p>
                    )}
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
  }

  // ─── DISCOVERY VIEW (month carousel cards) ───
  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Count posts per month
  const postsByMonth = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.month_label] = (acc[p.month_label] || 0) + 1;
    return acc;
  }, {});

  if (!isPremium) {
    return (
      <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}>
            <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--dark))" }} />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-serif text-[26px]" style={{ color: "hsl(var(--dark))" }}>Baby Shower 🎉</h1>
          </div>
        </motion.div>
        <PremiumGate
          feature="Baby Shower"
          description="Celebrate your baby's arrival, share milestones, and receive gifts from loved ones."
          onUpgrade={() => onNavigate?.("premium")}
        />
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-5 pb-4" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}>
          <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--dark))" }} />
        </motion.button>
        <div className="flex-1">
          <h1 className="font-serif text-[26px]" style={{ color: "hsl(var(--dark))" }}>Baby Shower 🎉</h1>
          <p className="text-[13px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
            Celebrate babies born each month
          </p>
        </div>
      </motion.div>

      {/* Month Carousel */}
      <motion.div variants={fadeUp} className="-mx-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--coral))", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto py-1 px-5 no-scrollbar"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {MONTH_CARDS.map((month, i) => {
              const isCurrent = month.label === currentMonthLabel;
              const count = postsByMonth[month.label] || 0;
              const imgIndex = i % MONTH_IMAGES.length;

              return (
                <motion.button
                  key={month.label}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleMonthTap(month.label, isCurrent)}
                  className="relative flex-shrink-0 rounded-[20px] overflow-hidden text-left"
                  style={{
                    width: 160,
                    aspectRatio: "3/4",
                    scrollSnapAlign: "start",
                    boxShadow: "0 4px 20px -4px rgba(0,0,0,0.15)",
                    opacity: isCurrent ? 1 : 0.55,
                    filter: isCurrent ? "none" : "grayscale(0.4)",
                  }}
                >
                  {/* Background image */}
                  <img
                    src={MONTH_IMAGES[imgIndex]}
                    alt={month.label}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: "center 30%" }}
                    loading={isCurrent ? "eager" : "lazy"}
                    decoding="async"
                    {...(!isCurrent ? { fetchpriority: "low" as any } : {})}
                  />
                  {/* Warm gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.02) 100%)" }}
                  />
                  {/* Current badge */}
                  {isCurrent && (
                    <div className="absolute top-3 right-3">
                      <span
                        className="text-[10px] font-sans font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ background: "hsl(var(--coral))", color: "white" }}
                      >
                        <IonIcon name="sparkles" size={10} style={{ color: "white" }} />
                        Open
                      </span>
                    </div>
                  )}
                  {/* Lock icon for non-current */}
                  {!isCurrent && (
                    <div className="absolute top-3 right-3">
                      <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                        <IonIcon name="lock-closed" size={12} style={{ color: "rgba(255,255,255,0.7)" }} />
                      </div>
                    </div>
                  )}
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3.5">
                    <h3 className="text-white font-serif text-[16px] leading-tight">
                      {month.label.split(" ")[0]}
                    </h3>
                    <p className="text-white/50 text-[11px] font-sans mt-0.5">
                      {month.label.split(" ")[1]}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <IonIcon name="people" size={11} style={{ color: "rgba(255,255,255,0.5)" }} />
                      <span className="text-[10px] font-sans font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {count} {count === 1 ? "baby" : "babies"}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Info card */}
      <motion.div variants={fadeUp} className="tend-card p-4">
        <div className="flex items-start gap-3">
          <div className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--light-coral))" }}>
            <IonIcon name="information-circle-outline" size={20} style={{ color: "hsl(var(--coral))" }} />
          </div>
          <div>
            <p className="text-[13px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>How it works</p>
            <p className="text-[12px] font-sans mt-0.5 leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
              Each month opens for baby celebrations. Tap the current month to view and post babies born this month. Plus members can enable gift-giving!
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BabyShowerScreen;
