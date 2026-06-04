"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Renderiza texto com links clicáveis e negrito
function renderContent(text: string) {
  // Quebra o texto em partes: [texto](url), https://..., **bold**, e texto normal
  const parts = text.split(
    /(\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|https?:\/\/[^\s]+|\*\*[^*]+\*\*)/g
  );

  return parts.map((part, i) => {
    // [texto](url)
    const mdLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\)]+)\)$/);
    if (mdLink) {
      return (
        <a
          key={i}
          href={mdLink[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--gold)", textDecoration: "underline", fontWeight: 600 }}
        >
          {mdLink[1]}
        </a>
      );
    }
    // URL pura
    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--gold)", textDecoration: "underline", fontWeight: 600 }}
        >
          {part}
        </a>
      );
    }
    // **bold**
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} style={{ color: "inherit" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    // texto normal (preserva quebras de linha)
    return part ? <span key={i}>{part}</span> : null;
  });
}

type Message = { id: string; role: "user" | "assistant"; content: string };

const PROACTIVE_DELAY_MS = 60_000;

const PROACTIVE_GREETINGS: Record<string, string> = {
  "/": "Oi! 👋 Viajando para Gramado? Me diga quantas pessoas são no grupo e te mostro o preço certo agora mesmo.",
  "/transfer/porto-alegre-gramado":
    "Oi! 👋 Já escolheu o veículo? Se tiver dúvida entre as categorias, é só me perguntar!",
  "/quem-somos":
    "Oi! 😊 Tem alguma dúvida sobre como funciona nosso transfer? Fico feliz em explicar.",
  "/checkout":
    "Vi que você está quase garantindo sua reserva! 🎉 Alguma dúvida sobre o pagamento ou a data?",
};

export function ConciergeChat() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pulse, setPulse] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const proactiveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  const handleOpen = () => {
    setHasOpened(true);
    setPulse(false);
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const text = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: "user", content: text },
    ];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const assistantContent = response.ok
        ? await response.text()
        : "Tive um problema técnico agora. Fale diretamente comigo pelo WhatsApp para não perder sua data! 🙏";

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: assistantContent },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Tive um problema técnico agora. Fale diretamente comigo pelo WhatsApp para não perder sua data! 🙏",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpen}
          aria-label="Falar com a Jolie — Concierge Digital"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 999,
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "2px solid rgba(201,168,76,0.5)",
            boxShadow: pulse
              ? "0 0 0 6px rgba(201,168,76,0.12), 0 8px 32px rgba(0,0,0,0.5)"
              : "0 8px 32px rgba(0,0,0,0.5)",
            background: "var(--bg-card)",
            cursor: "pointer",
            padding: 0,
            overflow: "hidden",
            transition: "transform 0.2s, box-shadow 0.3s",
            animation: pulse ? "pulse-ring 2s ease-in-out infinite" : "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Image
            src="/photos/team/jolie.webp"
            alt="Jolie — Concierge Digital Multi Trip"
            fill
            sizes="60px"
            className="object-cover object-top"
            priority={false}
          />
          <span
            style={{
              position: "absolute",
              bottom: "3px",
              right: "3px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "var(--green)",
              border: "2px solid var(--bg-card)",
            }}
          />
        </button>
      )}

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 999,
            width: "min(360px, calc(100vw - 32px))",
            borderRadius: "20px",
            overflow: "hidden",
            border: "1px solid var(--border-md)",
            background: "var(--bg-card)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: "rgba(0,0,0,0.4)",
              borderBottom: "1px solid var(--border)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  position: "relative",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1px solid var(--gold-line)",
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/photos/team/jolie.webp"
                  alt="Jolie"
                  fill
                  sizes="38px"
                  className="object-cover object-top"
                />
              </div>
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "var(--text)",
                    lineHeight: 1.2,
                  }}
                >
                  Jolie
                </p>
                <p style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600 }}>
                  ● Online agora
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Fechar chat"
              style={{
                color: "var(--muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "20px",
                lineHeight: 1,
                padding: "4px 6px",
                borderRadius: "6px",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--muted)")}
            >
              ×
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              minHeight: "260px",
              maxHeight: "360px",
            }}
          >
            {messages.length === 0 && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    maxWidth: "90%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "12px 16px",
                    fontSize: "13px",
                    color: "rgba(236,238,242,0.9)",
                    lineHeight: 1.6,
                  }}
                >
                  Oi! 👋 Viajando para Gramado? Me diga quantas pessoas são no grupo e te mostro o
                  preço certo agora mesmo.
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "11px 16px",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: m.role === "user" ? "var(--gold-dim)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${m.role === "user" ? "var(--gold-line)" : "var(--border)"}`,
                    color: m.role === "user" ? "var(--gold)" : "rgba(236,238,242,0.9)",
                  }}
                >
                  {renderContent(m.content)}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "14px 18px",
                    display: "flex",
                    gap: "5px",
                    alignItems: "center",
                  }}
                >
                  {[0, 0.18, 0.36].map((d, i) => (
                    <span
                      key={i}
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "var(--gold)",
                        opacity: 0.7,
                        animation: `bounce 1s ${d}s infinite`,
                        display: "inline-block",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              padding: "12px",
              background: "rgba(0,0,0,0.3)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Pergunte à Jolie..."
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border-md)",
                  borderRadius: "100px",
                  padding: "11px 48px 11px 18px",
                  fontSize: "13px",
                  color: "var(--text)",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--gold-line)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-md)")}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                aria-label="Enviar"
                style={{
                  position: "absolute",
                  right: "5px",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: inputValue.trim() ? "var(--gold)" : "rgba(255,255,255,0.06)",
                  border: "none",
                  cursor: inputValue.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                  color: inputValue.trim() ? "#05080d" : "var(--muted)",
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.3), 0 8px 32px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(201,168,76,0), 0 8px 32px rgba(0,0,0,0.5); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
