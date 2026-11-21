import { useState, useRef, useEffect } from "react";
import { Booking, Provider } from "../types";

export interface AiChatbotProps {
  providers: Provider[];
  bookings: Booking[];
  bottomOffsetClass?: string;
  onJumpToProvider: (providerId: string, dateKey?: string, time?: string) => void;
  onNavigate?: (view: "explore" | "providers" | "my-bookings" | "admin") => void;
}

export interface ChatSource {
  id: string;
  title: string;
  category: string;
  sourceType: string;
  excerpt: string;
}

export interface ChatRecommendation {
  providerId: string;
  providerName: string;
  serviceId?: string;
  serviceName?: string;
  dateKey?: string;
  time?: string;
  price?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  recommendation?: ChatRecommendation;
  error?: boolean;
  timestamp?: string;
}

const SUGGESTED_QUESTIONS = [
  "How can I book an appointment?",
  "Which service providers are available?",
  "How do I cancel my appointment?",
  "What are your booking policies?",
];

const STORAGE_KEY = "slotwise_ai_chat_session_v2";

export function AiChatbot({
  providers,
  bookings,
  bottomOffsetClass = "bottom-20 md:bottom-8",
  onJumpToProvider,
  onNavigate,
}: AiChatbotProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);

  // Initialize messages from session storage or default welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage parse errors
    }
    return [
      {
        id: "welcome-msg",
        role: "assistant",
        text: "Hi! I'm your AI booking assistant. How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-save chat history to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage errors
    }
  }, [messages]);

  // Auto-scroll to bottom when messages update or panel opens
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  // Auto focus input when opened on desktop
  useEffect(() => {
    if (open && window.innerWidth >= 768) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Clear chat option
  const handleClearChat = () => {
    const welcome: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: "assistant",
      text: "Hi! I'm your AI booking assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcome]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Send user message through RAG pipeline
  const sendMessage = async (textToSend?: string) => {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Prepare compact live context
      const compactProviders = providers.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        startingPriceDisplay: p.startingPriceDisplay,
        priceTier: p.priceTier,
        rating: p.rating,
        location: p.location,
        services: p.services.map((s) => ({
          id: s.id,
          name: s.name,
          priceLabel: s.priceLabel,
          duration: s.duration,
        })),
        slotsByDate: p.slotsByDate,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          context: {
            providers: compactProviders,
            bookings: bookings.map((b) => ({
              id: b.id,
              confirmationCode: b.confirmationCode,
              providerName: b.providerName,
              serviceName: b.serviceName,
              dateLabel: b.dateLabel,
              time: b.time,
              status: b.status,
            })),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            text: data.error || "Sorry, I encountered an issue retrieving that. Please try again.",
            error: true,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          text: data.answer || "Here is what I found for you.",
          sources: Array.isArray(data.sources) ? data.sources : [],
          recommendation: data.recommendation,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: "Network error connecting to AI booking assistant. Please check your connection and try again.",
          error: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Chatbot Button (Bottom Right) */}
      <aside className={`fixed right-4 md:right-8 ${bottomOffsetClass} z-40 pb-safe`}>
        <button
          aria-label="Open AI Booking Assistant"
          onClick={() => setOpen((prev) => !prev)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary shadow-[0_20px_25px_-5px_rgba(79,70,229,0.4),0_8px_10px_-6px_rgba(15,23,42,0.2)] hover:scale-105 active:scale-95 transition-all focus:outline-none"
          type="button"
        >
          <span className="material-symbols-outlined text-[28px] transition-transform group-hover:rotate-12">
            smart_toy
          </span>
          {/* Active status pulse badge */}
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary-container ring-2 ring-surface border border-secondary" />
          </span>
        </button>
      </aside>

      {/* Chatbot Floating / Drawer Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end md:p-6 bg-on-surface/40 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="w-full md:w-[440px] h-[85vh] md:h-[620px] max-h-[90vh] bg-surface-container-lowest rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/30">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-lowest/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-[22px] text-on-primary">
                    smart_toy
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-label-lg font-bold leading-tight tracking-tight">
                      SlotWise AI Assistant
                    </h2>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-on-secondary">
                      RAG Active
                    </span>
                  </div>
                  <p className="text-label-sm text-on-primary/80 text-[11px]">
                    Live knowledge base &amp; appointment booking
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Clear conversation"
                  aria-label="Clear chat"
                  onClick={handleClearChat}
                  className="w-8 h-8 rounded-lg hover:bg-surface-container-lowest/20 flex items-center justify-center transition-colors text-on-primary/90"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                </button>
                <button
                  type="button"
                  title="Close assistant"
                  aria-label="Close AI Assistant"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-surface-container-lowest/20 flex items-center justify-center transition-colors text-on-primary/90"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface text-on-surface"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-end gap-2 max-w-[88%]">
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mb-1">
                        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-3 text-body-md shadow-xs ${
                        m.role === "user"
                          ? "bg-primary text-on-primary rounded-br-xs"
                          : m.error
                            ? "bg-error-container text-on-error-container rounded-bl-xs"
                            : "bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-bl-xs"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-line text-sm md:text-base">
                        {m.text}
                      </p>

                      {/* Interactive 1-Tap Action Recommendation */}
                      {m.recommendation && (
                        <div className="mt-3 pt-2.5 border-t border-outline-variant/30 space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              onJumpToProvider(
                                m.recommendation!.providerId,
                                m.recommendation!.dateKey,
                                m.recommendation!.time
                              );
                              setOpen(false);
                            }}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-all shadow-sm"
                          >
                            <span className="truncate">
                              Book {m.recommendation.providerName}
                              {m.recommendation.time ? ` (${m.recommendation.time})` : ""}
                            </span>
                            <span className="material-symbols-outlined text-[18px]">
                              calendar_month
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Grounded RAG Sources & Attribution */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-outline-variant/20">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant mb-1.5">
                            <span className="material-symbols-outlined text-[13px] text-primary">
                              menu_book
                            </span>
                            <span>Verified Sources:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {m.sources.map((src, idx) => (
                              <button
                                key={`${src.id}-${idx}`}
                                type="button"
                                onClick={() =>
                                  setActiveSourceId((prev) => (prev === src.id ? null : src.id))
                                }
                                className={`text-[11px] px-2 py-0.5 rounded-md transition-colors text-left font-medium ${
                                  activeSourceId === src.id
                                    ? "bg-primary text-on-primary"
                                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                                }`}
                              >
                                {src.title.length > 25 ? `${src.title.slice(0, 23)}...` : src.title}
                              </button>
                            ))}
                          </div>

                          {/* Expanded Source Excerpt */}
                          {activeSourceId && (
                            <div className="mt-2 p-2 rounded-lg bg-surface-container text-[11px] text-on-surface-variant border border-outline-variant/30 animate-fade-in">
                              <p className="font-semibold text-primary mb-0.5">
                                {m.sources.find((s) => s.id === activeSourceId)?.title}
                              </p>
                              <p className="leading-tight">
                                {m.sources.find((s) => s.id === activeSourceId)?.excerpt}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Timestamp */}
                  {m.timestamp && (
                    <span className="text-[10px] text-on-surface-variant px-1 mt-1 tabular-nums">
                      {m.timestamp}
                    </span>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex items-center gap-2 text-on-surface-variant text-body-sm px-2 animate-pulse">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px] animate-spin">
                      progress_activity
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl px-3.5 py-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <span
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                    <span className="ml-2 text-xs font-medium text-on-surface-variant">
                      Retrieving knowledge &amp; checking live slots...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Questions Ribbon */}
            <div className="px-3 py-2 bg-surface-container-low border-t border-outline-variant/20 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={loading}
                  onClick={() => sendMessage(q)}
                  className="shrink-0 px-3 py-1 rounded-full bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary text-label-sm font-semibold border border-outline-variant/30 shadow-2xs transition-colors whitespace-nowrap text-xs"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Message Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center gap-2 pb-safe shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask e.g. 'Can I reschedule my appointment?'"
                disabled={loading}
                className="flex-1 h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-body-md placeholder:text-outline border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-all text-sm md:text-base"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center disabled:opacity-40 active:scale-95 hover:bg-primary-container transition-all shrink-0 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
