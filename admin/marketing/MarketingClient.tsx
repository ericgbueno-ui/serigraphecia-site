"use client";

import { useState, useEffect, useCallback } from "react";

// ── Templates Meta aprovados ───────────────────────────────────────────────

const META_TEMPLATES = [
  {
    id: "negocio_lembrete_pre_atendimento",
    label: "🗓️ Lembrete Pré-Atendimento",
    categoria: "Utilidade",
    preview: `Olá, [Nome]! 🤎 Aqui é a Assistente da [NOME DO NEGÓCIO].\n\nSua atendimento está chegando! Lembre-se de confirmar seus dados e ter o contato do seu profissional em mãos.\n\nQualquer dúvida, estou aqui. Boa atendimento! ✈️`,
    hasVar: true,
  },
  {
    id: "negocio_avaliacao_google",
    label: "⭐ Avaliação Google",
    categoria: "Marketing",
    preview: `Olá, [Nome]! 🤎 Aqui é a Assistente da [NOME DO NEGÓCIO].\n\nEspero que sua atendimento tenha sido incrível! Sua opinião nos ajuda muito a continuar evoluindo.\n\nDeixe sua avaliação aqui (leva menos de 1 minuto):\n👉 https://g.page/r/CflNFvOwC_7vEAE/review\n\nMuito obrigada! 🙏`,
    hasVar: true,
  },
  {
    id: "negocio_reativacao_cliente",
    label: "🔄 Reativação de Cliente",
    categoria: "Marketing",
    preview: `Olá, [Nome]! 🤎 Aqui é a Assistente da [NOME DO NEGÓCIO].\n\nSentimos sua falta! Está planejando uma nova atendimento para sua cidade ou sua região?\n\nTemos datas disponíveis e adoraríamos cuidar de tudo pra você novamente. 🍷✨\n\nMe chama aqui e te passo um orçamento exclusivo!`,
    hasVar: true,
  },
  {
    id: "negocio_recuperacao_lead",
    label: "💬 Recuperação de Lead",
    categoria: "Marketing",
    preview: `Olá! 🤎 Aqui é a Assistente da [NOME DO NEGÓCIO].\n\nVi que você consultou sobre atendimento para a sua região mas ainda não finalizou.\n\nPosso te ajudar a planejar sua atendimento com segurança e conforto. Qual é a data que você tem em mente?\n\n👉 https://seudominio.com.br`,
    hasVar: false,
  },
];

// ── Templates texto livre ──────────────────────────────────────────────────

const FREE_TEMPLATES = [
  {
    id: "lembrete_pre_atendimento",
    label: "🗓️ Lembrete Pré-Atendimento",
    text: `Olá! 🤎 Aqui é a Assistente da [NOME DO NEGÓCIO].\n\nSua atendimento está chegando! Lembre-se de confirmar seus dados e ter o contato do seu profissional em mãos.\n\nQualquer dúvida, estou aqui. Boa atendimento! ✈️`,
  },
  {
    id: "avaliacao_google",
    label: "⭐ Avaliação Google",
    text: `Olá! 🤎 Aqui é a Assistente da [NOME DO NEGÓCIO].\n\nEspero que sua atendimento tenha sido incrível! Sua opinião nos ajuda muito a continuar evoluindo.\n\nDeixe sua avaliação aqui (leva menos de 1 minuto):\n👉 https://g.page/r/CflNFvOwC_7vEAE/review\n\nMuito obrigada! 🙏`,
  },
  {
    id: "reativacao_cliente",
    label: "🔄 Reativação de Cliente",
    text: `Olá! 🤎 Aqui é a Assistente da [NOME DO NEGÓCIO].\n\nSentimos sua falta! Está planejando uma nova atendimento para sua cidade ou sua região?\n\nTemos datas disponíveis e adoraríamos cuidar de tudo pra você novamente. 🍷✨\n\nMe chama aqui e te passo um orçamento exclusivo!`,
  },
  {
    id: "recuperacao_lead",
    label: "💬 Recuperação de Lead",
    text: `Olá! 🤎 Aqui é a Assistente da [NOME DO NEGÓCIO].\n\nVi que você consultou sobre atendimento para a sua região mas ainda não finalizou.\n\nPosso te ajudar a planejar sua atendimento com segurança e conforto. Qual é a data que você tem em mente?\n\n👉 https://seudominio.com.br`,
  },
  {
    id: "personalizada",
    label: "✏️ Mensagem personalizada",
    text: "",
  },
];

type AudienceType = "clientes" | "leads" | "ambos" | "manual";

type SendResult = {
  total: number;
  sent: number;
  failed: number;
  firstError?: string;
  errors: { num: string; msg: string }[] | string[];
};

export default function MarketingClient() {
  const [useMetaTemplate, setUseMetaTemplate] = useState(true);

  // Template Meta
  const [selectedMeta, setSelectedMeta] = useState(META_TEMPLATES[0].id);

  // Texto livre
  const [selectedFree, setSelectedFree] = useState(FREE_TEMPLATES[0].id);
  const [message, setMessage] = useState(FREE_TEMPLATES[0].text);

  const [audience, setAudience] = useState<AudienceType>("clientes");
  const [manualPhones, setManualPhones] = useState("");
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const fetchCount = useCallback(async (a: AudienceType) => {
    if (a === "manual") {
      setAudienceCount(null);
      return;
    }
    setLoadingCount(true);
    try {
      const res = await fetch(`/api/admin/marketing/audience-count?audience=${a}`);
      const data = await res.json();
      setAudienceCount(data.count ?? 0);
    } catch {
      setAudienceCount(null);
    } finally {
      setLoadingCount(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => fetchCount(audience));
  }, [audience, fetchCount]);

  const manualCount = manualPhones
    .split(/[\n,;]+/)
    .map((p) => p.replace(/\D/g, ""))
    .filter((p) => p.length >= 10).length;

  const recipientCount = audience === "manual" ? manualCount : (audienceCount ?? 0);

  const currentMetaTemplate = META_TEMPLATES.find((t) => t.id === selectedMeta)!;

  async function handleSend() {
    if (!confirmed) {
      setError("Confirme antes de enviar.");
      return;
    }
    if (recipientCount === 0) {
      setError("Nenhum destinatário selecionado.");
      return;
    }
    if (!useMetaTemplate && !message.trim()) {
      setError("Escreva a mensagem antes de enviar.");
      return;
    }

    setSending(true);
    setError(null);
    setResult(null);

    try {
      const phones =
        audience === "manual"
          ? manualPhones
              .split(/[\n,;]+/)
              .map((p) => p.replace(/\D/g, ""))
              .filter((p) => p.length >= 10)
          : undefined;

      const payload = useMetaTemplate
        ? { audience, phones, message: "", useTemplate: true, templateName: selectedMeta }
        : { audience, phones, message, useTemplate: false };

      const res = await fetch("/api/admin/marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro ao enviar.");
      else {
        setResult(data as SendResult);
        setConfirmed(false);
      }
    } catch {
      setError("Falha de comunicação com o servidor.");
    } finally {
      setSending(false);
    }
  }

  // ── Estilos ────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    fontSize: "13px",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: "var(--muted)",
    marginBottom: "8px",
    display: "block",
  };
  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
  };
  const chipActive: React.CSSProperties = {
    padding: "7px 16px",
    borderRadius: "20px",
    border: "1.5px solid var(--gold)",
    background: "rgba(180,140,60,0.12)",
    color: "var(--gold)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };
  const chipInactive: React.CSSProperties = {
    padding: "7px 16px",
    borderRadius: "20px",
    border: "1.5px solid var(--border)",
    background: "transparent",
    color: "var(--muted)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: "860px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "var(--muted)",
            marginBottom: "6px",
          }}
        >
          Admin · Marketing
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)" }}>
          📣 WhatsApp em Massa
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
          Envie mensagens para clientes, leads ou uma lista manual via Meta API oficial.
        </p>
      </div>

      {/* Aviso */}
      <div
        style={{
          background: "rgba(255,193,7,0.08)",
          border: "1px solid rgba(255,193,7,0.3)",
          borderRadius: "10px",
          padding: "14px 18px",
          marginBottom: "24px",
          fontSize: "12px",
          color: "var(--muted)",
          lineHeight: "1.6",
        }}
      >
        ⚠️ <strong style={{ color: "var(--text)" }}>Atenção Meta:</strong> para contatos fora de
        janela de 24h, use <strong>templates aprovados</strong>. Mensagens livres só funcionam para
        quem interagiu recentemente.
      </div>

      {/* 1 — Audiência */}
      <div style={cardStyle}>
        <span style={labelStyle}>1. Audiência</span>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
          {(
            [
              { value: "clientes", label: "👥 Clientes" },
              { value: "leads", label: "🎯 Leads" },
              { value: "ambos", label: "🌐 Ambos" },
              { value: "manual", label: "📋 Lista manual" },
            ] as { value: AudienceType; label: string }[]
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setAudience(opt.value);
                setConfirmed(false);
                setResult(null);
                setError(null);
              }}
              style={audience === opt.value ? chipActive : chipInactive}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {audience === "manual" ? (
          <div>
            <label style={labelStyle}>Números (um por linha, vírgula ou ponto-e-vírgula)</label>
            <textarea
              value={manualPhones}
              onChange={(e) => setManualPhones(e.target.value)}
              placeholder={"5551999999999\n5551988888888"}
              rows={5}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }}
            />
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px" }}>
              {manualCount} número{manualCount !== 1 ? "s" : ""} válido
              {manualCount !== 1 ? "s" : ""}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "var(--muted)",
            }}
          >
            {loadingCount ? (
              "Contando..."
            ) : (
              <>
                <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--gold)" }}>
                  {audienceCount ?? "—"}
                </span>
                destinatários encontrados
                <button
                  onClick={() => fetchCount(audience)}
                  style={{
                    marginLeft: "6px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--muted)",
                    fontSize: "15px",
                  }}
                  title="Atualizar"
                >
                  ↻
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 2 — Tipo de envio */}
      <div style={cardStyle}>
        <span style={labelStyle}>2. Tipo de mensagem</span>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <button
            onClick={() => {
              setUseMetaTemplate(true);
              setConfirmed(false);
              setError(null);
            }}
            style={{
              ...(useMetaTemplate ? chipActive : chipInactive),
              flex: 1,
              textAlign: "center" as const,
            }}
          >
            ✅ Template Meta aprovado
          </button>
          <button
            onClick={() => {
              setUseMetaTemplate(false);
              setConfirmed(false);
              setError(null);
            }}
            style={{
              ...(!useMetaTemplate ? chipActive : chipInactive),
              flex: 1,
              textAlign: "center" as const,
            }}
          >
            ✏️ Texto livre (24h)
          </button>
        </div>

        {useMetaTemplate ? (
          <>
            <label style={labelStyle}>Template aprovado</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {META_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedMeta(t.id);
                    setConfirmed(false);
                    setError(null);
                  }}
                  style={
                    selectedMeta === t.id
                      ? { ...chipActive, fontSize: "12px" }
                      : { ...chipInactive, fontSize: "12px" }
                  }
                >
                  {t.label}
                  <span style={{ marginLeft: "6px", fontSize: "10px", opacity: 0.7 }}>
                    {t.categoria}
                  </span>
                </button>
              ))}
            </div>

            {/* Badge do template selecionado */}
            <div
              style={{
                background: "rgba(40,167,69,0.06)",
                border: "1px solid rgba(40,167,69,0.2)",
                borderRadius: "10px",
                padding: "14px 18px",
                fontSize: "12px",
                color: "var(--muted)",
                marginBottom: "8px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}
              >
                <span
                  style={{
                    background: "rgba(40,167,69,0.15)",
                    color: "#28a745",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {currentMetaTemplate.categoria}
                </span>
                <code style={{ fontSize: "11px", color: "var(--gold)" }}>
                  {currentMetaTemplate.id}
                </code>
                {currentMetaTemplate.hasVar && (
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                    · personaliza com nome do cliente
                  </span>
                )}
              </div>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.6",
                  color: "var(--text)",
                  fontSize: "13px",
                }}
              >
                {currentMetaTemplate.preview}
              </div>
            </div>
          </>
        ) : (
          <>
            <label style={labelStyle}>Base de texto</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {FREE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedFree(t.id);
                    if (t.id !== "personalizada") setMessage(t.text);
                    else setMessage("");
                    setConfirmed(false);
                    setError(null);
                  }}
                  style={
                    selectedFree === t.id
                      ? { ...chipActive, fontSize: "12px" }
                      : { ...chipInactive, fontSize: "12px" }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label style={labelStyle}>Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setSelectedFree("personalizada");
              }}
              rows={8}
              placeholder="Escreva sua mensagem..."
              style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
            />
            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
              {message.length} caracteres · Só funciona para contatos com janela de 24h aberta
            </p>
          </>
        )}
      </div>

      {/* 3 — Confirmar */}
      <div style={cardStyle}>
        <span style={labelStyle}>3. Confirmar Envio</span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: recipientCount > 500 ? "rgba(220,53,69,0.06)" : "rgba(40,167,69,0.06)",
            border: `1px solid ${recipientCount > 500 ? "rgba(220,53,69,0.2)" : "rgba(40,167,69,0.2)"}`,
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "var(--text)",
          }}
        >
          <span style={{ fontSize: "18px" }}>{recipientCount > 500 ? "🔴" : "✅"}</span>
          <div>
            <strong>
              {recipientCount} mensage{recipientCount !== 1 ? "ns" : "m"} serão enviadas
            </strong>
            {useMetaTemplate ? (
              <div style={{ color: "var(--muted)", marginTop: "4px", fontSize: "12px" }}>
                Template: <code>{selectedMeta}</code>
              </div>
            ) : (
              <div style={{ color: "var(--muted)", marginTop: "4px", fontSize: "12px" }}>
                Texto livre — só para janelas de 24h abertas
              </div>
            )}
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            color: "var(--text)",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ width: "16px", height: "16px", cursor: "pointer" }}
          />
          Confirmo que tenho autorização para enviar esta mensagem aos destinatários selecionados.
        </label>

        {error && (
          <div
            style={{
              background: "rgba(220,53,69,0.08)",
              border: "1px solid rgba(220,53,69,0.25)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "#dc3545",
              marginBottom: "16px",
            }}
          >
            ❌ {error}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending || !confirmed || recipientCount === 0}
          style={{
            padding: "12px 32px",
            background:
              sending || !confirmed || recipientCount === 0 ? "var(--border)" : "var(--gold)",
            color: sending || !confirmed || recipientCount === 0 ? "var(--muted)" : "#1a1004",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: sending || !confirmed || recipientCount === 0 ? "not-allowed" : "pointer",
          }}
        >
          {sending
            ? "Enviando..."
            : `📤 Enviar para ${recipientCount} contato${recipientCount !== 1 ? "s" : ""}`}
        </button>
      </div>

      {/* Resultado */}
      {result && (
        <div
          style={{
            background: result.failed === 0 ? "rgba(40,167,69,0.08)" : "rgba(248,113,113,0.08)",
            border: `1px solid ${result.failed === 0 ? "rgba(40,167,69,0.3)" : "rgba(248,113,113,0.3)"}`,
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
            {result.failed === 0 ? "✅ Envio concluído!" : result.sent === 0 ? "❌ Nenhuma mensagem foi enviada" : "⚠️ Envio com erros"}
          </p>
          <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "var(--muted)", marginBottom: "12px" }}>
            <span>📨 <strong style={{ color: "var(--text)" }}>{result.sent}</strong> enviadas</span>
            <span>❌ <strong style={{ color: result.failed > 0 ? "#f87171" : "var(--text)" }}>{result.failed}</strong> falhas</span>
            <span>📊 <strong style={{ color: "var(--text)" }}>{result.total}</strong> total</span>
          </div>

          {/* Erro principal — mostra o motivo real da falha */}
          {result.firstError && (
            <div style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: "10px",
              padding: "12px 14px",
              fontSize: "12px",
              color: "#f87171",
              marginBottom: "8px",
            }}>
              <strong>Erro da API Meta:</strong> {result.firstError}
            </div>
          )}

          {result.errors.length > 0 && (
            <div style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "monospace" }}>
              {(result.errors as any[]).map((e, i) => (
                <div key={i}>
                  {typeof e === "string" ? e : `${e.num}: ${e.msg}`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
