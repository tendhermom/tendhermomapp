import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";

const emergencyContacts = [
  { name: "Emergency Services", number: "112", description: "National emergency line", icon: "shield" },
  { name: "My OB-GYN", number: "+234 801 234 5678", description: "Dr. Adaeze Nwosu", icon: "medkit" },
  { name: "Husband / Partner", number: "+234 803 456 7890", description: "Chidi Okafor", icon: "heart" },
  { name: "Nearest Hospital", number: "+234 1 234 5678", description: "Lagos University Teaching Hospital", icon: "business" },
];

const warningSignsList = [
  "Heavy vaginal bleeding",
  "Severe headache or blurred vision",
  "Sudden swelling of face or hands",
  "Baby not moving as usual",
  "Severe abdominal pain",
  "High fever (above 38°C)",
];

const SOSScreen = () => {
  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="text-center pt-4">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-[80px] h-[80px] rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: "hsl(var(--light-coral))",
          }}
        >
          <IonIcon name="pulse" size={40} style={{ color: "hsl(var(--coral))" }} />
        </motion.div>
        <h1 className="font-serif text-dark" style={{ fontSize: "28px" }}>
          Emergency Help
        </h1>
        <p className="text-text-muted text-[14px] font-sans mt-1">
          Tap to call for help immediately
        </p>
      </div>

      {/* Emergency contacts */}
      <div className="space-y-3">
        {emergencyContacts.map((contact, i) => (
          <motion.a
            key={i}
            href={`tel:${contact.number.replace(/\s/g, "")}`}
            whileTap={{ scale: 0.97 }}
            className="tend-card p-[18px] flex items-center gap-3.5 cursor-pointer block"
          >
            <div
              className="w-[46px] h-[46px] rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(var(--coral))" }}
            >
              <IonIcon name={contact.icon} size={22} style={{ color: "white" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-dark text-[15px] font-semibold font-sans">{contact.name}</h4>
              <p className="text-text-muted text-[12px] font-sans mt-0.5">{contact.description}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[13px] font-bold font-sans" style={{ color: "hsl(var(--coral))" }}>Call</span>
              <IonIcon name="call" size={16} style={{ color: "hsl(var(--coral))" }} />
            </div>
          </motion.a>
        ))}
      </div>

      {/* Warning signs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <IonIcon name="alert-circle" size={20} style={{ color: "hsl(var(--coral))" }} />
          <h2 className="font-serif text-dark text-[20px]">Warning Signs</h2>
        </div>
        <div className="tend-card overflow-hidden">
          {warningSignsList.map((sign, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-[18px] py-[14px]"
              style={{ borderBottom: i < warningSignsList.length - 1 ? "0.5px solid hsl(var(--border))" : "none" }}
            >
              <span
                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{ background: "hsl(var(--coral))" }}
              />
              <span className="text-dark text-[14px] font-sans">{sign}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SOSScreen;