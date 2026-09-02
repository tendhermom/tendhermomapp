import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";

import { hapticHeavy, hapticWarning, hapticSuccess, screenShield, preventSleep, backgroundLocation } from "@/lib/despia";
import { Sentry } from "@/lib/sentry";
import { normalizeNgPhone, formatNgPhone, ngPhoneError } from "@/lib/phoneNg";

interface DeliveryRecord {
  contact: string;
  channel: string;
  success: boolean;
  message_id?: string;
  sender?: string;
  route?: string;
  error?: string;
}

interface DeliveryReport {
  sentAt: Date;
  deliveries: DeliveryRecord[];
}

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
  const patchUser = useAuthStore((s) => s.patchUser);
  const MAX_CONTACTS = 5;

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsReady, setGpsReady] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentInfo, setSentInfo] = useState({ count: 0, time: "" });
  const [sosError, setSosError] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [deliveryReport, setDeliveryReport] = useState<DeliveryReport | null>(null);
  // Her own number — included in the SOS text so responders know who to call.
  const [ownPhoneInput, setOwnPhoneInput] = useState("");
  const [savingOwnPhone, setSavingOwnPhone] = useState(false);
  const [ownPhoneError, setOwnPhoneError] = useState<string | null>(null);
  const missingOwnPhone = !normalizeNgPhone(user?.phone || "");

  const saveOwnPhone = async () => {
    const normalized = normalizeNgPhone(ownPhoneInput);
    if (!normalized) {
      setOwnPhoneError(ngPhoneError(ownPhoneInput) || "Enter a valid Nigerian number");
      return;
    }
    setOwnPhoneError(null);
    setSavingOwnPhone(true);
    const { error } = await supabase.from("profiles").update({ phone: normalized }).eq("id", user!.id);
    setSavingOwnPhone(false);
    if (error) {
      setOwnPhoneError("Couldn't save. Please try again.");
      return;
    }
    patchUser({ phone: normalized });
    setOwnPhoneInput("");
  };

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

  // Validate every SMS-enabled contact's number before allowing dispatch
  const invalidContacts = useCallback(
    () =>
      contacts.filter(
        (c) => (c.sms_enabled || c.whatsapp_enabled) && !normalizeNgPhone(c.phone)
      ),
    [contacts]
  );

  const handleSOSTap = useCallback(() => {
    if (contacts.length === 0) {
      setContactsError("Add at least one emergency contact below before sending an SOS.");
      hapticWarning();
      return;
    }
    const invalid = invalidContacts();
    if (invalid.length > 0) {
      const names = invalid.map((c) => c.name).join(", ");
      setContactsError(
        `Invalid phone number for ${names}. Open Manage and use the format 0801 234 5678 or +234 801 234 5678.`
      );
      hapticWarning();
      return;
    }
    setContactsError(null);
    setSosError(null);
    hapticWarning();
    setShowConfirm(true);
  }, [contacts, invalidContacts]);

  // Auto-trigger the confirm sheet when arriving from a red triage outcome.
  useEffect(() => {
    if (loading) return;
    let flag: string | null = null;
    try { flag = sessionStorage.getItem("tendher_sos_auto"); } catch {}
    if (flag !== "1") return;
    try { sessionStorage.removeItem("tendher_sos_auto"); } catch {}
    // Small delay so the screen paints first
    const t = setTimeout(() => handleSOSTap(), 250);
    return () => clearTimeout(t);
  }, [loading, handleSOSTap]);

  const handleSendSOS = async () => {
    setIsSending(true);
    setSosError(null);
    hapticHeavy();
    // Keep screen awake and track location in background during SOS
    preventSleep.enable();
    backgroundLocation.start();
    Sentry.addBreadcrumb({
      category: "sos",
      level: "warning",
      message: "dispatch-start",
      data: { contactCount: contacts.length, hasCoords: !!coords },
    });
    try {
      // Normalize every number to Termii's required 234XXXXXXXXXX format
      // before the request leaves the app.
      const contactsPayload = contacts.map((c) => ({
        name: c.name,
        phone: normalizeNgPhone(c.phone) || c.phone,
        whatsapp: normalizeNgPhone(c.whatsapp_number || c.phone) || c.whatsapp_number || c.phone,
        channels: [
          ...(c.sms_enabled ? ["sms" as const] : []),
          ...(c.whatsapp_enabled ? ["whatsapp" as const] : []),
          ...(c.email_enabled ? ["voice" as const] : []), // email_enabled repurposed for voice
        ],
      }));

      const requestSentAt = new Date();

      // Call edge function
      const { data, error } = await supabase.functions.invoke("send-sos", {
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

      if (error) {
        // Non-2xx responses carry the delivery detail — surface it so a
        // failure explains itself instead of a generic message.
        let detail = "";
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx) {
            const body = await ctx.json();
            detail = body?.detail || body?.error || "";
            if (Array.isArray(body?.deliveries) && body.deliveries.length > 0) {
              setDeliveryReport({ sentAt: requestSentAt, deliveries: body.deliveries });
            }
          }
        } catch {}
        throw new Error(detail || error.message);
      }

      if (data?.deliveries) {
        setDeliveryReport({
          sentAt: data.sent_at ? new Date(data.sent_at) : requestSentAt,
          deliveries: data.deliveries as DeliveryRecord[],
        });
      }

      // The edge function already logs this alert with the real per-channel
      // delivery result — no duplicate client-side row.



      const now = new Date();
      setSentInfo({
        count: contactsPayload.length,
        time: now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
      });
      setShowConfirm(false);
      setShowSent(true);
      hapticSuccess();
      Sentry.addBreadcrumb({ category: "sos", level: "info", message: "dispatch-success" });
    } catch (err) {
      console.error("SOS send error:", err);
      Sentry.captureException(err, {
        tags: { feature: "sos", severity: "critical" },
        extra: { contactCount: contacts.length, hasCoords: !!coords },
      });
      const reason = err instanceof Error && err.message && !err.message.startsWith("Edge Function")
        ? ` (${err.message})`
        : "";
      setSosError(`Could not send alert${reason}. Please call emergency services directly: 112`);
    } finally {
      setIsSending(false);
      preventSleep.disable();
      backgroundLocation.stop();
    }
  };

  const maxContacts = MAX_CONTACTS;
  const channelBadges = (c: EmergencyContact) => {
    const badges: string[] = [];
    if (c.sms_enabled) badges.push("SMS");
    if (c.whatsapp_enabled) badges.push("WhatsApp");
    if (c.email_enabled) badges.push("Voice");
    return badges;
  };

  // Delivery status panel — shows when the request was sent and, per
  // contact/channel, the Termii message_id (accepted) or the exact error.
  const renderDeliveryPanel = (report: DeliveryReport, compact = false) => (
    <div
      className={compact ? "w-full mb-4 rounded-2xl overflow-hidden text-left" : "tend-card overflow-hidden"}
      style={compact ? { background: "hsl(var(--background))" } : undefined}
    >
      <div
        className="px-[14px] py-[10px] flex items-center justify-between"
        style={{ background: "hsl(var(--light-green))" }}
      >
        <span className="text-[12px] font-sans font-semibold" style={{ color: "hsl(var(--green))" }}>
          Delivery Status
        </span>
        <span className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
          Sent {report.sentAt.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>
      {report.deliveries.map((d, i) => (
        <div
          key={`${d.contact}-${d.channel}-${i}`}
          className="flex items-start gap-2.5 px-[14px] py-[10px]"
          style={{ borderTop: i > 0 ? "0.5px solid hsl(var(--border))" : "none" }}
        >
          <IonIcon
            name={d.success ? "checkmark-circle" : "alert-circle"}
            size={16}
            style={{ color: d.success ? "hsl(var(--green))" : "hsl(var(--coral))", marginTop: 1 }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                {d.contact}
              </span>
              <span
                className="text-[9px] font-sans font-semibold px-1.5 py-[1px] rounded-full uppercase"
                style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
              >
                {d.channel}
              </span>
            </div>
            {d.success ? (
              <p className="text-[10px] font-sans mt-0.5 break-all" style={{ color: "hsl(var(--text-muted))" }}>
                Accepted{d.sender ? ` via ${d.sender}/${d.route}` : ""} · ID {d.message_id}
              </p>
            ) : (
              <p className="text-[10px] font-sans mt-0.5" style={{ color: "hsl(var(--coral))" }}>
                Failed — {d.error || "unknown error"}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

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

      {/* Missing emergency phone — responders need a number to call back */}
      {!loading && missingOwnPhone && (
        <div className="tend-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--light-coral))" }}
            >
              <IonIcon name="call-outline" size={18} style={{ color: "hsl(var(--coral))" }} />
            </div>
            <div>
              <p className="text-[14px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>
                Add your Emergency Phone
              </p>
              <p className="text-[12.5px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
                Your SOS message asks responders to call you on this number.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              value={ownPhoneInput}
              onChange={(e) => setOwnPhoneInput(e.target.value)}
              placeholder="+234XXXXXXXXXX"
              aria-label="Your emergency phone number"
              className="flex-1 px-4 py-3 rounded-2xl text-[14px] font-sans border-none outline-none"
              style={{ background: "hsl(var(--bg))", color: "hsl(var(--dark))" }}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={saveOwnPhone}
              disabled={savingOwnPhone}
              className="px-4 rounded-2xl text-[14px] font-sans font-semibold text-white disabled:opacity-60"
              style={{ background: "hsl(var(--green))" }}
            >
              {savingOwnPhone ? "Saving…" : "Save"}
            </motion.button>
          </div>
          {ownPhoneError && (
            <p className="text-[12px] font-sans" style={{ color: "hsl(var(--coral))" }}>{ownPhoneError}</p>
          )}
        </div>
      )}

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

        {/* Inline contact-required notice */}
        <AnimatePresence>
          {contactsError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-4 mx-4 px-4 py-3 rounded-2xl flex items-start gap-2.5"
              style={{ background: "hsl(var(--light-coral))" }}
            >
              <IonIcon name="alert-circle" size={18} style={{ color: "hsl(var(--coral))", marginTop: 1 }} />
              <p className="text-[13px] font-sans leading-relaxed flex-1" style={{ color: "hsl(var(--dark))" }}>
                {contactsError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Last Alert — delivery status panel */}
      {deliveryReport && !showSent && (
        <div>
          <h2 className="font-serif text-[20px] mb-3" style={{ color: "hsl(var(--dark))" }}>
            Last Alert
          </h2>
          {renderDeliveryPanel(deliveryReport)}
        </div>
      )}

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

      <MedicalDisclaimer />

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
               className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-8 pb-[max(env(safe-area-inset-bottom,40px),40px)]"
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
                {sosError && (
                  <div
                    className="w-full mb-3 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-left"
                    style={{ background: "hsl(var(--light-coral))" }}
                  >
                    <IonIcon name="alert-circle" size={18} style={{ color: "hsl(var(--coral))", marginTop: 1 }} />
                    <p className="text-[13px] font-sans leading-relaxed flex-1" style={{ color: "hsl(var(--dark))" }}>
                      {sosError}
                    </p>
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSendSOS}
                  disabled={isSending}
                  className="w-full py-[15px] rounded-2xl text-white text-[16px] font-semibold font-sans mb-3 disabled:opacity-60"
                  style={{ background: "hsl(var(--coral))" }}
                >
                  {isSending ? "Sending…" : sosError ? "Try Again" : "Send SOS Now"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowConfirm(false); setSosError(null); }}
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
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] px-6 pt-8 pb-[max(env(safe-area-inset-bottom,40px),40px)]"
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
                <p className="text-[14px] font-sans mb-4" style={{ color: "hsl(var(--text-muted))" }}>
                  Sent to {sentInfo.count} contact{sentInfo.count !== 1 ? "s" : ""} at {sentInfo.time} via SMS
                  {contacts.some((c) => c.whatsapp_enabled) ? ", WhatsApp" : ""}
                  {contacts.some((c) => c.email_enabled) ? " and Voice Call" : ""}.
                </p>
                {deliveryReport && renderDeliveryPanel(deliveryReport, true)}
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
