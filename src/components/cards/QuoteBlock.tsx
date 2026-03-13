const QuoteBlock = ({ quote }: { quote: string }) => {
  return (
    <div className="bg-primary rounded-xl p-5">
      <p className="text-primary-foreground font-semibold text-base leading-relaxed">
        "{quote}"
      </p>
    </div>
  );
};

export default QuoteBlock;
