"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StepType = "SEND_WHATSAPP" | "SEND_EMAIL" | "UPDATE_LEAD" | "NOTIFY_TEAM" | "HTTP_REQUEST";

interface Step {
  id: string;
  type: StepType;
  label: string;
  config: Record<string, unknown>;
}

const STEP_LABELS: Record<StepType, string> = {
  SEND_WHATSAPP: "📱 Enviar WhatsApp",
  SEND_EMAIL: "📧 Enviar E-mail",
  UPDATE_LEAD: "🎯 Atualizar Lead",
  NOTIFY_TEAM: "🔔 Notificar Equipe",
  HTTP_REQUEST: "🌐 Requisição HTTP",
};

const TRIGGER_LABELS: Record<string, string> = {
  SCHEDULE: "⏰ Agendado (cron)",
  WEBHOOK: "🔗 Webhook",
  EVENT: "⚡ Evento interno",
};

const EVENTS = [
  { value: "payment_confirmed", label: "Pagamento confirmado" },
  { value: "booking_created", label: "Agendamento criada" },
  { value: "lead_status_changed", label: "Lead mudou de status" },
  { value: "checkout_abandoned", label: "Checkout abandonado" },
  { value: "customer_birthday", label: "Aniversário do cliente" },
];

export default function NovoFluxoClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("EVENT");
  const [cronExpr, setCronExpr] = useState("0 9 * * *");
  const [eventName, setEventName] = useState("payment_confirmed");
  const [steps, setSteps] = useState<Step[]>([]);
  const [addingStep, setAddingStep] = useState(false);

  function addStep(type: StepType) {
    const defaults: Record<StepType, Record<string, unknown>> = {
      SEND_WHATSAPP: { type: "SEND_WHATSAPP", to: "{{input.phone}}", message: "Olá, {{input.name}}! 🤎" },
      SEND_EMAIL: { type: "SEND_EMAIL", to: "{{input.email}}", subject: "Olá!", body: "Olá, {{input.name}}!" },
      UPDATE_LEAD: { type: "UPDATE_LEAD", whatsapp: "{{input.phone}}", status: "quente" },
      NOTIFY_TEAM: { type: "NOTIFY_TEAM", message: "🔔 Novo evento: {{input.name}}" },
      HTTP_REQUEST: { type: "HTTP_REQUEST", url: "https://", method: "POST", body: "{}" },
    };
    setSteps((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), type, label: STEP_LABELS[type], config: defaults[type] },
    ]);
    setAddingStep(false);
  }

  function updateStep(id: string, field: string, value: string) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, config: { ...s.config, [field]: value } } : s))
    );
  }

  function updateStepLabel(id: string, label: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function moveStep(id: string, dir: -1 | 1) {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }

  async function save() {
    if (!name) return alert("Nome obrigatório");
    if (steps.length === 0) return alert("Adicione pelo menos um passo");

    setSaving(true);

    let triggerConfig: Record<string, unknown> = {};
    if (triggerType === "SCHEDULE") triggerConfig = { cron: cronExpr };
    if (triggerType === "WEBHOOK") triggerConfig = {};
    if (triggerType === "EVENT") triggerConfig = { event: eventName };

    const res = await fetch("/api/admin/automacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, triggerType, triggerConfig, steps, active: true }),
    });

    setSaving(false);

    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/automacoes/${data.id}`);
    } else {
      alert("Erro ao salvar fluxo");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Info básica */}
      <Card title="📋 Informações">
        <Field label="Nome do fluxo *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Confirmação de pagamento"
            style={inputStyle}
          />
        </Field>
        <Field label="Descrição">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="O que este fluxo faz?"
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>
      </Card>

      {/* Gatilho */}
      <Card title="⚡ Gatilho">
        <Field label="Tipo de gatilho">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTriggerType(v)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: triggerType === v ? "var(--gold)" : "var(--border)",
                  background: triggerType === v ? "var(--gold-dim)" : "transparent",
                  color: triggerType === v ? "var(--gold)" : "var(--muted)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: triggerType === v ? 700 : 400,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </Field>

        {triggerType === "SCHEDULE" && (
          <Field label="Cron expression (UTC)">
            <input
              value={cronExpr}
              onChange={(e) => setCronExpr(e.target.value)}
              placeholder="0 9 * * *"
              style={inputStyle}
            />
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              Ex: <code>0 9 * * *</code> = todo dia às 9h UTC | <code>0 12 * * 1</code> = toda segunda às 12h UTC
            </p>
          </Field>
        )}

        {triggerType === "EVENT" && (
          <Field label="Evento interno">
            <select value={eventName} onChange={(e) => setEventName(e.target.value)} style={inputStyle}>
              {EVENTS.map((ev) => (
                <option key={ev.value} value={ev.value}>{ev.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              O fluxo roda quando o evento acontece no sistema (ex: pagamento confirmado).
            </p>
          </Field>
        )}

        {triggerType === "WEBHOOK" && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, padding: "12px 16px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
            🔗 Um token será gerado automaticamente ao salvar. Você poderá enviar um POST para o URL do webhook para disparar o fluxo de qualquer sistema externo.
          </p>
        )}
      </Card>

      {/* Passos */}
      <Card title="🔢 Passos">
        {steps.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>
            Nenhum passo adicionado.
          </p>
        )}

        {steps.map((step, idx) => (
          <StepEditor
            key={step.id}
            step={step}
            index={idx}
            total={steps.length}
            onUpdate={updateStep}
            onUpdateLabel={updateStepLabel}
            onRemove={removeStep}
            onMove={moveStep}
          />
        ))}

        {addingStep ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {(Object.keys(STEP_LABELS) as StepType[]).map((type) => (
              <button
                key={type}
                onClick={() => addStep(type)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {STEP_LABELS[type]}
              </button>
            ))}
            <button
              onClick={() => setAddingStep(false)}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingStep(true)}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "10px",
              borderRadius: 8,
              border: "1px dashed var(--border)",
              background: "transparent",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            + Adicionar passo
          </button>
        )}
      </Card>

      {/* Salvar */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button
          onClick={() => router.push("/admin/automacoes")}
          style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 13 }}
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            background: "var(--gold)",
            color: "#000",
            border: "none",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Salvando..." : "✅ Salvar fluxo"}
        </button>
      </div>
    </div>
  );
}

// ─── Step Editor ──────────────────────────────────────────────────────────────

function StepEditor({
  step,
  index,
  total,
  onUpdate,
  onUpdateLabel,
  onRemove,
  onMove,
}: {
  step: Step;
  index: number;
  total: number;
  onUpdate: (id: string, field: string, value: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, minWidth: 20 }}>
          {index + 1}.
        </span>
        <input
          value={step.label}
          onChange={(e) => onUpdateLabel(step.id, e.target.value)}
          style={{ ...inputStyle, flex: 1, fontWeight: 600 }}
        />
        <div style={{ display: "flex", gap: 4 }}>
          {index > 0 && (
            <button onClick={() => onMove(step.id, -1)} style={iconBtn}>↑</button>
          )}
          {index < total - 1 && (
            <button onClick={() => onMove(step.id, 1)} style={iconBtn}>↓</button>
          )}
          <button onClick={() => onRemove(step.id)} style={{ ...iconBtn, color: "#ef4444" }}>✕</button>
        </div>
      </div>

      <StepFields step={step} onUpdate={onUpdate} />
    </div>
  );
}

function StepFields({ step, onUpdate }: { step: Step; onUpdate: (id: string, field: string, value: string) => void }) {
  const cfg = step.config;

  if (step.type === "SEND_WHATSAPP") {
    return (
      <>
        <Field label="Para (número ou {{input.phone}})">
          <input value={String(cfg.to ?? "")} onChange={(e) => onUpdate(step.id, "to", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Mensagem">
          <textarea value={String(cfg.message ?? "")} onChange={(e) => onUpdate(step.id, "message", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </Field>
      </>
    );
  }

  if (step.type === "SEND_EMAIL") {
    return (
      <>
        <Field label="Para (e-mail ou {{input.email}})">
          <input value={String(cfg.to ?? "")} onChange={(e) => onUpdate(step.id, "to", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Assunto">
          <input value={String(cfg.subject ?? "")} onChange={(e) => onUpdate(step.id, "subject", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Corpo">
          <textarea value={String(cfg.body ?? "")} onChange={(e) => onUpdate(step.id, "body", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </Field>
      </>
    );
  }

  if (step.type === "UPDATE_LEAD") {
    return (
      <>
        <Field label="WhatsApp do lead">
          <input value={String(cfg.whatsapp ?? "")} onChange={(e) => onUpdate(step.id, "whatsapp", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Novo status (opcional)">
          <select value={String(cfg.status ?? "")} onChange={(e) => onUpdate(step.id, "status", e.target.value)} style={inputStyle}>
            <option value="">— manter atual —</option>
            <option value="frio">frio</option>
            <option value="interessado">interessado</option>
            <option value="quente">quente</option>
            <option value="pronto">pronto</option>
            <option value="convertido">convertido</option>
          </select>
        </Field>
      </>
    );
  }

  if (step.type === "NOTIFY_TEAM") {
    return (
      <Field label="Mensagem para a equipe">
        <textarea value={String(cfg.message ?? "")} onChange={(e) => onUpdate(step.id, "message", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </Field>
    );
  }

  if (step.type === "HTTP_REQUEST") {
    return (
      <>
        <Field label="URL">
          <input value={String(cfg.url ?? "")} onChange={(e) => onUpdate(step.id, "url", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Método">
          <select value={String(cfg.method ?? "POST")} onChange={(e) => onUpdate(step.id, "method", e.target.value)} style={inputStyle}>
            {["GET", "POST", "PUT", "DELETE"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Body (JSON)">
          <textarea value={String(cfg.body ?? "")} onChange={(e) => onUpdate(step.id, "body", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }} />
        </Field>
      </>
    );
  }

  return null;
}

// ─── Helpers de UI ────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 20px" }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 16px" }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13,
  boxSizing: "border-box",
};

const iconBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--muted)",
  cursor: "pointer",
  fontSize: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
