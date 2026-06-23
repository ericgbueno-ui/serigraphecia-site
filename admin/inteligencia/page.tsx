"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = [
  "Como foi esta semana?",
  "Quais leads devo priorizar hoje?",
  "Como está nossa taxa de conversão?",
  "Qual é o CPA atual?",
  "Temos leads quentes parados?",
  "Como está o faturamento do mês?",
  "Qual é nosso mês de pico historicamente?",
  "Quais campanhas trouxeram mais agendamentos?",
];

export default function InteligenciaPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function seedKnowledge() {
    if (seeding) return;
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/admin/assistente/seed-knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao semear conhecimento");
      }
      setSeedResult(
        `✅ ${data.inserted} inseridos · ${data.updated} atualizados · ${data.skipped} sem mudança` +
          (data.errors?.length ? ` · ⚠️ ${data.errors.length} erros` : "")
      );
    } catch (err: any) {
      setSeedResult(`❌ Erro: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(question: string) {
    if (!question.trim() || loading) return;

    const userMsg: Message = { role: "user", content: question };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/admin/assistente-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: messages.slice(-8), // últimas 8 mensagens como contexto
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Erro na resposta da API.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: full };
          return updated;
        });
      }
    } catch (err: any) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Erro ao conectar com a Assistente: ${err.message}`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100dvh - 0px)",
      background: "var(--bg)", color: "var(--text)",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(10,13,18,0.95)", backdropFilter: "blur(12px)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
            ← Admin
          </Link>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>🧠 Assistente Inteligência</span>
            <span style={{
              marginLeft: 10, fontSize: 10, fontWeight: 700,
              background: "rgba(201,168,76,0.12)", color: "#c9a84c",
              border: "1px solid rgba(201,168,76,0.3)",
              padding: "2px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Dados reais
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={seedKnowledge}
            disabled={seeding}
            title="Semear base de conhecimento da Assistente a partir dos arquivos ia-assistente-cerebro/"
            style={{
              fontSize: 11, color: seeding ? "var(--muted)" : "#c9a84c",
              background: "rgba(201,168,76,0.06)",
              border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8,
              padding: "5px 12px", cursor: seeding ? "not-allowed" : "pointer",
            }}
          >
            {seeding ? "⏳ Semeando…" : "🌱 Semear Conhecimento"}
          </button>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              style={{
                fontSize: 11, color: "var(--muted)", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                padding: "5px 12px", cursor: "pointer",
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Seed result banner */}
      {seedResult && (
        <div style={{
          padding: "8px 24px", fontSize: 12,
          background: seedResult.startsWith("✅") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          color: seedResult.startsWith("✅") ? "#4ade80" : "#f87171",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>{seedResult}</span>
          <button onClick={() => setSeedResult(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14 }}>×</button>
        </div>
      )}

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            {/* Boas-vindas */}
            <div style={{
              textAlign: "center", padding: "40px 20px 32px",
              background: "rgba(201,168,76,0.04)",
              border: "1px solid rgba(201,168,76,0.12)",
              borderRadius: 20, marginBottom: 32,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#c9a84c", marginBottom: 8 }}>
                Olá, Eric. Sou a Assistente.
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
                Tenho acesso aos dados reais do sistema — leads, agendamentos, faturamento e campanhas.
                Pergunte o que quiser sobre o negócio.
              </p>
            </div>

            {/* Sugestões */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 12 }}>
                Sugestões
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      textAlign: "left", padding: "12px 14px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12, fontSize: 13, color: "rgba(255,255,255,0.7)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(201,168,76,0.06)";
                      e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)";
                      e.currentTarget.style.color = "#c9a84c";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: 10, alignItems: "flex-start",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700,
                  background: msg.role === "user"
                    ? "rgba(96,165,250,0.15)"
                    : "rgba(201,168,76,0.15)",
                  color: msg.role === "user" ? "#60a5fa" : "#c9a84c",
                  border: `1px solid ${msg.role === "user" ? "rgba(96,165,250,0.25)" : "rgba(201,168,76,0.25)"}`,
                }}>
                  {msg.role === "user" ? "E" : "J"}
                </div>

                {/* Bubble */}
                <div style={{
                  maxWidth: "82%",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                  background: msg.role === "user"
                    ? "rgba(96,165,250,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${msg.role === "user" ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.07)"}`,
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: msg.role === "user" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.85)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {msg.content}
                  {loading && i === messages.length - 1 && msg.role === "assistant" && !msg.content && (
                    <span style={{ color: "#c9a84c", opacity: 0.6 }}>▌</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: "16px 24px 20px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(10,13,18,0.95)",
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-end",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "10px 12px",
            transition: "border-color 0.2s",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre leads, agendamentos, campanhas…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "var(--text)", fontSize: 13, resize: "none",
                fontFamily: "inherit", lineHeight: 1.5,
                maxHeight: 120, overflowY: "auto",
              }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 34, height: 34, borderRadius: 10, border: "none",
                background: loading || !input.trim()
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(201,168,76,0.8)",
                color: loading || !input.trim() ? "var(--muted)" : "#000",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.2s",
              }}
            >
              {loading ? "⏳" : "↑"}
            </button>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 8 }}>
            Enter para enviar · Shift+Enter para nova linha · Dados atualizados em tempo real
          </p>
        </div>
      </div>
    </div>
  );
}
