import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

interface ReferralScreenProps {
  onBack: () => void;
}

const REFERRAL_TARGET = 10;

const ReferralScreen = ({ onBack }: ReferralScreenProps) => {
  const referralsMade = 3; // TODO: pull from store/db
  const remaining = REFERRAL_TARGET - referralsMade;
  const progress = (referralsMade / REFERRAL_TARGET) * 100;

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center ios-press"
          style={{ background: "hsl(var(--light-green))" }}
        >
          <IonIcon name="chevron-back" size={20} style={{ color: "hsl(var(--green))" }} />
        </motion.button>
        <div>
          <h1 className="font-serif text-dark" style={{ fontSize: "26px" }}>Free Antenatal</h1>
          <p className="text-text-muted text-[13px] font-sans">Refer friends, earn free care</p>
        </div>
      </div>

      {/* Progress hero */}
      <div className="hero-card p-6">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative w-[120px] h-[120px] mb-4">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="hsl(var(--coral))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white text-[28px] font-bold font-sans">{referralsMade}</span>
              <span className="text-white/50 text-[11px] font-sans">of {REFERRAL_TARGET}</span>
            </div>
          </div>
          <h3 className="text-white text-[18px] font-serif">
            {remaining > 0 ? `${remaining} more to go!` : "🎉 You did it!"}
          </h3>
          <p className="text-white/50 text-[13px] font-sans mt-1">
            {remaining > 0
              ? "Refer friends to unlock free antenatal care"
              : "Claim your free antenatal care below"}
          </p>
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="font-serif text-dark text-[20px] mb-3">How It Works</h2>
        <div className="tend-card overflow-hidden">
          {[
            { step: "1", text: "Share your referral link with friends", icon: "share-social-outline" },
            { step: "2", text: "They sign up and start using TendHer", icon: "person-add-outline" },
            { step: "3", text: `Complete ${REFERRAL_TARGET} referrals for free antenatal`, icon: "gift-outline" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 px-[18px] py-[15px]"
              style={{ borderBottom: i < 2 ? "0.5px solid hsl(var(--border))" : "none" }}
            >
              <div
                className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--light-green))" }}
              >
                <IonIcon name={item.icon} size={18} style={{ color: "hsl(var(--green))" }} />
              </div>
              <span className="text-dark text-[14px] font-sans flex-1">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        className="w-full py-[16px] rounded-2xl text-[15px] font-bold font-sans flex items-center justify-center gap-2"
        style={{ background: "hsl(var(--green))", color: "white" }}
      >
        <IonIcon name="share-social" size={20} style={{ color: "white" }} />
        Share Referral Link
      </motion.button>
    </div>
  );
};

export default ReferralScreen;
