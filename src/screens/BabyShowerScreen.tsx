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
  gift_enabled: boolean;
  gift_total: number;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
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

  // P2P Give-a-Gift sheet (visitor sees owner's bank account details)
  const [giveGiftPost, setGiveGiftPost] = useState<BabyShowerPost | null>(null);
  // Owner — add/edit bank account details sheet
  const [editAccountPost, setEditAccountPost] = useState<BabyShowerPost | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

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
    // Public list uses the safe view (no bank fields). Owner-side bank editing
    // still queries baby_shower_posts directly via RLS-scoped owner SELECT.
    const { data: publicData } = await (supabase as any)
      .from("baby_shower_posts_public")
      .select("*")
      .order("created_at", { ascending: false });

    let merged: any[] = publicData || [];

    // If signed in, fetch the user's own rows (with bank fields) and merge.
    if (user) {
      const { data: ownData } = await supabase
        .from("baby_shower_posts")
        .select("*")
        .eq("user_id", user.id);
      if (ownData?.length) {
        const ownMap = new Map(ownData.map((p: any) => [p.id, p]));
        merged = merged.map((p: any) => ownMap.get(p.id) || p);
      }
    }

    setPosts(merged as any);
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

  const handleSaveAccount = async () => {
    if (!user || !editAccountPost) return;
    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
      toast.error("Please fill in account name, number and bank");
      return;
    }
    setSavingAccount(true);
    const { error } = await supabase
      .from("baby_shower_posts")
      .update({
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
        bank_name: bankName.trim(),
        gift_enabled: true,
      } as any)
      .eq("id", editAccountPost.id)
      .eq("user_id", user.id);
    setSavingAccount(false);
    if (error) {
      toast.error("Failed to save account details");
      return;
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === editAccountPost.id
          ? { ...p, account_name: accountName.trim(), account_number: accountNumber.trim(), bank_name: bankName.trim(), gift_enabled: true }
          : p
      )
    );
    toast.success("Account details saved — friends can now Give a Gift 🎁");
    setEditAccountPost(null);
    setAccountName(""); setAccountNumber(""); setBankName("");
  };

  const openAddAccount = (post: BabyShowerPost) => {
    setEditAccountPost(post);
    setAccountName(post.account_name || user?.full_name || "");
    setAccountNumber(post.account_number || "");
    setBankName(post.bank_name || "");
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
          <motion.div className="grid grid-cols-2 gap-3" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
            {monthPosts.map((post) => (
              <motion.div key={post.id} variants={fadeUp}>
                <BabyShowerCard
                  name={post.baby_name} parentName={post.parent_names} date={post.month_label}
                  imageUrl={post.image_url || "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop"}
                  gender={post.gender as "boy" | "girl" | "mixed"}
                  birthType={post.birth_type}
                  reactionsCount={post.reactions_count}
                  userReaction={userReactions[post.id] || null}
                  onReaction={(type) => handleReaction(post.id, type)}
                  giftEnabled={post.gift_enabled}
                  hasAccountDetails={!!(post.account_name && post.account_number && post.bank_name)}
                  isPremium={isPremium}
                  isOwner={user?.id === post.user_id}
                  onAddAccountDetails={() => openAddAccount(post)}
                  onGiveGift={() => setGiveGiftPost(post)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Give a Gift Sheet — visitor sees owner's bank details to make P2P transfer */}
        <AnimatePresence>
          {giveGiftPost && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100]" style={{ background: "rgba(0,0,0,0.5)" }}
                onClick={() => setGiveGiftPost(null)} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-6 pb-[max(env(safe-area-inset-bottom,40px),40px)] no-scrollbar"
                style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto", maxHeight: "85vh", overflowY: "auto" }}>
                <h3 className="font-serif text-[20px] mb-1" style={{ color: "hsl(var(--dark))" }}>Give a Gift 🎁</h3>
                <p className="text-[13px] font-sans mb-5" style={{ color: "hsl(var(--text-muted))" }}>
                  Send your gift directly to {giveGiftPost.parent_names} via bank transfer.
                </p>
                <div className="tend-card p-5 space-y-3">
                  <div>
                    <p className="text-[10px] font-sans uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>Account Name</p>
                    <p className="text-[15px] font-semibold font-sans mt-0.5" style={{ color: "hsl(var(--dark))" }}>{giveGiftPost.account_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-sans uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>Account Number</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[18px] font-bold font-sans tracking-wider" style={{ color: "hsl(var(--dark))" }}>{giveGiftPost.account_number}</p>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => { navigator.clipboard.writeText(giveGiftPost.account_number || ""); toast.success("Account number copied"); }}
                        className="px-3 py-1.5 rounded-full text-[11px] font-semibold font-sans"
                        style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}>
                        Copy
                      </motion.button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-sans uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>Bank</p>
                    <p className="text-[15px] font-semibold font-sans mt-0.5" style={{ color: "hsl(var(--dark))" }}>{giveGiftPost.bank_name}</p>
                  </div>
                </div>
                <p className="text-[11px] font-sans mt-3 text-center" style={{ color: "hsl(var(--text-muted))" }}>
                  TendherMom does not process this transfer — your gift goes directly to the parent's bank account.
                </p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setGiveGiftPost(null)}
                  className="w-full py-[13px] mt-3 text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                  Close
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Owner — Add bank account details */}
        <AnimatePresence>
          {editAccountPost && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100]" style={{ background: "rgba(0,0,0,0.5)" }}
                onClick={() => !savingAccount && setEditAccountPost(null)} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-6 pb-[max(env(safe-area-inset-bottom,40px),40px)] no-scrollbar"
                style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto", maxHeight: "85vh", overflowY: "auto" }}>
                <h3 className="font-serif text-[20px] mb-1" style={{ color: "hsl(var(--dark))" }}>Enable "Give a Gift"</h3>
                <p className="text-[13px] font-sans mb-5" style={{ color: "hsl(var(--text-muted))" }}>
                  Add your bank account so friends & family can send P2P gifts directly to you.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>Account Name</label>
                    <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. Ngozi Okafor"
                      className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
                      style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>Account Number</label>
                    <input type="text" inputMode="numeric" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))} placeholder="10-digit account number" maxLength={10}
                      className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
                      style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold font-sans mb-1.5 block" style={{ color: "hsl(var(--dark))" }}>Bank Name</label>
                    <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. GTBank"
                      className="w-full px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
                      style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }} />
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveAccount} disabled={savingAccount}
                    className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans disabled:opacity-60"
                    style={{ background: "hsl(var(--green))" }}>
                    {savingAccount ? "Saving…" : "Save & Enable Gifts"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEditAccountPost(null)} disabled={savingAccount}
                    className="w-full py-[13px] text-[15px] font-semibold font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                    Cancel
                  </motion.button>
                </div>
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
                    loading="lazy"
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
