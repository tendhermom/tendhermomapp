import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import IonIcon from "@/components/IonIcon";
import { useAuthStore } from "@/stores/authStore";

interface AIChatScreenProps {
  onBack: () => void;
}

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    onError(err.error || "Something went wrong");
    return;
  }

  if (!resp.body) {
    onError("No response body");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

const SUGGESTIONS = [
  "What should I eat this trimester?",
  "Is it safe to exercise?",
  "Common symptoms in my stage",
  "When should I go to the hospital?",
];

const AIChatScreen = ({ onBack }: AIChatScreenProps) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: allMessages,
      onDelta: upsert,
      onDone: () => setIsLoading(false),
      onError: (msg) => {
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
        setIsLoading(false);
      },
    });
  };

  const displayName = user?.full_name?.split(" ")[0] || "Mama";

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)", marginTop: "-56px", marginLeft: "-20px", marginRight: "-20px" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
        style={{ background: "hsl(var(--green))", paddingTop: "56px" }}
      >
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="w-[36px] h-[36px] rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
          <IonIcon name="chevron-back" size={20} style={{ color: "white" }} />
        </motion.button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            <IonIcon name="chatbox-ellipses" size={20} style={{ color: "white" }} />
          </div>
          <div>
            <h1 className="text-white text-[17px] font-semibold font-sans">TendHerBot</h1>
            <p className="text-white/60 text-[11px] font-sans">AI Health Assistant</p>
          </div>
        </div>
        <div className="px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
          <span className="text-[10px] font-bold font-sans text-white/80 flex items-center gap-1">
            <IonIcon name="diamond" size={10} style={{ color: "hsl(var(--coral))" }} /> Premium
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "hsl(var(--bg))" }}>
        {messages.length === 0 && (
          <div className="text-center pt-8 pb-4">
            <div className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--light-coral))" }}>
              <IonIcon name="chatbox-ellipses" size={28} style={{ color: "hsl(var(--coral))" }} />
            </div>
            <h2 className="font-serif text-[22px]" style={{ color: "hsl(var(--dark))" }}>Hi, {displayName}! 💕</h2>
            <p className="text-[13px] font-sans mt-1 max-w-[260px] mx-auto" style={{ color: "hsl(var(--text-muted))" }}>
              I'm TendHerBot, your pregnancy companion. Ask me anything about your journey!
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              {SUGGESTIONS.map((s) => (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => send(s)}
                  className="px-3.5 py-2 rounded-2xl text-[12px] font-sans font-medium"
                  style={{ background: "hsl(var(--surface))", color: "hsl(var(--dark))", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] font-sans leading-relaxed ${
                  msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"
                }`}
                style={
                  msg.role === "user"
                    ? { background: "hsl(var(--green))", color: "white" }
                    : { background: "hsl(var(--surface))", color: "hsl(var(--dark))", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }
                }
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5" style={{ background: "hsl(var(--surface))" }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: "hsl(var(--text-muted))" }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 flex gap-2" style={{ background: "hsl(var(--surface))", borderTop: "0.5px solid hsl(var(--border))" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask TendHerBot..."
          className="flex-1 bg-transparent text-[15px] font-sans outline-none placeholder:text-[hsl(var(--text-muted))]"
          style={{ color: "hsl(var(--dark))" }}
          disabled={isLoading}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => send(input)}
          disabled={!input.trim() || isLoading}
          className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: input.trim() ? "hsl(var(--green))" : "hsl(var(--border))",
            transition: "background 0.2s",
          }}
        >
          <IonIcon name="send" size={18} style={{ color: "white" }} />
        </motion.button>
      </div>
    </div>
  );
};

export default AIChatScreen;
