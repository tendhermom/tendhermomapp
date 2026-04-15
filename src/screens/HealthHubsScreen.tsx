import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { hapticSelection } from "@/lib/despia";
import { toast } from "sonner";

// Category images
import imgMaternal from "@/assets/hubs/maternal.jpg";
import imgPediatric from "@/assets/hubs/pediatric.jpg";
import imgEmergency from "@/assets/hubs/emergency.jpg";
import imgDiagnostics from "@/assets/hubs/diagnostics.jpg";

// Service images — Maternal
import imgAnc from "@/assets/hubs/anc.jpg";
import imgPnc from "@/assets/hubs/pnc.jpg";
import imgObstetrics from "@/assets/hubs/obstetrics.jpg";
import imgMentalHealth from "@/assets/hubs/mental_health.jpg";

// Service images — Pediatric
import imgGeneralPediatrics from "@/assets/hubs/general_pediatrics.jpg";
import imgNicu from "@/assets/hubs/nicu.jpg";
import imgImmunization from "@/assets/hubs/immunization.jpg";
import imgLactation from "@/assets/hubs/lactation.jpg";

// Service images — Emergency
import imgAntivenom from "@/assets/hubs/antivenom.jpg";
import imgBloodBank from "@/assets/hubs/blood_bank.jpg";
import imgTraumaEr from "@/assets/hubs/trauma_er.jpg";
import imgSgbv from "@/assets/hubs/sgbv.jpg";

// Service images — Diagnostics
import imgImaging from "@/assets/hubs/imaging.jpg";
import imgPharmacy from "@/assets/hubs/pharmacy.jpg";
import imgLaboratory from "@/assets/hubs/laboratory.jpg";

interface HealthHubsScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

interface Place {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  total_ratings: number;
  open_now: boolean | null;
  types: string[];
  photo_ref: string | null;
}

const CATEGORIES = [
  {
    key: "maternal",
    label: "Maternal Health",
    icon: "female-outline",
    color: "hsl(var(--coral))",
    bg: "hsl(var(--light-coral))",
    image: imgMaternal,
    subs: [
      { key: "antenatal care clinic", label: "ANC", desc: "Routine pregnancy check-ups", image: imgAnc },
      { key: "postnatal care clinic", label: "PNC", desc: "Care for lactating mothers", image: imgPnc },
      { key: "obstetrics hospital c-section", label: "Obstetrics", desc: "C-sections & emergency deliveries", image: imgObstetrics },
      { key: "maternal mental health counselor", label: "Mental Health", desc: "PPD counseling & support", image: imgMentalHealth },
    ],
  },
  {
    key: "pediatric",
    label: "Pediatric Care",
    icon: "happy-outline",
    color: "hsl(var(--green))",
    bg: "hsl(var(--light-green))",
    image: imgPediatric,
    subs: [
      { key: "pediatrics clinic children hospital", label: "General Pediatrics", desc: "Common childhood illnesses", image: imgGeneralPediatrics },
      { key: "neonatal ICU NICU hospital", label: "NICU", desc: "Premature & sick newborns", image: imgNicu },
      { key: "immunization vaccination center", label: "Immunization", desc: "NPI schedule vaccines", image: imgImmunization },
      { key: "lactation consultant breastfeeding", label: "Lactation", desc: "Breastfeeding support", image: imgLactation },
    ],
  },
  {
    key: "emergency",
    label: "Emergency & Critical",
    icon: "alert-circle-outline",
    color: "hsl(14 80% 58%)",
    bg: "hsla(14, 80%, 58%, 0.1)",
    image: imgEmergency,
    subs: [
      { key: "anti venom snake bite hospital", label: "Anti-Venom", desc: "Snake/scorpion bite treatment", image: imgAntivenom },
      { key: "blood bank hospital", label: "Blood Bank", desc: "On-site blood storage", image: imgBloodBank },
      { key: "trauma emergency room hospital", label: "Trauma ER", desc: "Accidents & emergencies", image: imgTraumaEr },
      { key: "sexual gender violence response center", label: "SGBV Response", desc: "PEP & counseling", image: imgSgbv },
    ],
  },
  {
    key: "diagnostics",
    label: "Diagnostics & Support",
    icon: "flask-outline",
    color: "hsl(210 80% 55%)",
    bg: "hsla(210, 80%, 55%, 0.1)",
    image: imgDiagnostics,
    subs: [
      { key: "ultrasound imaging x-ray CT scan", label: "Imaging", desc: "3D/4D Ultrasound, X-rays, CT", image: imgImaging },
      { key: "24 hour pharmacy", label: "24/7 Pharmacy", desc: "Round-the-clock medication", image: imgPharmacy },
      { key: "medical laboratory blood test", label: "Laboratory", desc: "Blood tests & screening", image: imgLaboratory },
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const HealthHubsScreen = ({ onBack }: HealthHubsScreenProps) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => {
        toast.error("Please enable location access to find nearby health centers");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const searchPlaces = useCallback(async (keyword: string) => {
    if (!location) {
      toast.error("Location not available");
      return;
    }
    setSearching(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("health-hubs", {
        body: { latitude: location.lat, longitude: location.lng, keyword, radius: 10000 },
      });
      if (error) throw error;
      setPlaces(data?.results || []);
    } catch {
      toast.error("Failed to search health centers");
    } finally {
      setSearching(false);
    }
  }, [location]);

  const handleSubSelect = (subKey: string) => {
    hapticSelection();
    setActiveSub(subKey);
    searchPlaces(subKey);
  };

  const openDirections = (place: Place) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&destination_place_id=${place.place_id}`, "_blank");
  };

  const category = selectedCat ? CATEGORIES.find((c) => c.key === selectedCat) : null;

  // ========================
  // CATEGORY CAROUSEL (HOME)
  // ========================
  if (!selectedCat) {
    return (
      <motion.div className="space-y-6 pb-4 pt-1" initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <button onClick={onBack} className="ios-press -ml-1">
            <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--dark))" }} />
          </button>
          <div className="flex-1">
            <h1 className="font-serif text-[26px] leading-tight tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>
              Health Hubs
            </h1>
            <p className="text-[12px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
              {location ? "📍 Location detected" : locationLoading ? "📍 Detecting location…" : "📍 Location unavailable"}
            </p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04, type: "spring", stiffness: 300, damping: 28 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { hapticSelection(); setSelectedCat(cat.key); }}
              className="relative rounded-[18px] overflow-hidden text-left ios-press"
              style={{ aspectRatio: "3/4", boxShadow: "0 4px 20px -4px hsla(0,0%,0%,0.12)" }}
            >
              <img src={cat.image} alt={cat.label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, hsla(0,0%,0%,0.7) 0%, hsla(0,0%,0%,0.25) 50%, hsla(0,0%,0%,0.05) 100%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <h3 className="text-white text-[14px] font-semibold font-sans leading-tight">{cat.label}</h3>
                <p className="text-white/60 text-[11px] font-sans mt-0.5">{cat.subs.length} services</p>
              </div>
              <div className="absolute top-3 right-3 w-[28px] h-[28px] rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                <IonIcon name="chevron-forward" size={14} style={{ color: "white" }} />
              </div>
            </motion.button>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="flex items-start gap-2.5 pt-1">
          <IonIcon name="location" size={14} style={{ color: "hsl(var(--green))" }} />
          <p className="text-[10px] font-sans leading-relaxed" style={{ color: "hsl(var(--text-muted))" }}>
            Health Hubs uses your location to find nearby facilities using Google Maps. Your location data is not stored.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  // ========================
  // CATEGORY DETAIL (SERVICES AS CAROUSEL CARDS)
  // ========================
  return (
    <motion.div className="space-y-5 pb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Banner with image */}
      <div className="relative rounded-[20px] overflow-hidden" style={{ marginTop: 4 }}>
        <img src={category!.image} alt={category!.label} className="w-full h-[160px] object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, hsla(0,0%,0%,0.65) 0%, hsla(0,0%,0%,0.2) 60%, hsla(0,0%,0%,0.1) 100%)" }} />
        <div className="absolute top-3 left-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setSelectedCat(null); setActiveSub(null); setPlaces([]); setSearched(false); }}
            className="flex items-center gap-0.5 ios-press px-2 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
          >
            <IonIcon name="chevron-back" size={18} style={{ color: "white" }} />
            <span className="text-[13px] font-sans font-medium text-white">Back</span>
          </motion.button>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="font-serif text-[26px] text-white leading-tight">{category!.label}</h1>
          <p className="text-white/60 text-[12px] font-sans mt-1">{category!.subs.length} services available</p>
        </div>
      </div>

      {/* Services as image-backed carousel cards — 2-column grid */}
      <div className="space-y-2">
        <p className="label-caps" style={{ color: "hsl(var(--text-muted))" }}>SELECT SERVICE</p>
        <div className="grid grid-cols-2 gap-3">
          {category!.subs.map((sub, i) => (
            <motion.button
              key={sub.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04, type: "spring", stiffness: 300, damping: 28 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSubSelect(sub.key)}
              className="relative rounded-[18px] overflow-hidden text-left ios-press"
              style={{
                aspectRatio: "3/4",
                boxShadow: activeSub === sub.key
                  ? `0 4px 20px -4px ${category!.color}40, 0 0 0 2px ${category!.color}`
                  : "0 4px 20px -4px hsla(0,0%,0%,0.12)",
              }}
            >
              <img
                src={sub.image}
                alt={sub.label}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(0deg, hsla(0,0%,0%,0.72) 0%, hsla(0,0%,0%,0.3) 50%, hsla(0,0%,0%,0.08) 100%)",
                }}
              />
              {/* Selected indicator */}
              {activeSub === sub.key && (
                <div
                  className="absolute top-3 right-3 w-[26px] h-[26px] rounded-full flex items-center justify-center"
                  style={{ background: category!.color }}
                >
                  <IonIcon name="checkmark" size={14} style={{ color: "white" }} />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <h3 className="text-white text-[14px] font-semibold font-sans leading-tight">
                  {sub.label}
                </h3>
                <p className="text-white/60 text-[10px] font-sans mt-0.5 leading-snug">
                  {sub.desc}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {searching && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: category!.color, borderTopColor: "transparent" }} />
            <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Searching nearby health centers…</p>
          </motion.div>
        )}

        {!searching && searched && places.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <IonIcon name="location-outline" size={40} style={{ color: "hsl(var(--text-muted))" }} />
            <p className="text-[14px] font-sans font-semibold mt-3" style={{ color: "hsl(var(--dark))" }}>No results found nearby</p>
            <p className="text-[12px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>Try a different service category</p>
          </motion.div>
        )}

        {!searching && places.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <p className="label-caps" style={{ color: "hsl(var(--text-muted))" }}>{places.length} CENTER{places.length !== 1 ? "S" : ""} FOUND NEAR YOU</p>
            {places.map((place, i) => (
              <motion.div
                key={place.place_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="tend-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: category!.bg }}>
                    <IonIcon name="medkit" size={20} style={{ color: category!.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-sans font-semibold truncate" style={{ color: "hsl(var(--dark))" }}>{place.name}</p>
                    <p className="text-[11px] font-sans mt-0.5 truncate" style={{ color: "hsl(var(--text-muted))" }}>{place.address}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {place.rating && (
                        <span className="flex items-center gap-0.5 text-[11px] font-sans font-medium" style={{ color: "hsl(45 93% 45%)" }}>
                          <IonIcon name="star" size={12} /> {place.rating} ({place.total_ratings})
                        </span>
                      )}
                      {place.open_now !== null && (
                        <span
                          className="text-[10px] font-sans font-bold uppercase px-2 py-0.5 rounded-full"
                          style={{
                            background: place.open_now ? "hsla(153, 42%, 30%, 0.1)" : "hsla(0, 70%, 50%, 0.1)",
                            color: place.open_now ? "hsl(var(--green))" : "hsl(0 70% 50%)",
                          }}
                        >
                          {place.open_now ? "Open" : "Closed"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openDirections(place)}
                  className="w-full mt-3 py-2.5 rounded-xl flex items-center justify-center gap-2 ios-press"
                  style={{ background: category!.bg }}
                >
                  <IonIcon name="navigate-outline" size={16} style={{ color: category!.color }} />
                  <span className="text-[12px] font-sans font-semibold" style={{ color: category!.color }}>Get Directions</span>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HealthHubsScreen;
