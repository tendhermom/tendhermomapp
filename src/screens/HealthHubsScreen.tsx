import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { supabase } from "@/integrations/supabase/client";
import { hapticSelection } from "@/lib/despia";
import { toast } from "sonner";

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
    subs: [
      { key: "antenatal care clinic", label: "ANC", tag: "#ANC", desc: "Routine pregnancy check-ups" },
      { key: "postnatal care clinic", label: "PNC", tag: "#PNC", desc: "Care for lactating mothers" },
      { key: "obstetrics hospital c-section", label: "Obstetrics", tag: "#Comprehensive-Obstetrics", desc: "C-sections & emergency deliveries" },
      { key: "maternal mental health counselor", label: "Mental Health", tag: "#Maternal-Mental-Health", desc: "PPD counseling & support" },
    ],
  },
  {
    key: "pediatric",
    label: "Pediatric Care",
    icon: "happy-outline",
    color: "hsl(var(--green))",
    bg: "hsl(var(--light-green))",
    subs: [
      { key: "pediatrics clinic children hospital", label: "General Pediatrics", tag: "#General-Pediatrics", desc: "Common childhood illnesses" },
      { key: "neonatal ICU NICU hospital", label: "NICU", tag: "#Neonatal-ICU", desc: "Premature & sick newborns" },
      { key: "immunization vaccination center", label: "Immunization", tag: "#Immunization-Center", desc: "NPI schedule vaccines" },
      { key: "lactation consultant breastfeeding", label: "Lactation", tag: "#Lactation-Consultant", desc: "Breastfeeding support" },
    ],
  },
  {
    key: "emergency",
    label: "Emergency & Critical",
    icon: "alert-circle-outline",
    color: "hsl(14 80% 58%)",
    bg: "hsla(14, 80%, 58%, 0.1)",
    subs: [
      { key: "anti venom snake bite hospital", label: "Anti-Venom", tag: "#Anti-Venom-Unit", desc: "Snake/scorpion bite treatment" },
      { key: "blood bank hospital", label: "Blood Bank", tag: "#Blood-Bank", desc: "On-site blood storage" },
      { key: "trauma emergency room hospital", label: "Trauma ER", tag: "#Trauma-ER", desc: "Accidents & emergencies" },
      { key: "sexual gender violence response center", label: "SGBV Response", tag: "#SGBV-Response", desc: "PEP & counseling" },
    ],
  },
  {
    key: "diagnostics",
    label: "Diagnostics & Support",
    icon: "flask-outline",
    color: "hsl(210 80% 55%)",
    bg: "hsla(210, 80%, 55%, 0.1)",
    subs: [
      { key: "ultrasound imaging x-ray CT scan", label: "Imaging", tag: "#Advanced-Imaging", desc: "3D/4D Ultrasound, X-rays, CT" },
      { key: "24 hour pharmacy", label: "24/7 Pharmacy", tag: "#24-7-Pharmacy", desc: "Round-the-clock medication" },
      { key: "medical laboratory blood test", label: "Laboratory", tag: "#Laboratory-Services", desc: "Blood tests & screening" },
    ],
  },
];

const HealthHubsScreen = ({ onBack }: HealthHubsScreenProps) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].key);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Get user location
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
      (err) => {
        console.error("Geolocation error:", err);
        toast.error("Please enable location access to find nearby health centers");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const category = CATEGORIES.find((c) => c.key === activeCat)!;

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
    } catch (err: any) {
      console.error(err);
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

  const handleCatChange = (key: string) => {
    hapticSelection();
    setActiveCat(key);
    setActiveSub(null);
    setPlaces([]);
    setSearched(false);
  };

  const openDirections = (place: Place) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&destination_place_id=${place.place_id}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="ios-press">
          <IonIcon name="chevron-back" size={24} style={{ color: "hsl(var(--dark))" }} />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>Health Hubs</h1>
          <p className="text-[12px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
            {location ? "📍 Location detected" : locationLoading ? "📍 Detecting location…" : "📍 Location unavailable"}
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleCatChange(cat.key)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ios-press"
            style={{
              background: activeCat === cat.key ? cat.color : cat.bg,
              color: activeCat === cat.key ? "white" : cat.color,
            }}
          >
            <IonIcon name={cat.icon} size={14} />
            <span className="text-[11px] font-sans font-semibold whitespace-nowrap">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Sub-categories */}
      <div className="space-y-2">
        <p className="label-caps" style={{ color: "hsl(var(--text-muted))" }}>SELECT SERVICE</p>
        <div className="grid grid-cols-2 gap-2">
          {category.subs.map((sub) => (
            <motion.button
              key={sub.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSubSelect(sub.key)}
              className="tend-card p-3 text-left ios-press"
              style={{
                borderColor: activeSub === sub.key ? category.color : "transparent",
                borderWidth: 2,
              }}
            >
              <span
                className="text-[10px] font-mono font-bold block mb-1"
                style={{ color: category.color }}
              >
                {sub.tag}
              </span>
              <p className="text-[13px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                {sub.label}
              </p>
              <p className="text-[10px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                {sub.desc}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {searching && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 gap-3"
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: category.color, borderTopColor: "transparent" }}
            />
            <p className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              Searching nearby health centers…
            </p>
          </motion.div>
        )}

        {!searching && searched && places.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <IonIcon name="location-outline" size={40} style={{ color: "hsl(var(--text-muted))" }} />
            <p className="text-[14px] font-sans font-semibold mt-3" style={{ color: "hsl(var(--dark))" }}>
              No results found nearby
            </p>
            <p className="text-[12px] font-sans mt-1" style={{ color: "hsl(var(--text-muted))" }}>
              Try a different service category or expand your search area
            </p>
          </motion.div>
        )}

        {!searching && places.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="label-caps" style={{ color: "hsl(var(--text-muted))" }}>
              {places.length} CENTER{places.length !== 1 ? "S" : ""} FOUND NEAR YOU
            </p>
            {places.map((place, i) => (
              <motion.div
                key={place.place_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="tend-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{ background: category.bg }}
                  >
                    <IonIcon name="medkit" size={20} style={{ color: category.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-sans font-semibold truncate" style={{ color: "hsl(var(--dark))" }}>
                      {place.name}
                    </p>
                    <p className="text-[11px] font-sans mt-0.5 truncate" style={{ color: "hsl(var(--text-muted))" }}>
                      {place.address}
                    </p>
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
                  style={{
                    background: category.bg,
                  }}
                >
                  <IonIcon name="navigate-outline" size={16} style={{ color: category.color }} />
                  <span className="text-[12px] font-sans font-semibold" style={{ color: category.color }}>
                    Get Directions
                  </span>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HealthHubsScreen;
