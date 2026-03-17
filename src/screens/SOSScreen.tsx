import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hapticHeavy, hapticWarning, hapticSuccess, screenShield, preventSleep, backgroundLocation } from "@/lib/despia";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  whatsapp_number: string | null;
  email: string | null;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  is_primary: boolean;
}

interface SOSScreenProps {
  onNavigate?: (screen: string) => void;
}

const SOSScreen = ({ onNavigate }: SOSScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const isFree = user?.plan_type === "free";

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsReady, setGpsReady] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentInfo, setSentInfo] = useState({ count: 0, time: "" });

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false });
      if (data) setContacts(data as EmergencyContact[]);
      setLoading(false);
    };
    fetchContacts();
  }, [user]);

  // Screen Shield — prevent screenshots on SOS screen
  useEffect(() => {
    screenShield.enable();
    return () => { screenShield.disable(); };
  }, []);

  // GPS capture on mount
  useEffect(() => {
    setGpsLoading(true);
    const timeout = setTimeout(() => {
      if (!gpsReady) {
        setGpsLoading(false);
      }
    }, 5000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsReady(true);
          setGpsLoading(false);
        },
        () => {
          setGpsReady(false);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGpsLoading(false);
    }

    return () => clearTimeout(timeout);
  }, []);

  const handleSOSTap = useCallback(() => {
    if (contacts.length === 0) {
      toast.error("Add at least one emergency contact first");
      return;
    }
    hapticWarning();
    setShowConfirm(true);
  }, [contacts]);

  const handleSendSOS = async () => {
    setIsSending(true);
    hapticHeavy();
    // Keep screen awake and track location in background during SOS
    preventSleep.enable();
    backgroundLocation.start();
    try {
    const contactsPayload = contacts.map((c) => ({
        name: c.name,
        phone: c.phone,
        whatsapp: c.whatsapp_number || c.phone,
        channels: [
          ...(c.sms_enabled ? ["sms" as const] : []),
          ...(c.whatsapp_enabled ? ["whatsapp" as const] : []),
          ...(c.email_enabled ? ["voice" as const] : []), // email_enabled repurposed for voice
        ],
      }));

      // Call edge function
      const { error } = await supabase.functions.invoke("send-sos", {
        body: {
          user_id: user?.id,
          user_name: user?.full_name,
          user_phone: user?.phone,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null,
          contacts: contactsPayload,
          is_test: false,
        },
      });

      if (error) throw error;

      // Log the alert
      await supabase.from("emergency_alerts").insert({
        user_id: user!.id,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        contacts_notified: contactsPayload.length,
        channel_success: {},
        is_test: false,
      });

      const now = new Date();
      setSentInfo({
        count: contactsPayload.length,
        time: now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
      });
      setShowConfirm(false);
      setShowSent(true);
      hapticSuccess();
    } catch (err) {
      console.error("SOS send error:", err);
      toast.error("Failed to send alert. Please call emergency services directly: 112");
    } finally {
      setIsSending(false);
      preventSleep.disable();
      backgroundLocation.stop();
    }
  };

  const maxContacts = isFree ? 1 : 5;
  const channelBadges = (c: EmergencyContact) => {
    const badges: string[] = [];
    if (c.sms_enabled) badges.push("SMS");
    if (c.whatsapp_enabled) badges.push("WhatsApp");
    if (c.email_enabled) badges.push("Voice");
    return badges;
  };

  return (
    <div className="space-y-6 pb-4 pt-1">
      {/* Header — Apple large-title style */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="flex items-center gap-3 pt-1"
      >
        <div
          className="w-[44px] h-[44px] rounded-2xl flex items-center justify-center"
          style={{ background: "hsl(var(--light-coral))" }}
        >
          <IonIcon name="warning" size={22} style={{ color: "hsl(var(--coral))" }} />
        </div>
        <div>
          <h1 className="font-serif text-[30px] leading-tight tracking-[-0.01em]" style={{ color: "hsl(var(--dark))" }}>
            Emergency
          </h1>
        </div>
      </motion.div>

      {/* SOS Button Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.1 }}
        className="flex flex-col items-center py-4"
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-[190px] h-[190px] rounded-full flex items-center justify-center"
          style={{ background: "hsla(11, 74%, 63%, 0.12)" }}
        >
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSOSTap}
            className="w-[160px] h-[160px] rounded-full flex flex-col items-center justify-center"
            style={{
              background: "radial-gradient(circle at 40% 35%, hsl(11, 74%, 68%), hsl(11, 74%, 55%))",
              boxShadow: "0 8px 32px rgba(232,115,90,0.45)",
            }}
          >
            <span className="text-white font-sans font-bold" style={{ fontSize: "38px", letterSpacing: "2px" }}>
              SOS
            </span>
            <span className="text-white/70 text-[13px] font-sans mt-0.5">Tap for help</span>
          </motion.button>
        </motion.div>

        {/* Status chips */}
        <div className="flex items-center gap-3 mt-5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "hsl(var(--surface))", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <span
              className="w-[7px] h-[7px] rounded-full"
              style={{ background: gpsReady ? "hsl(var(--green))" : gpsLoading ? "hsl(var(--coral))" : "hsl(var(--muted))" }}
            />
            <span className="text-[12px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>
              {gpsLoading ? "Getting location…" : gpsReady ? "Location ready" : "Location unavailable"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "hsl(var(--surface))", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <IonIcon name="people" size={14} style={{ color: "hsl(var(--green))" }} />
            <span className="text-[12px] font-sans font-medium" style={{ color: "hsl(var(--dark))" }}>
              {contacts.length} of {maxContacts} contacts
            </span>
          </div>
        </div>
      </motion.div>

      {/* Emergency Contacts Card */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-[20px]" style={{ color: "hsl(var(--dark))" }}>
            Emergency Contacts
          </h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate?.("emergency-contacts")}
            className="text-[13px] font-semibold font-sans"
            style={{ color: "hsl(var(--green))" }}
          >
            Manage
          </motion.button>
        </div>

        <div className="tend-card overflow-hidden">
          {loading ? (
            <div className="px-[18px] py-5 text-center">
              <span className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Loading contacts…</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="px-[18px] py-6 text-center">
              <IonIcon name="person-add" size={28} style={{ color: "hsl(var(--border))" }} />
              <p className="text-[13px] font-sans mt-2" style={{ color: "hsl(var(--text-muted))" }}>
                No emergency contacts yet
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate?.("emergency-contacts")}
                className="mt-3 px-4 py-2 rounded-full text-[13px] font-semibold font-sans text-white"
                style={{ background: "hsl(var(--green))" }}
              >
                Add Contact
              </motion.button>
            </div>
          ) : (
            <>
              {contacts.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-[18px] py-[14px]"
                  style={{ borderBottom: i < contacts.length - 1 ? "0.5px solid hsl(var(--border))" : "none" }}
                >
                  <div
                    className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--light-green))" }}
                  >
                    <span className="text-[14px] font-bold font-sans" style={{ color: "hsl(var(--green))" }}>
                      {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
                      {c.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                        {c.relationship || "Contact"}
                      </span>
                      {channelBadges(c).map((b) => (
                        <span
                          key={b}
                          className="text-[9px] font-sans font-semibold px-1.5 py-[1px] rounded-full"
                          style={{
                            background: "hsl(var(--light-green))",
                            color: "hsl(var(--green))",
                          }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                  <motion.a
                    whileTap={{ scale: 0.9 }}
                    href={`tel:${c.phone.replace(/\s/g, "")}`}
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--light-green))" }}
                  >
                    <IonIcon name="call" size={16} style={{ color: "hsl(var(--green))" }} />
                  </motion.a>
                </div>
              ))}

              {/* Locked slots for free users */}
              {isFree && contacts.length >= 1 && (
                <div
                  className="flex items-center gap-3 px-[18px] py-[14px]"
                  style={{ borderTop: "0.5px solid hsl(var(--border))", opacity: 0.5 }}
                >
                  <div
                    className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--border))" }}
                  >
                    <IonIcon name="lock-closed" size={16} style={{ color: "hsl(var(--text-muted))" }} />
                  </div>
                  <span className="text-[13px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                    Add up to 4 more with Premium
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* How SOS Works */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-serif text-[20px] mb-3" style={{ color: "hsl(var(--dark))" }}>
          How SOS Works
        </h2>
        <div className="tend-card overflow-hidden">
          {[
            { icon: "finger-print", title: "Tap the SOS button", desc: "Press the button above when you need immediate help" },
            { icon: "location", title: "We capture your location", desc: "Your GPS coordinates are shared with your contacts" },
            { icon: "notifications", title: "Contacts are alerted", desc: "SMS, WhatsApp & voice calls sent simultaneously" },
          ].map((step, i, arr) => (
            <div
              key={i}
              className="flex items-center gap-3.5 px-[18px] py-[16px]"
              style={{ borderBottom: i < arr.length - 1 ? "0.5px solid hsl(var(--border))" : "none" }}
            >
              <div
                className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--light-green))" }}
              >
                <IonIcon name={step.icon} size={18} style={{ color: "hsl(var(--green))" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-semibold font-sans" style={{ color: "hsl(var(--dark))" }}>
                  {step.title}
                </h4>
                <p className="text-[12px] font-sans mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                  {step.desc}
                </p>
              </div>
              <span className="text-[13px] font-bold font-sans flex-shrink-0" style={{ color: "hsl(var(--border))" }}>
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Confirm Bottom Sheet */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => !isSending && setShowConfirm(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-8 pb-10"
              style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto" }}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-[68px] h-[68px] rounded-full flex items-center justify-center mb-4"
                  style={{ background: "hsl(var(--light-coral))" }}
                >
                  <IonIcon name="warning" size={34} style={{ color: "hsl(var(--coral))" }} />
                </div>
                <h3 className="font-serif text-[22px] mb-2" style={{ color: "hsl(var(--dark))" }}>
                  Send Emergency Alert?
                </h3>
                <p className="text-[14px] font-sans mb-6" style={{ color: "hsl(var(--text-muted))" }}>
                  This will send your GPS location and an emergency message to {contacts.length} contact{contacts.length !== 1 ? "s" : ""} via SMS
                  {contacts.some((c) => c.whatsapp_enabled) ? ", WhatsApp" : ""}
                  {contacts.some((c) => c.email_enabled) ? " and Voice Call" : ""}.
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSendSOS}
                  disabled={isSending}
                  className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans mb-3 disabled:opacity-60"
                  style={{ background: "hsl(var(--coral))" }}
                >
                  {isSending ? "Sending…" : "Send SOS Now"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowConfirm(false)}
                  disabled={isSending}
                  className="w-full py-[13px] rounded-2xl text-[15px] font-semibold font-sans"
                  style={{ color: "hsl(var(--text-muted))" }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sent Confirmation Sheet */}
      <AnimatePresence>
        {showSent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(0,0,0,0.5)" }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-8 pb-10"
              style={{ background: "hsl(var(--surface))", maxWidth: 430, margin: "0 auto" }}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-[68px] h-[68px] rounded-full flex items-center justify-center mb-4"
                  style={{ background: "hsl(var(--light-green))" }}
                >
                  <IonIcon name="checkmark-circle" size={38} style={{ color: "hsl(var(--green))" }} />
                </div>
                <h3 className="font-serif text-[22px] mb-2" style={{ color: "hsl(var(--dark))" }}>
                  Alert Sent!
                </h3>
                <p className="text-[14px] font-sans mb-6" style={{ color: "hsl(var(--text-muted))" }}>
                  Sent to {sentInfo.count} contact{sentInfo.count !== 1 ? "s" : ""} at {sentInfo.time} via SMS
                  {contacts.some((c) => c.whatsapp_enabled) ? ", WhatsApp" : ""}
                  {contacts.some((c) => c.email_enabled) ? " and Voice Call" : ""}.
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowSent(false)}
                  className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans"
                  style={{ background: "hsl(var(--green))" }}
                >
                  OK, I'm Safe
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SOSScreen;
