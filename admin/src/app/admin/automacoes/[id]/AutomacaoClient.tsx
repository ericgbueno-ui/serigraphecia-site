"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StepConfig { type: string; [k: string]: unknown }
interface Step { id: string; type: string; label: string; config: StepConfig }
interface RunLog { stepId: string; label: string; ok: boolean; message: string; ts: string }
interface Run {
  id: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  logs: RunLog[] | null;
  error?: string | null;
  inputData?: Record<string, unknown> | null;
}

interface Flow {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  steps: Step[];
  createdAt: string;
  runs: Run[];
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  failed: "#ef4444",
  running: "#f59e0b",
  pending: "#94a3b8",
};

const STEP_ICONS: Record<string, string> = {
  SEND_WHATSAPP: "📱",
  SEND_EMAIL: "📧",
  UPDATE_LEAD: "🎯",
  NOTIFY_TEAM: "🔔",
  HTTP_REQUEST: "🌐",
};

export default function AutomacaoClient({ flow: initialFlow }: { flow: Flow }) {
  const router = useRouter();
  const [flow, setFlow] = useState<Flow>(initialFlow);
  const [running, setRunning] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const webhookUrl =
    flow.triggerType === "WEBHOOK" && origin
      ? `${origin}/api/automacoes/webhook/${(flow.triggerConfig as { token?: string }).token ?? ""}`
      : null;

  async function toggleActive() {
    setToggling(true);
    const res = await fetch(`/api/admin/automacoes/${flow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !flow.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setFlow((prev) => ({ ...prev, active: updated.active }));
    }
    setToggling(false);
  }

  async function runNow() {
    setRunning(true);
    const res = await fetch(`/api/admin/automacoes/${flow.id}/run`, { method: "POST" });
    const data = await res.json();
    setRunning(false);
    alert(data.ok ? "✅ Executado com sucesso!" : `❌ Falha em ${data.logs?.filter((l: RunLog) => !l.ok).length ?? 0} passo(s).`);
    router.refresh();
  }

  async function deleteFlow() {
    if (!confirm(`Excluir "${flow.name}"? Esta ação remove todo o histórico.`)) return;
    await fetch(`/api/admin/automacoes/${flow.id}`, { method: "DELETE" });
    router.push("/admin/automacoes");
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
        <Link href="/admin/automacoes" style={{ color: "var(--muted)", textDecoration: "none" }}>
          ← Automações
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text)" }}>{flow.name}</h1>
            <span
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 20,
                background: flow.active ? "rgba(34,197,94,0.1)" : "rgba(148,163,184,0.1)",
                color: flow.active ? "#22c55e" : "#94a3b8",
                border: `1px solid ${flow.active ? "#22c55e44" : "#94a3b844"}`,
                fontWeight: 700,
              }}
            >
              {flow.active ? "Ativo" : "Inativo"}
            </span>
          </div>
          {flow.description && (
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{flow.description}</p>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={toggleActive}
            disabled={toggling}
            style={{
              padding: "9px 16px",
              borderRadius: 9,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {flow.active ? "⏸ Desativar" : "▶ Ativar"}
          </button>
          <Link
            href={`/admin/automacoes/canvas/${flow.id}`}
            style={{
              padding: "9px 16px",
              borderRadius: 9,
              background: "#1e293b",
              color: "var(--text)",
              border: "1px solid var(--border)",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🎨 Editar no Canvas
          </Link>
          <button
            onClick={runNow}
            disabled={running}
            style={{
              padding: "9px 16px",
              borderRadius: 9,
              background: "var(--gold)",
              color: "#000",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              opacity: running ? 0.7 : 1,
            }}
          >
            {running ? "Executando..." : "▶ Executar agora"}
          </button>
          <button
            onClick={deleteFlow}
            style={{
              padding: "9px 12px",
              borderRadius: 9,
              border: "1px solid #ef444444",
              background: "transparent",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            🗑
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Gatilho */}
        <Section title="⚡ Gatilho">
          <KV label="Tipo" value={flow.triggerType} />
          {flow.triggerType === "SCHEDULE" && (
            <KV label="Cron" value={(flow.triggerConfig as { cron?: string }).cron ?? "-"} mono />
          )}
          {flow.triggerType === "EVENT" && (
            <KV label="Evento" value={(flow.triggerConfig as { event?: string }).event ?? "-"} />
          )}
          {flow.triggerType === "WEBHOOK" && webhookUrl && (
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>URL do Webhook</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <code
                  style={{
                    fontSize: 11,
                    background: "var(--bg)",
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    wordBreak: "break-all",
                    flex: 1,
                    color: "var(--gold)",
                  }}
                >
                  {webhookUrl}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                  style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
                >
                  📋
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Stats */}
        <Section title="📊 Execuções">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {(["completed", "failed"] as const).map((s) => {
              const count = flow.runs.filter((r) => r.status === s).length;
              return (
                <div key={s} style={{ textAlign: "center", padding: 12, background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: STATUS_COLORS[s] }}>{count}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s}</div>
                </div>
              );
            })}
          </div>
          <KV label="Total" value={String(flow.runs.length)} />
        </Section>
      </div>

      {/* Passos */}
      <Section title="🔢 Passos do fluxo" style={{ marginTop: 20 }}>
        {flow.steps.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>
            Nenhum passo configurado.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {flow.steps.map((step, i) => (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 16px",
                  background: "var(--bg)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--gold)",
                    background: "var(--gold-dim)",
                    padding: "3px 8px",
                    borderRadius: 6,
                    minWidth: 24,
                    textAlign: "center",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 18 }}>{STEP_ICONS[step.type] ?? "⚙️"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{step.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{step.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Histórico de execuções */}
      <Section title="🕐 Histórico de execuções" style={{ marginTop: 20 }}>
        {flow.runs.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>
            Nenhuma execução ainda.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {flow.runs.map((run) => (
              <div key={run.id}>
                <button
                  onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  style={{
                    width: "100%",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[run.status] ?? "var(--muted)", minWidth: 70 }}>
                    {run.status}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)", flex: 1 }} suppressHydrationWarning>
                    {new Date(run.createdAt).toLocaleString("pt-BR")}
                  </span>
                  {run.completedAt && (
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {Math.round((new Date(run.completedAt).getTime() - new Date(run.createdAt).getTime()) / 1000)}s
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>{expandedRun === run.id ? "▲" : "▼"}</span>
                </button>

                {expandedRun === run.id && (
                  <div style={{ padding: "12px 14px", background: "var(--bg)", borderRadius: "0 0 8px 8px", border: "1px solid var(--border)", borderTop: "none" }}>
                    {run.inputData && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>INPUT</div>
                        <pre style={{ fontSize: 11, color: "var(--text)", margin: 0, overflow: "auto" }}>
                          {JSON.stringify(run.inputData, null, 2)}
                        </pre>
                      </div>
                    )}
                    {Array.isArray(run.logs) && run.logs.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>PASSOS</div>
                        {run.logs.map((log, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "flex-start",
                              marginBottom: 4,
                              fontSize: 12,
                              color: "var(--text)",
                            }}
                          >
                            <span style={{ color: log.ok ? "#22c55e" : "#ef4444", flexShrink: 0 }}>{log.ok ? "✓" : "✗"}</span>
                            <span style={{ fontWeight: 600, flexShrink: 0 }}>{log.label}</span>
                            <span style={{ color: "var(--muted)" }}>{log.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {run.error && (
                      <div style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>
                        Erro: {run.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "20px",
        ...style,
      }}
    >
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 16px" }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text)", fontFamily: mono ? "monospace" : undefined }}>{value}</span>
    </div>
  );
}
