import IonIcon from "@/components/IonIcon";

const QuoteBlock = ({ quote }: { quote: string }) => {
  return (
    <div className="hero-card p-5">
      <div className="relative z-10 flex gap-3">
        <div className="flex-shrink-0 mt-1">
          <IonIcon name="chatbubble-ellipses" size={22} style={{ color: "rgba(255,255,255,0.3)" }} />
        </div>
        <p className="text-[15px] font-semibold leading-relaxed text-white font-sans">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
};

export default QuoteBlock;