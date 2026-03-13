import { motion } from "framer-motion";
import { Phone, AlertTriangle, Heart } from "lucide-react";

const emergencyContacts = [
  { name: "Emergency Services", number: "112", description: "National emergency line" },
  { name: "My OB-GYN", number: "+234 801 234 5678", description: "Dr. Adaeze Nwosu" },
  { name: "Husband / Partner", number: "+234 803 456 7890", description: "Chidi Okafor" },
  { name: "Nearest Hospital", number: "+234 1 234 5678", description: "Lagos University Teaching Hospital" },
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
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={32} className="text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Emergency Help
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Call for help immediately if you need it
        </p>
      </div>

      <div className="space-y-3">
        {emergencyContacts.map((contact, i) => (
          <motion.a
            key={i}
            href={`tel:${contact.number.replace(/\s/g, "")}`}
            whileTap={{ scale: 0.95 }}
            className="bg-card rounded-xl card-shadow p-4 flex items-center gap-3 block"
          >
            <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <Phone size={18} className="text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">
                {contact.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {contact.description}
              </p>
            </div>
            <span className="text-xs font-medium text-accent">Call Now</span>
          </motion.a>
        ))}
      </div>

      <div className="bg-accent/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Warning Signs to Watch For
          </h3>
        </div>
        <ul className="space-y-2">
          {warningSignsList.map((sign, i) => (
            <li
              key={i}
              className="text-sm text-muted-foreground flex items-start gap-2"
            >
              <span className="text-accent mt-0.5">•</span>
              {sign}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SOSScreen;
