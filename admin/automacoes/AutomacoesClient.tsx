"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FlowSummary {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  _count: { runs: number };
  runs: Array<{ status: string; createdAt: string }>;
  updatedAt: string;
}

interface Props {
  flows: FlowSummary[];
}

const TRIGGER_LABELS: Record<string, string> = {
  SCHEDULE: "⏰ Agendado",
  WEBHOOK: "🔗 Webhook",
  EVENT: "⚡ Evento",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  failed: "#ef4444",
  running: "#f59e0b",
  pending: "#94a3b8",
};

export default function AutomacoesClient({ flows }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<Array<{ name: string; description: string }>>([]);

  async function toggleActive(id: string, currentActive: boolean) {
    setLoadingId(id);
    await fetch(`/api/admin/automacoes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !currentActive }),
    });
    setLoadingId(null);
    router.refresh();
  }

  async function deleteFlow(id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Isso remove o histórico de execuções.`)) return;
    await fetch(`/api/admin/automacoes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function runManual(id: string) {
    setLoadingId(id);
    const res = await fetch(`/api/admin/automacoes/${id}/run`, { method: "POST" });
    const data = await res.json();
    setLoadingId(null);
    alert(data.ok ? "✅ Fluxo executado com sucesso!" : `❌ Falha: ${JSON.stringify(data.logs?.filter((l: {ok:boolean}) => !l.ok))}`);
    router.refresh();
  }

  async function loadTemplates() {
    setImporting(true);
    const res = await fetch("/api/admin/automacoes/templates");
    const data = await res.json();
    setTemplates(data);
    setShowTemplates(true);
    setImporting(false);
  }

  async function importTemplate(index: number) {
    const res = await fetch("/api/admin/automacoes/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateIndex: index }),
    });
    if (res.ok) {
      setShowTemplates(false);
      router.refresh();
    }
  }

  if (flows.length === 0) {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          Nenhum fluxo ainda
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
          Crie um fluxo do zero ou importe um dos templates prontos.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/admin/automacoes/novo"
            style={{
              background: "var(--gold)",
              color: "#000",
              padding: "10px 20px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            + Criar fluxo
          </Link>
          <button
            onClick={loadTemplates}
            disabled={importing}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text)",
              padding: "10px 20px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            📋 Importar template
          </button>
        </div>

        {showTemplates && (
          <TemplateModal
            templates={templates}
            onImport={importTemplate}
            onClose={() => setShowTemplates(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={loadTemplates}
          disabled={importing}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            padding: "8px 16px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          📋 Importar template
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {flows.map((flow) => {
          const lastRun = flow.runs[0];
          return (
            <div
              key={flow.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              {/* Toggle ativo */}
              <button
                onClick={() => toggleActive(flow.id, flow.active)}
                disabled={loadingId === flow.id}
                title={flow.active ? "Desativar" : "Ativar"}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  background: flow.active ? "var(--gold)" : "var(--border)",
                  position: "relative",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: flow.active ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.2s",
                  }}
                />
              </button>

              {/* Info principal */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Link
                    href={`/admin/automacoes/${flow.id}`}
                    style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", textDecoration: "none" }}
                  >
                    {flow.name}
                  </Link>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "var(--bg)",
                      color: "var(--muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {TRIGGER_LABELS[flow.triggerType] ?? flow.triggerType}
                  </span>
                  {flow.triggerType === "SCHEDULE" && (
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {(flow.triggerConfig as { cron?: string }).cron}
                    </span>
                  )}
                </div>
                {flow.description && (
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {flow.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{flow._count.runs}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>execuções</div>
                </div>
                {lastRun && (
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: STATUS_COLORS[lastRun.status] ?? "var(--muted)",
                      }}
                    >
                      {lastRun.status}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>último</div>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => runManual(flow.id)}
                  disabled={loadingId === flow.id}
                  title="Executar agora"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  ▶
                </button>
                <Link
                  href={`/admin/automacoes/canvas/${flow.id}`}
                  title="Editar no Canvas"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    textDecoration: "none",
                    fontSize: 13,
                  }}
                >
                  🎨
                </Link>
                <Link
                  href={`/admin/automacoes/${flow.id}`}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    textDecoration: "none",
                    fontSize: 13,
                  }}
                >
                  ✏️
                </Link>
                <button
                  onClick={() => deleteFlow(flow.id, flow.name)}
                  title="Excluir"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "#ef4444",
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showTemplates && (
        <TemplateModal
          templates={templates}
          onImport={importTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}

function TemplateModal({
  templates,
  onImport,
  onClose,
}: {
  templates: Array<{ name: string; description: string }>;
  onImport: (i: number) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          maxWidth: 520,
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px", color: "var(--text)" }}>
          📋 Templates de fluxo
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {templates.map((t, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{t.description}</div>
              </div>
              <button
                onClick={() => onImport(i)}
                style={{
                  background: "var(--gold)",
                  color: "#000",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Importar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
