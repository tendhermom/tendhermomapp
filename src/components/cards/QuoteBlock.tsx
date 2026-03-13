import IonIcon from "@/components/IonIcon";

const QuoteBlock = ({ quote }: { quote: string }) => {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(153, 42%, 30%), hsl(153, 42%, 24%))",
      }}
    >
      <div className="absolute top-3 right-4 opacity-20">
        <IonIcon name="chatbubble-ellipses" size={32} style={{ color: "white" }} />
      </div>
      <p className="text-[16px] font-semibold leading-relaxed relative z-10" style={{ color: "white" }}>
        "{quote}"
      </p>
    </div>
  );
};

export default QuoteBlock;
