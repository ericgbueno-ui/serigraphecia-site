"use client";

import { useState, useEffect, useCallback } from "react";

// ── Tipos ──────────────────────────────────────────────────────────────────

type Campaign = {
  id: string;
  title: string;
  subject: string;
  body: string;
  ctaText?: string | null;
  ctaUrl?: string | null;
  audience: string;
  manualEmails?: string | null;
  status: string;
  sentAt?: string | null;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  followupSentAt?: string | null;
  followupCount: number;
};

type CampaignRecipient = {
  email: string;
  name?: string;
  status: "sent" | "failed";
};

type AudienceType = "clientes" | "leads" | "ambos" | "manual" | "b2b";

type SendResult = { total: number; sent: number; failed: number; errors: string[] };

// ── Templates pré-definidos ────────────────────────────────────────────────

const EMAIL_TEMPLATES = [
  {
    id: "lembrete_atendimento",
    label: "🗓️ Lembrete de Atendimento",
    subject: "Sua atendimento está chegando! ✈️",
    body: `Sua atendimento para a sua região está se aproximando!\n\nSeu veículo está confirmado e o profissional já estará te esperando.\n\nQualquer dúvida sobre logística, horários ou dicas do que fazer por aqui, é só responder este e-mail — estou aqui para ajudar você a aproveitar cada momento.\n\nBoa atendimento! 🤎`,
    ctaText: "Ver Detalhes da Agendamento",
    ctaUrl: "https://seudominio.com.br",
  },
  {
    id: "avaliacao",
    label: "⭐ Pedir Avaliação",
    subject: "Como foi sua experiência com a [NOME DO NEGÓCIO]? 🤎",
    body: `Espero que sua atendimento pela sua região tenha sido incrível!\n\nSua opinião é muito importante para nós e nos ajuda a continuar evoluindo e atendendo cada vez melhor.\n\nLeva menos de 1 minuto — e significa muito para a nossa equipe. 🙏`,
    ctaText: "Deixar minha avaliação",
    ctaUrl: "https://g.page/r/CflNFvOwC_7vEAE/review",
  },
  {
    id: "reativacao",
    label: "🔄 Reativação de Cliente",
    subject: "Sentimos sua falta! Está planejando uma nova atendimento? 🍷",
    body: `Já faz um tempo desde a sua última atendimento com a [NOME DO NEGÓCIO], e sentimos sua falta!\n\nEstá planejando uma nova visita a sua cidade ou sua região? Temos datas disponíveis e adoraríamos cuidar de tudo pra você novamente.\n\nComo cliente especial, você tem prioridade na agenda e às vezes condições exclusivas. ✨`,
    ctaText: "Solicitar orçamento",
    ctaUrl: "https://seudominio.com.br",
  },
  {
    id: "oferta",
    label: "🎁 Oferta / Promoção",
    subject: "Uma condição especial para você 🤎",
    body: `Tenho uma novidade que acho que vai te interessar!\n\nEstamos com uma condição especial para atendimentos na sua região nas próximas semanas.\n\nSe você está pensando em planejar uma atendimento para sua cidade ou sua região, este pode ser o momento certo. Vagas limitadas!`,
    ctaText: "Quero saber mais",
    ctaUrl: "https://seudominio.com.br",
  },
  {
    id: "b2b_prospeccao",
    label: "💼 Prospecção B2B",
    subject: "Atendimento privativo na sua região para os clientes da sua agência",
    body: `Olá, tudo bem?

Sou a Rita, co-fundadora da [NOME DO NEGÓCIO] — junto com o Eric, cuidamos de cada detalhe da chegada dos seus clientes na sua região.

Com mais de 10 anos do Eric transportando clientes nessa rota e o meu olhar no relacionamento e na experiência de cada pessoa que embarca conosco, criamos a [NOME DO NEGÓCIO] com um propósito claro: fazer o que o mercado não fazia — cuidar de verdade desde a chegada.

O atendimento do aeroporto é o primeiro contato físico do viajante com a atendimento. E a gente faz questão de que esse momento seja inesquecível.

O que entregamos às agências parceiras:
- Experiência de chegada premium — carro exclusivo, atendimento com nome e rosto
- Monitoramento em tempo real, com tolerância sem custo extra
- Suporte direto pelo WhatsApp antes, durante e depois da atendimento
- Comissão para a agência em cada agendamento

Mais de 1.000 atendimentos realizados. Cadastur ativo. Atendimento todos os dias do ano.

Podemos conversar 15 minutos esta semana?

Um abraço,
Rita e Eric`,
    ctaText: "Falar pelo WhatsApp",
    ctaUrl: "https://wa.me/5551986876557",
  },
  {
    id: "personalizado",
    label: "✏️ Campanha personalizada",
    subject: "",
    body: "",
    ctaText: "",
    ctaUrl: "",
  },
];

// ── Estilos compartilhados ─────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "24px",
};

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

const chipActive: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: "20px",
  border: "1.5px solid var(--gold)",
  background: "rgba(180,140,60,0.12)",
  color: "var(--gold)",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const chipInactive: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: "20px",
  border: "1.5px solid var(--border)",
  background: "transparent",
  color: "var(--muted)",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    draft:   { label: "Rascunho", color: "#b48c3c", bg: "rgba(180,140,60,0.1)" },
    sending: { label: "Enviando…", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
    sent:    { label: "Enviada", color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
    error:   { label: "Erro", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span style={{
      padding: "3px 10px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: 700,
      color: s.color,
      background: s.bg,
    }}>
      {s.label}
    </span>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function EmailClient() {
  const [view, setView] = useState<"list" | "compose" | "schedule">("list");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulário
  const [selectedTemplate, setSelectedTemplate] = useState(EMAIL_TEMPLATES[0].id);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(EMAIL_TEMPLATES[0].subject);
  const [body, setBody] = useState(EMAIL_TEMPLATES[0].body);
  const [ctaText, setCtaText] = useState(EMAIL_TEMPLATES[0].ctaText);
  const [ctaUrl, setCtaUrl] = useState(EMAIL_TEMPLATES[0].ctaUrl);
  const [audience, setAudience] = useState<AudienceType>("clientes");
  const [manualEmails, setManualEmails] = useState("");
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  // Envio
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal de destinatários
  const [recipientsModal, setRecipientsModal] = useState<{ campaign: Campaign; recipients: CampaignRecipient[] } | null>(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Follow-up
  const [followupLoadingId, setFollowupLoadingId] = useState<string | null>(null);
  const [followupResult, setFollowupResult] = useState<{ id: string; sent: number; failed: number } | null>(null);

  // Agendamentos em lote
  type BatchJob = {
    id: string; status: string; audience: string; subject: string;
    totalTarget: number; totalSent: number; createdAt: string;
    scheduleJson: string;
  };
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<{ id: string; sent: number; failed: number; total: number; firstError?: string | null } | null>(null);
  const [jobSubject, setJobSubject] = useState("");
  const [jobBody, setJobBody] = useState("");
  const [jobCtaText, setJobCtaText] = useState("Falar pelo WhatsApp");
  const [jobCtaUrl, setJobCtaUrl] = useState("https://wa.me/5551986876557");

  const loadBatchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch("/api/admin/email/batch-jobs");
      const data = await res.json();
      setBatchJobs(data.jobs ?? []);
    } finally { setLoadingJobs(false); }
  }, []);

  useEffect(() => { if (view === "schedule") void loadBatchJobs(); }, [view, loadBatchJobs]);

  async function handleCreateJob() {
    if (!jobSubject.trim() || !jobBody.trim()) {
      setError("Assunto e corpo são obrigatórios."); return;
    }
    setSavingJob(true); setError(null);
    // Primeiro lote começa hoje às 11h BRT = 14h UTC
    const startAt = new Date();
    startAt.setUTCHours(14, 0, 0, 0);
    if (startAt <= new Date()) startAt.setUTCDate(startAt.getUTCDate() + 1);
    try {
      const res = await fetch("/api/admin/email/batch-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: jobSubject, body: jobBody,
          ctaText: jobCtaText, ctaUrl: jobCtaUrl,
          audience: "b2b", totalTarget: 500,
          startAt: startAt.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar agendamento."); return; }
      await loadBatchJobs();
      setJobSubject(""); setJobBody("");
    } catch { setError("Erro de comunicação."); }
    finally { setSavingJob(false); }
  }

  async function handleJobAction(id: string, status: "active" | "paused" | "cancelled") {
    await fetch(`/api/admin/email/batch-jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadBatchJobs();
  }

  async function handleTriggerNow(id: string) {
    if (!confirm("Disparar o próximo lote AGORA?")) return;
    setTriggeringId(id);
    setTriggerResult(null);
    try {
      const res = await fetch(`/api/admin/email/batch-jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger-now" }),
      });
      const data = await res.json();
      if (res.ok) {
        setTriggerResult({ id, sent: data.sent ?? 0, failed: data.failed ?? 0, total: data.total ?? 0, firstError: data.firstError ?? null });
      } else {
        setError(data.error ?? "Erro ao disparar.");
      }
      await loadBatchJobs();
    } catch (err: unknown) { setError("Erro: " + (err instanceof Error ? err.message : String(err))); }
    finally { setTriggeringId(null); }
  }

  async function handleScheduleToday(id: string) {
    if (!confirm("Mover os próximos 2 lotes para HOJE (11h30 e 16h)?")) return;
    const res = await fetch(`/api/admin/email/batch-jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "schedule-today" }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(`✅ Agendado!\nLote 1: ${data.lote1?.batchSize} e-mails às 11h30\nLote 2: ${data.lote2?.batchSize ?? 0} e-mails às 16h`);
    } else {
      alert(`Erro: ${data.error}`);
    }
    await loadBatchJobs();
  }

  async function handleReschedule(id: string) {
    if (!confirm("Reagendar para hoje às 11h? O contador de enviados será zerado.")) return;
    await fetch(`/api/admin/email/batch-jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reschedule" }),
    });
    await loadBatchJobs();
  }

  // Config Resend
  const [resendReady, setResendReady] = useState<boolean | null>(null);
  const [resendMissing, setResendMissing] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/email/config-status")
      .then((r) => r.json())
      .then((d) => { setResendReady(d.ready); setResendMissing(d.missing ?? []); })
      .catch(() => setResendReady(null));
  }, []);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCampaigns(); }, [loadCampaigns]);

  const fetchAudienceCount = useCallback(async (a: AudienceType) => {
    if (a === "manual") { setAudienceCount(null); return; }
    try {
      const res = await fetch(`/api/admin/marketing/audience-count?audience=${a}`);
      const data = await res.json();
      setAudienceCount(data.count ?? 0);
    } catch { setAudienceCount(null); }
  }, []);

  useEffect(() => { void fetchAudienceCount(audience); }, [audience, fetchAudienceCount]);

  function applyTemplate(id: string) {
    setSelectedTemplate(id);
    const t = EMAIL_TEMPLATES.find((x) => x.id === id)!;
    if (id !== "personalizado") {
      setSubject(t.subject);
      setBody(t.body);
      setCtaText(t.ctaText);
      setCtaUrl(t.ctaUrl);
    }
    setConfirmed(false);
    setError(null);
  }

  async function handlePreview() {
    const res = await fetch("/api/admin/email/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, ctaText, ctaUrl, audience }),
    });
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) win.addEventListener("unload", () => URL.revokeObjectURL(url), { once: true });
  }

  async function handleSave() {
    if (!title.trim() || !subject.trim() || !body.trim()) {
      setError("Título interno, assunto e corpo são obrigatórios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subject, body, ctaText, ctaUrl, audience, manualEmails }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao salvar."); return; }
      await loadCampaigns();
      setView("list");
      resetForm();
    } catch { setError("Erro de comunicação."); }
    finally { setSaving(false); }
  }

  async function handleSend(id: string) {
    setSendingId(id);
    setSendResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/email/campaigns/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao enviar."); }
      else { setSendResult(data as SendResult); }
      await loadCampaigns();
    } catch { setError("Erro de comunicação."); }
    finally { setSendingId(null); setConfirmed(false); }
  }

  async function handleDelete(id: string, status: string) {
    const isSent = status === "sent" || status === "error";
    const msg = isSent
      ? "Deletar esta campanha enviada? Esta ação é irreversível."
      : "Deletar esta campanha?";
    if (!confirm(msg)) return;
    await fetch(`/api/admin/email/campaigns/${id}`, { method: "DELETE" });
    await loadCampaigns();
  }

  async function handleFollowup(campaign: Campaign) {
    if (!confirm(`Enviar follow-up para os ${campaign.sentCount} destinatários da campanha "${campaign.title}"?`)) return;
    setFollowupLoadingId(campaign.id);
    setFollowupResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/email/campaigns/${campaign.id}/followup`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao enviar follow-up."); }
      else { setFollowupResult({ id: campaign.id, sent: data.sent, failed: data.failed }); }
      await loadCampaigns();
    } catch { setError("Erro de comunicação."); }
    finally { setFollowupLoadingId(null); }
  }

  async function handleViewRecipients(campaign: Campaign) {
    setLoadingRecipients(true);
    try {
      const res = await fetch(`/api/admin/email/campaigns/${campaign.id}`);
      const data = await res.json();
      setRecipientsModal({ campaign, recipients: data.recipients ?? [] });
    } catch {
      setError("Erro ao carregar destinatários.");
    } finally {
      setLoadingRecipients(false);
    }
  }

  function resetForm() {
    setTitle(""); setSubject(""); setBody(""); setCtaText(""); setCtaUrl("");
    setAudience("clientes"); setManualEmails(""); setConfirmed(false); setError(null);
    setSelectedTemplate(EMAIL_TEMPLATES[0].id);
  }

  const manualCount = manualEmails
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes("@")).length;

  const recipientCount = audience === "manual" ? manualCount : (audienceCount ?? 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "32px 40px", maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--muted)", marginBottom: "6px" }}>
            Admin · E-mail Marketing
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)" }}>
            📧 Campanhas de E-mail
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
            Powered by Resend · Templates profissionais · Rastreamento de entrega
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {view !== "list" && (
            <button onClick={() => { setView("list"); resetForm(); }}
              style={{ ...chipInactive, border: "1.5px solid var(--border)" }}>
              ← Voltar
            </button>
          )}
          {view === "list" && (
            <>
              <button onClick={() => setView("schedule")}
                style={{ ...chipInactive, fontSize: "12px" }}>
                🗓 Agendamentos
              </button>
              <button onClick={() => { setView("compose"); resetForm(); }}
                style={{ padding: "10px 22px", background: "var(--gold)", color: "#1a1004", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                + Nova Campanha
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── LISTA ─────────────────────────────────────────────────────────── */}
      {view === "list" && (
        <div>
          {/* Aviso de configuração — só aparece se faltar alguma var */}
          {resendReady === false && (
            <div style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", fontSize: "12px", color: "var(--muted)", lineHeight: "1.6" }}>
              ⚠️ <strong style={{ color: "var(--text)" }}>Setup incompleto:</strong> adicione{" "}
              {resendMissing.map((v, i) => (
                <span key={v}><code style={{ color: "#60a5fa" }}>{v}</code>{i < resendMissing.length - 1 ? " e " : ""}</span>
              ))}{" "}
              nas variáveis de ambiente da Vercel. Verifique seu domínio em{" "}
              <strong style={{ color: "var(--text)" }}>resend.com/domains</strong> para enviar pelo seudominio.com.br.
            </div>
          )}

          {loading ? (
            <p style={{ fontSize: "13px", color: "var(--muted)", padding: "40px 0", textAlign: "center" }}>Carregando...</p>
          ) : campaigns.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "60px 24px" }}>
              <p style={{ fontSize: "32px", marginBottom: "12px" }}>📧</p>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Nenhuma campanha ainda</p>
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>Crie sua primeira campanha de e-mail.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {campaigns.map((c) => (
                <div key={c.id} style={{ ...cardStyle, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{c.title}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
                        {c.subject}
                      </p>
                      <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "var(--muted)", flexWrap: "wrap" }}>
                        <span>👥 {c.audience}</span>
                        {c.status === "sent" && (
                          <>
                            <span>📨 {c.sentCount} enviados</span>
                            {c.failedCount > 0 && <span style={{ color: "#f87171" }}>❌ {c.failedCount} falhas</span>}
                            <span>📅 {new Date(c.sentAt!).toLocaleDateString("pt-BR")}</span>
                            {c.audience === "b2b" && c.followupCount > 0 && (
                              <span style={{ color: "#60a5fa" }}>
                                🔁 Follow-up enviado em {new Date(c.followupSentAt!).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                            {c.audience === "b2b" && c.followupCount === 0 && (
                              <span style={{ color: "var(--gold)" }}>⏳ Aguardando follow-up</span>
                            )}
                          </>
                        )}
                        {c.status === "draft" && (
                          <span>🕐 Criada em {new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      {/* Preview — sempre disponível */}
                      <a
                        href={`/api/admin/email/campaigns/${c.id}/preview`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ padding: "7px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--muted)", fontSize: "12px", textDecoration: "none" }}
                      >
                        👁️ Preview
                      </a>

                      {/* Follow-up — só campanhas B2B enviadas sem follow-up */}
                      {c.status === "sent" && c.audience === "b2b" && c.followupCount === 0 && (
                        <button
                          onClick={() => handleFollowup(c)}
                          disabled={followupLoadingId === c.id}
                          style={{ padding: "7px 14px", background: followupLoadingId === c.id ? "var(--border)" : "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: "8px", color: followupLoadingId === c.id ? "var(--muted)" : "#60a5fa", fontSize: "12px", cursor: followupLoadingId === c.id ? "not-allowed" : "pointer", fontWeight: 600 }}
                        >
                          {followupLoadingId === c.id ? "Enviando..." : "🔁 Follow-up"}
                        </button>
                      )}

                      {/* Destinatários — campanhas enviadas */}
                      {(c.status === "sent" || c.status === "error") && (
                        <button
                          onClick={() => handleViewRecipients(c)}
                          disabled={loadingRecipients}
                          style={{ padding: "7px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--muted)", fontSize: "12px", cursor: "pointer" }}
                        >
                          👥 Destinatários
                        </button>
                      )}

                      {/* Deletar — disponível para qualquer status */}
                      <button
                        onClick={() => handleDelete(c.id, c.status)}
                        style={{ padding: "7px 14px", background: "transparent", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "12px", cursor: "pointer" }}
                      >
                        Deletar
                      </button>

                      {/* Enviar — só rascunhos */}
                      {c.status === "draft" && (
                        <button
                          onClick={() => handleSend(c.id)}
                          disabled={sendingId === c.id}
                          style={{ padding: "7px 16px", background: sendingId === c.id ? "var(--border)" : "var(--gold)", color: sendingId === c.id ? "var(--muted)" : "#1a1004", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: sendingId === c.id ? "not-allowed" : "pointer" }}
                        >
                          {sendingId === c.id ? "Enviando..." : "📤 Enviar"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resultado do disparo manual */}
          {triggerResult && (
            <div style={{ marginTop: "16px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: "12px", padding: "20px 24px" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
                ⚡ Lote disparado!
              </p>
              <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "var(--muted)" }}>
                <span>📨 <strong style={{ color: "var(--text)" }}>{triggerResult.sent}</strong> enviados</span>
                {triggerResult.failed > 0 && <span>❌ <strong style={{ color: "#f87171" }}>{triggerResult.failed}</strong> falhas</span>}
              </div>
            </div>
          )}

          {/* Resultado do follow-up */}
          {followupResult && (
            <div style={{ marginTop: "16px", background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: "12px", padding: "20px 24px" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
                🔁 Follow-up enviado!
              </p>
              <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "var(--muted)" }}>
                <span>📨 <strong style={{ color: "var(--text)" }}>{followupResult.sent}</strong> enviados</span>
                {followupResult.failed > 0 && <span>❌ <strong style={{ color: "#f87171" }}>{followupResult.failed}</strong> falhas</span>}
              </div>
            </div>
          )}

          {/* Resultado do último envio */}
          {sendResult && (
            <div style={{ marginTop: "16px", background: sendResult.failed === 0 ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${sendResult.failed === 0 ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`, borderRadius: "12px", padding: "20px 24px" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
                {sendResult.failed === 0 ? "✅ Envio concluído!" : "⚠️ Envio com erros"}
              </p>
              <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "var(--muted)" }}>
                <span>📨 <strong style={{ color: "var(--text)" }}>{sendResult.sent}</strong> enviados</span>
                <span>❌ <strong style={{ color: sendResult.failed > 0 ? "#f87171" : "var(--text)" }}>{sendResult.failed}</strong> falhas</span>
                <span>📊 <strong style={{ color: "var(--text)" }}>{sendResult.total}</strong> total</span>
              </div>
              {sendResult.errors.length > 0 && (
                <div style={{ marginTop: "12px", fontFamily: "monospace", fontSize: "11px", color: "#f87171" }}>
                  {sendResult.errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Resultado do disparo manual — visível na aba de agendamentos */}
          {triggerResult && (
            <div style={{ marginTop: "16px", background: triggerResult.sent > 0 ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${triggerResult.sent > 0 ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`, borderRadius: "12px", padding: "20px 24px" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
                {triggerResult.sent > 0 ? "⚡ Lote disparado!" : triggerResult.total === 0 ? "⚠️ Nenhum contato encontrado" : "❌ Falha no envio"}
              </p>
              <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "var(--muted)", marginBottom: triggerResult.firstError ? "10px" : "0" }}>
                <span>📋 <strong style={{ color: "var(--text)" }}>{triggerResult.total}</strong> contatos encontrados</span>
                <span>📨 <strong style={{ color: "var(--text)" }}>{triggerResult.sent}</strong> enviados</span>
                {triggerResult.failed > 0 && <span>❌ <strong style={{ color: "#f87171" }}>{triggerResult.failed}</strong> falhas</span>}
              </div>
              {triggerResult.firstError && (
                <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#f87171" }}>
                  <strong>Erro:</strong> {triggerResult.firstError}
                </div>
              )}
              {triggerResult.total === 0 && (
                <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>
                  Nenhum contato B2B com e-mail cadastrado foi encontrado. Importe contatos em <strong>B2B → Contatos</strong> antes de disparar.
                </p>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: "12px", background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.25)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#dc3545" }}>
              ❌ {error}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL DESTINATÁRIOS ─────────────────────────────────────────────── */}
      {recipientsModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setRecipientsModal(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
        >
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--muted)", marginBottom: "4px" }}>
                  Destinatários da Campanha
                </p>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                  {recipientsModal.campaign.title}
                </h2>
                <div style={{ display: "flex", gap: "16px", marginTop: "6px", fontSize: "12px", color: "var(--muted)" }}>
                  <span>📨 {recipientsModal.campaign.sentCount} enviados</span>
                  {recipientsModal.campaign.failedCount > 0 && (
                    <span style={{ color: "#f87171" }}>❌ {recipientsModal.campaign.failedCount} falhas</span>
                  )}
                  <span>📊 {recipientsModal.recipients.length} total</span>
                </div>
              </div>
              <button
                onClick={() => setRecipientsModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "20px", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Lista */}
            <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px" }}>
              {recipientsModal.recipients.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", padding: "32px 0" }}>
                  Sem dados de destinatários (campanha enviada antes desta funcionalidade).
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {/* Filtros rápidos */}
                  <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "var(--muted)", alignSelf: "center" }}>
                      {recipientsModal.recipients.filter(r => r.status === "sent").length} enviados ·{" "}
                      {recipientsModal.recipients.filter(r => r.status === "failed").length} falhas
                    </span>
                  </div>

                  {recipientsModal.recipients.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "var(--bg)", borderRadius: "8px", fontSize: "13px" }}>
                      <span style={{ fontSize: "14px" }}>{r.status === "sent" ? "✅" : "❌"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {r.name && (
                          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.name}
                          </div>
                        )}
                        <div style={{ color: "var(--muted)", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.email}
                        </div>
                      </div>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "10px",
                        color: r.status === "sent" ? "#4ade80" : "#f87171",
                        background: r.status === "sent" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                      }}>
                        {r.status === "sent" ? "Enviado" : "Falha"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPOSE ───────────────────────────────────────────────────────── */}
      {view === "compose" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 1 — Template */}
          <div style={cardStyle}>
            <span style={labelStyle}>1. Template base</span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {EMAIL_TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => applyTemplate(t.id)}
                  style={selectedTemplate === t.id ? chipActive : chipInactive}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2 — Conteúdo */}
          <div style={cardStyle}>
            <span style={labelStyle}>2. Conteúdo do e-mail</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Título interno (não aparece no e-mail)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Campanha reativação — maio 2026"
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Assunto do e-mail</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Sua atendimento está chegando! ✈️"
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Corpo da mensagem</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)}
                  rows={8} placeholder="Escreva o conteúdo do e-mail..."
                  style={{ ...inputStyle, resize: "vertical", lineHeight: "1.7" }} />
                <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                  Quebras de linha são preservadas. O primeiro nome do destinatário é inserido automaticamente.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Texto do botão CTA (opcional)</label>
                  <input value={ctaText} onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Ex: Solicitar orçamento"
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>URL do botão CTA (opcional)</label>
                  <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://seudominio.com.br"
                    style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* 3 — Audiência */}
          <div style={cardStyle}>
            <span style={labelStyle}>3. Audiência</span>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
              {(["clientes", "leads", "ambos", "b2b", "manual"] as AudienceType[]).map((a) => (
                <button key={a} onClick={() => setAudience(a)}
                  style={audience === a ? chipActive : chipInactive}>
                  {a === "clientes" ? "👥 Clientes" : a === "leads" ? "🎯 Leads" : a === "ambos" ? "🌐 Ambos" : a === "b2b" ? "💼 Agências B2B" : "📋 Manual"}
                </button>
              ))}
            </div>
            {audience === "manual" ? (
              <div>
                <label style={labelStyle}>E-mails (um por linha)</label>
                <textarea value={manualEmails} onChange={(e) => setManualEmails(e.target.value)}
                  placeholder={"email@exemplo.com\noutro@exemplo.com"}
                  rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }} />
                <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px" }}>
                  {manualCount} e-mail{manualCount !== 1 ? "s" : ""} válido{manualCount !== 1 ? "s" : ""}
                </p>
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--gold)", marginRight: "8px" }}>
                  {audienceCount ?? "—"}
                </span>
                destinatários com e-mail cadastrado
              </p>
            )}
          </div>

          {/* 4 — Salvar rascunho */}
          <div style={cardStyle}>
            <span style={labelStyle}>4. Salvar e enviar</span>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px", lineHeight: "1.6" }}>
              A campanha será salva como rascunho. Você poderá enviá-la na lista de campanhas.
            </p>
            {error && (
              <div style={{ background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.25)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#dc3545", marginBottom: "16px" }}>
                ❌ {error}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: "12px 28px", background: saving ? "var(--border)" : "var(--gold)", color: saving ? "var(--muted)" : "#1a1004", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving ? "Salvando..." : "💾 Salvar Rascunho"}
              </button>
              <button
                onClick={handlePreview}
                disabled={!subject && !body}
                style={{ padding: "12px 20px", background: "transparent", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "var(--muted)", cursor: "pointer" }}
              >
                👁️ Ver Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AGENDAMENTOS ──────────────────────────────────────────────────── */}
      {view === "schedule" && (
        <div>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "24px", lineHeight: "1.6" }}>
            Disparo gradual (warmup) para aquecer o domínio. Começa com 5 e-mails às 12h e 5 às 17h,
            dobrando a cada dia até concluir os 500 contatos B2B. Follow-ups automáticos nas segundas.
          </p>

          {/* Criar novo agendamento */}
          <div style={{ ...cardStyle, marginBottom: "20px" }}>
            <span style={labelStyle}>Novo agendamento</span>

            {/* Modelos prontos */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Modelo pronto</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  {
                    id: "b2b_prospecao",
                    label: "💼 B2B — Prospecção",
                    subject: "Atendimento privativo na sua região para os clientes da sua agência",
                    body: `Olá, tudo bem?\n\nSou a Rita, co-fundadora da [NOME DO NEGÓCIO] — junto com o Eric, cuidamos de cada detalhe da chegada dos seus clientes na sua região.\n\nCom mais de 10 anos do Eric transportando clientes nessa rota e o meu olhar no relacionamento e na experiência de cada pessoa que embarca conosco, criamos a [NOME DO NEGÓCIO] com um propósito claro: fazer o que o mercado não fazia — cuidar de verdade desde a chegada.\n\nO atendimento do aeroporto é o primeiro contato físico do viajante com a atendimento. E a gente faz questão de que esse momento seja inesquecível.\n\nO que entregamos às agências parceiras:\n- Experiência de chegada premium — carro exclusivo, atendimento com nome e rosto\n- Monitoramento em tempo real, com tolerância sem custo extra\n- Suporte direto pelo WhatsApp antes, durante e depois da atendimento\n- Comissão para a agência em cada agendamento\n\nMais de 1.000 atendimentos realizados. Cadastur ativo. Atendimento todos os dias do ano.\n\nPodemos conversar 15 minutos esta semana?\n\nUm abraço,\nRita e Eric`,
                    ctaText: "Falar pelo WhatsApp",
                    ctaUrl: "https://wa.me/5551986876557",
                  },
                  {
                    id: "b2b_reativacao",
                    label: "🔄 B2B — Reativação",
                    subject: "Novidades na [NOME DO NEGÓCIO] para sua agência",
                    body: `Olá, tudo bem?\n\nSou a Rita, da [NOME DO NEGÓCIO]. Já nos falamos antes e queria retomar o contato.\n\nTemos novidades para agências parceiras e acredito que pode fazer sentido para o perfil dos seus clientes.\n\nA gente cuida de cada chegada na sua região com carro exclusivo, atendimento direto pelo WhatsApp e monitoramento de voo em tempo real. Nada compartilhado, nada genérico.\n\nPodemos conversar rapidinho?\n\nUm abraço,\nRita e Eric`,
                    ctaText: "Falar pelo WhatsApp",
                    ctaUrl: "https://wa.me/5551986876557",
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setJobSubject(t.subject);
                      setJobBody(t.body);
                      setJobCtaText(t.ctaText);
                      setJobCtaUrl(t.ctaUrl);
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "20px",
                      border: jobSubject === t.subject ? "1.5px solid var(--gold)" : "1.5px solid var(--border)",
                      background: jobSubject === t.subject ? "rgba(180,140,60,0.12)" : "transparent",
                      color: jobSubject === t.subject ? "var(--gold)" : "var(--muted)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Assunto do e-mail</label>
                <input value={jobSubject} onChange={(e) => setJobSubject(e.target.value)}
                  placeholder="Atendimento privativo na sua região para os clientes da sua agência"
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Corpo da mensagem</label>
                <textarea value={jobBody} onChange={(e) => setJobBody(e.target.value)}
                  rows={6} placeholder="Texto do e-mail..."
                  style={{ ...inputStyle, resize: "vertical", lineHeight: "1.7" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Texto do botão CTA</label>
                  <input value={jobCtaText} onChange={(e) => setJobCtaText(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>URL do botão CTA</label>
                  <input value={jobCtaUrl} onChange={(e) => setJobCtaUrl(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Preview do cronograma */}
              <div style={{ background: "var(--bg)", borderRadius: "10px", padding: "14px 16px", fontSize: "12px", color: "var(--muted)" }}>
                <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Cronograma de envio (500 contatos B2B)</p>
                {[
                  { dia: "Hoje  11h00", qtd: 5 }, { dia: "Hoje  17h00", qtd: 5 },
                  { dia: "D+1   8h30",  qtd: 10 }, { dia: "D+1  14h00", qtd: 10 },
                  { dia: "D+2   8h30",  qtd: 20 }, { dia: "D+2  14h00", qtd: 20 },
                  { dia: "D+3   8h30",  qtd: 40 }, { dia: "D+3  14h00", qtd: 40 },
                  { dia: "D+4   8h30",  qtd: 80 }, { dia: "D+4  14h00", qtd: 80 },
                  { dia: "D+5   8h30",  qtd: 100 }, { dia: "D+5  14h00", qtd: 90 },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid var(--border)" }}>
                    <span>{s.dia}</span>
                    <span style={{ color: "var(--gold)", fontWeight: 600 }}>{s.qtd} e-mails</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontWeight: 700, color: "var(--text)" }}>
                  <span>Total</span><span>500 e-mails</span>
                </div>
                <p style={{ marginTop: "8px", color: "var(--muted)", fontSize: "11px" }}>
                  Follow-ups automáticos toda segunda-feira para quem não respondeu.
                </p>
              </div>

              {error && (
                <div style={{ background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.25)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#dc3545" }}>
                  ❌ {error}
                </div>
              )}

              <button onClick={handleCreateJob} disabled={savingJob}
                style={{ alignSelf: "flex-start", padding: "12px 28px", background: savingJob ? "var(--border)" : "var(--gold)", color: savingJob ? "var(--muted)" : "#1a1004", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: savingJob ? "not-allowed" : "pointer" }}>
                {savingJob ? "Criando..." : "🚀 Iniciar agendamento"}
              </button>
            </div>
          </div>

          {/* Resultado do trigger — fixo no topo da lista */}
          {triggerResult && (
            <div style={{ marginBottom: "16px", background: triggerResult.sent > 0 ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${triggerResult.sent > 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: "12px", padding: "16px 20px" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>
                {triggerResult.sent > 0 ? "⚡ Lote disparado!" : triggerResult.total === 0 ? "⚠️ Sem contatos no offset atual" : "❌ Falha ao enviar"}
              </p>
              <div style={{ fontSize: "13px", color: "var(--muted)", display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <span>📋 {triggerResult.total} contatos</span>
                <span>📨 <strong style={{ color: "var(--text)" }}>{triggerResult.sent}</strong> enviados</span>
                {triggerResult.failed > 0 && <span>❌ <strong style={{ color: "#f87171" }}>{triggerResult.failed}</strong> falhas</span>}
              </div>
              {triggerResult.firstError && (
                <div style={{ marginTop: "10px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#f87171", wordBreak: "break-all" }}>
                  <strong>Erro Resend:</strong> {triggerResult.firstError}
                </div>
              )}
            </div>
          )}

          {/* Lista de jobs */}
          {loadingJobs ? (
            <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", padding: "32px" }}>Carregando...</p>
          ) : batchJobs.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "40px" }}>
              <p style={{ fontSize: "32px", marginBottom: "8px" }}>🗓</p>
              <p style={{ fontSize: "14px", color: "var(--muted)" }}>Nenhum agendamento criado ainda.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {batchJobs.map((job) => {
                const schedule = JSON.parse(job.scheduleJson) as Array<{ sendAt: string; batchSize: number; sent: boolean; sentCount?: number }>;
                const nextPending = schedule.find((e) => !e.sent);
                const doneBatches = schedule.filter((e) => e.sent).length;
                const statusColors: Record<string, string> = { active: "#4ade80", paused: "#fbbf24", completed: "#60a5fa", cancelled: "#f87171" };
                return (
                  <div key={job.id} style={{ ...cardStyle, padding: "20px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{job.subject}</span>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", color: statusColors[job.status] ?? "#fff", background: `${statusColors[job.status]}20` }}>
                            {job.status === "active" ? "Ativo" : job.status === "paused" ? "Pausado" : job.status === "completed" ? "Concluído" : "Cancelado"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--muted)", flexWrap: "wrap" }}>
                          <span>📨 {job.totalSent} / {job.totalTarget} enviados</span>
                          <span>📦 Lote {doneBatches}/{schedule.length}</span>
                          {nextPending && (
                            <span>⏳ Próximo: {new Date(nextPending.sendAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {nextPending.batchSize} e-mails</span>
                          )}
                        </div>
                        {/* Mini progress bar */}
                        <div style={{ marginTop: "10px", height: "4px", background: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.round((job.totalSent / job.totalTarget) * 100)}%`, background: "var(--gold)", borderRadius: "4px" }} />
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                          {Math.round((job.totalSent / job.totalTarget) * 100)}% concluído
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {(job.status === "active" || job.status === "paused") && (
                          <button
                            onClick={() => handleTriggerNow(job.id)}
                            disabled={triggeringId === job.id}
                            style={{ padding: "7px 14px", background: triggeringId === job.id ? "var(--border)" : "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.4)", borderRadius: "8px", color: triggeringId === job.id ? "var(--muted)" : "#4ade80", fontSize: "12px", cursor: triggeringId === job.id ? "not-allowed" : "pointer", fontWeight: 700 }}>
                            {triggeringId === job.id ? "Enviando..." : "⚡ Disparar agora"}
                          </button>
                        )}
                        {(job.status === "active" || job.status === "paused") && (
                          <button onClick={() => handleScheduleToday(job.id)}
                            style={{ padding: "7px 14px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.4)", borderRadius: "8px", color: "#60a5fa", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>
                            📅 Hoje
                          </button>
                        )}
                        {(job.status === "active" || job.status === "paused") && job.totalSent === 0 && (
                          <button onClick={() => handleReschedule(job.id)}
                            style={{ padding: "7px 14px", background: "rgba(180,140,60,0.1)", border: "1px solid rgba(180,140,60,0.4)", borderRadius: "8px", color: "var(--gold)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>
                            🔄 Reagendar
                          </button>
                        )}
                        {job.status === "active" && (
                          <button onClick={() => handleJobAction(job.id, "paused")}
                            style={{ padding: "7px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--muted)", fontSize: "12px", cursor: "pointer" }}>
                            ⏸ Pausar
                          </button>
                        )}
                        {job.status === "paused" && (
                          <button onClick={() => handleJobAction(job.id, "active")}
                            style={{ padding: "7px 14px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "8px", color: "#4ade80", fontSize: "12px", cursor: "pointer" }}>
                            ▶ Retomar
                          </button>
                        )}
                        {(job.status === "active" || job.status === "paused") && (
                          <button onClick={() => { if (confirm("Cancelar este agendamento?")) handleJobAction(job.id, "cancelled"); }}
                            style={{ padding: "7px 14px", background: "transparent", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "12px", cursor: "pointer" }}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
