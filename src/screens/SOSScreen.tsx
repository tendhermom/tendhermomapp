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
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: "hsla(11, 74%, 63%, 0.1)",
          }}
        >
          <IonIcon name="warning" size={36} style={{ color: "hsl(var(--coral))" }} />
        </motion.div>
        <h1 className="ios-large-title text-foreground" style={{ fontSize: "28px" }}>
          Emergency Help
        </h1>
        <p className="ios-footnote text-muted-foreground mt-1">
          Tap to call for help immediately
        </p>
      </div>

      {/* Emergency contacts - iOS grouped list style */}
      <div className="ios-grouped">
        {emergencyContacts.map((contact, i) => (
          <motion.a
            key={i}
            href={`tel:${contact.number.replace(/\s/g, "")}`}
            whileTap={{ scale: 0.98 }}
            className="ios-grouped-item flex items-center gap-3 cursor-pointer"
          >
            <div
              className="w-[42px] h-[42px] rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(var(--coral))" }}
            >
              <IonIcon name={contact.icon} size={20} style={{ color: "white" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="ios-body font-semibold text-foreground">{contact.name}</h4>
              <p className="ios-caption text-muted-foreground">{contact.description}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="ios-footnote font-semibold" style={{ color: "hsl(var(--coral))" }}>Call</span>
              <IonIcon name="call" size={16} style={{ color: "hsl(var(--coral))" }} />
            </div>
          </motion.a>
        ))}
      </div>

      {/* Warning signs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <IonIcon name="alert-circle" size={18} style={{ color: "hsl(var(--coral))" }} />
          <h3 className="ios-title text-foreground">Warning Signs</h3>
        </div>
        <div className="ios-grouped">
          {warningSignsList.map((sign, i) => (
            <div key={i} className="ios-grouped-item flex items-center gap-3">
              <span
                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{ background: "hsl(var(--coral))" }}
              />
              <span className="ios-body text-foreground">{sign}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SOSScreen;
