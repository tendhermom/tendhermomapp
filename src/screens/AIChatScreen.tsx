import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { Sentry } from "@/lib/sentry";
import InlineStatus, { type InlineStatusMsg } from "@/components/InlineStatus";

interface AIChatScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WEEKLY_LIMIT_FREE = 2;
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const AIChatScreen = ({ onBack, onNavigate }: AIChatScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan_type === "premium";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [errorStatus, setErrorStatus] = useState<InlineStatusMsg | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canAsk = isPremium || weeklyCount < WEEKLY_LIMIT_FREE;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !canAsk) return;

    setErrorStatus(null);
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    Sentry.addBreadcrumb({
      category: "ai-chat",
      level: "info",
      message: "send",
      data: { messageCount: newMessages.length, isPremium },
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`ai-chat HTTP ${resp.status}`);
      }

      // Stream SSE response
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
              );
            }
          } catch { /* partial chunk */ }
        }
      }

      if (!isPremium) setWeeklyCount((c) => c + 1);
    } catch (e) {
      Sentry.captureException(e, { tags: { feature: "ai-chat" } });
      setErrorStatus({
        kind: "error",
        text: "Couldn't reach the assistant. Check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 80px - var(--safe-area-bottom, 0px) - var(--safe-area-top, 0px) - 56px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={onBack} className="ios-press">
          <IonIcon name="arrow-back" size={22} style={{ color: "hsl(var(--dark))" }} />
        </button>
        <div className="flex-1">
          <h1 className="text-[20px] font-serif" style={{ color: "hsl(var(--dark))" }}>AI Health Assistant</h1>
        </div>
        {!isPremium && (
          <span className="text-[10px] font-sans font-semibold px-2 py-1 rounded-full"
            style={{ background: "hsl(var(--light-coral))", color: "hsl(var(--coral))" }}>
            {WEEKLY_LIMIT_FREE - weeklyCount} left
          </span>
        )}
      </div>

      {/* Disclaimer */}
      <MedicalDisclaimer variant="card" className="mb-3" />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 hide-scrollbar pb-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "hsl(var(--light-green))" }}>
              <IonIcon name="chatbubble-ellipses-outline" size={28} style={{ color: "hsl(var(--green))" }} />
            </div>
            <h3 className="text-[16px] font-serif mb-1" style={{ color: "hsl(var(--dark))" }}>Ask me anything</h3>
            <p className="text-[12px] font-sans max-w-[240px]" style={{ color: "hsl(var(--text-muted))" }}>
              Get guidance on pregnancy symptoms, nutrition, exercise, and more.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center px-4">
              {["Is morning sickness normal?", "Safe exercises during pregnancy", "What foods should I avoid?"].map((q) => (
                <button key={q} onClick={() => { setInput(q); }} className="text-[11px] font-sans px-3 py-1.5 rounded-full ios-press"
                  style={{ background: "hsl(var(--surface))", color: "hsl(var(--green))", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] rounded-[16px] px-4 py-2.5"
              style={{
                background: msg.role === "user" ? "hsl(var(--green))" : "hsl(var(--surface))",
                color: msg.role === "user" ? "white" : "hsl(var(--dark))",
                boxShadow: msg.role === "assistant" ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <p className="text-[13px] font-sans leading-[1.6] whitespace-pre-wrap">{msg.content || "..."}</p>
            </div>
          </motion.div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="rounded-[16px] px-4 py-3 flex gap-1" style={{ background: "hsl(var(--surface))" }}>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "hsl(var(--green))", animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "hsl(var(--green))", animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "hsl(var(--green))", animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Upgrade banner when limit reached */}
      {!canAsk && !isPremium && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[14px] px-4 py-3 flex items-center gap-3 mb-1"
          style={{ background: "hsl(var(--light-green))" }}>
          <IonIcon name="diamond-outline" size={18} style={{ color: "hsl(var(--green))" }} />
          <div className="flex-1">
            <p className="text-[12px] font-sans font-semibold" style={{ color: "hsl(var(--dark))" }}>Weekly limit reached</p>
            <p className="text-[10px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>Upgrade to Plus for unlimited AI conversations</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => onNavigate?.("premium")}
            className="px-3 py-1.5 rounded-full text-[11px] font-sans font-semibold"
            style={{ background: "hsl(var(--green))", color: "white" }}>
            Upgrade
          </motion.button>
        </motion.div>
      )}

      {/* Inline error */}
      <InlineStatus status={errorStatus} spacing="mb-1" />

      {/* Input */}
      <div className="flex items-end gap-2 pt-2" style={{ borderTop: "1px solid hsl(var(--border-subtle))" }}>
        <div className="flex-1 rounded-[14px] px-4 py-2.5" style={{ background: "hsl(var(--surface))", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={canAsk ? "Ask about your pregnancy..." : "Weekly limit reached"}
            disabled={!canAsk}
            rows={1}
            className="w-full text-[14px] font-sans resize-none outline-none bg-transparent"
            style={{ color: "hsl(var(--dark))", maxHeight: 80 }}
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!input.trim() || isLoading || !canAsk}
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center ios-press flex-shrink-0"
          style={{
            background: input.trim() && canAsk ? "hsl(var(--green))" : "hsl(var(--border-subtle))",
            transition: "background 0.2s",
          }}
        >
          <IonIcon name="send" size={18} style={{ color: input.trim() && canAsk ? "white" : "hsl(var(--text-muted))" }} />
        </motion.button>
      </div>
    </div>
  );
};

export default AIChatScreen;
