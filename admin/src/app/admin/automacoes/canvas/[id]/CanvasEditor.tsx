"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepType = "SEND_WHATSAPP" | "SEND_EMAIL" | "UPDATE_LEAD" | "NOTIFY_TEAM" | "HTTP_REQUEST";
type TriggerType = "SCHEDULE" | "WEBHOOK" | "EVENT";

interface StepData {
  stepId: string;
  stepType: StepType;
  label: string;
  config: Record<string, unknown>;
  selected?: boolean;
  onSelect?: (id: string) => void;
  [key: string]: unknown;
}

interface TriggerData {
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
  selected?: boolean;
  onSelect?: (id: string) => void;
  [key: string]: unknown;
}

interface FlowData {
  id: string;
  name: string;
  active: boolean;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  steps: Array<{ id: string; type: string; label: string; config: Record<string, unknown> }>;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STEP_ICONS: Record<string, string> = {
  SEND_WHATSAPP: "📱",
  SEND_EMAIL: "📧",
  UPDATE_LEAD: "🎯",
  NOTIFY_TEAM: "🔔",
  HTTP_REQUEST: "🌐",
};

const STEP_COLORS: Record<string, string> = {
  SEND_WHATSAPP: "#25d366",
  SEND_EMAIL: "#4f86f7",
  UPDATE_LEAD: "#f59e0b",
  NOTIFY_TEAM: "#8b5cf6",
  HTTP_REQUEST: "#64748b",
};

const TRIGGER_ICONS: Record<string, string> = {
  SCHEDULE: "⏰",
  WEBHOOK: "🔗",
  EVENT: "⚡",
};

const TRIGGER_COLORS: Record<string, string> = {
  SCHEDULE: "#c9963d",
  WEBHOOK: "#06b6d4",
  EVENT: "#c9963d",
};

// ─── Custom Node: Trigger ─────────────────────────────────────────────────────

function TriggerNode({ id, data, selected }: NodeProps) {
  const d = data as TriggerData;
  const color = TRIGGER_COLORS[d.triggerType] ?? "#c9963d";
  const icon = TRIGGER_ICONS[d.triggerType] ?? "⚡";

  const eventLabels: Record<string, string> = {
    payment_confirmed: "Pagamento confirmado",
    booking_created: "Reserva criada",
    lead_status_changed: "Lead mudou de status",
    checkout_abandoned: "Checkout abandonado",
    customer_birthday: "Aniversário",
  };

  let subtitle = "";
  if (d.triggerType === "SCHEDULE") subtitle = String(d.triggerConfig?.cron ?? "");
  if (d.triggerType === "EVENT") subtitle = eventLabels[String(d.triggerConfig?.event ?? "")] ?? String(d.triggerConfig?.event ?? "");
  if (d.triggerType === "WEBHOOK") subtitle = "POST webhook";

  return (
    <div
      onClick={() => (d.onSelect as ((id: string) => void))?.(id)}
      style={{
        minWidth: 160,
        borderRadius: 12,
        border: `2px solid ${selected ? "#fff" : color + "88"}`,
        background: "#1a1a1a",
        overflow: "hidden",
        boxShadow: selected ? `0 0 0 2px ${color}` : "0 4px 20px rgba(0,0,0,0.4)",
        cursor: "pointer",
        fontFamily: "DM Sans, system-ui, sans-serif",
      }}
    >
      <div style={{ background: color, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Gatilho
        </span>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{d.triggerType}</div>
        {subtitle && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{subtitle}</div>}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: color, border: "2px solid #1a1a1a" }} />
    </div>
  );
}

// ─── Custom Node: Action ──────────────────────────────────────────────────────

function ActionNode({ id, data, selected }: NodeProps) {
  const d = data as StepData;
  const color = STEP_COLORS[d.stepType] ?? "#64748b";
  const icon = STEP_ICONS[d.stepType] ?? "⚙️";

  return (
    <div
      onClick={() => (d.onSelect as ((id: string) => void))?.(id)}
      style={{
        minWidth: 160,
        borderRadius: 12,
        border: `2px solid ${selected ? "#fff" : color + "55"}`,
        background: "#1a1a1a",
        overflow: "hidden",
        boxShadow: selected ? `0 0 0 2px ${color}` : "0 4px 20px rgba(0,0,0,0.4)",
        cursor: "pointer",
        fontFamily: "DM Sans, system-ui, sans-serif",
      }}
    >
      <div style={{ background: color + "22", borderBottom: `1px solid ${color}44`, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {d.stepType.replace(/_/g, " ")}
        </span>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{d.label}</div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: color, border: "2px solid #1a1a1a" }} />
      <Handle type="source" position={Position.Right} style={{ background: color, border: "2px solid #1a1a1a" }} />
    </div>
  );
}

// ─── Custom Node: End ─────────────────────────────────────────────────────────

function EndNode() {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "#1a1a1a",
        border: "2px solid #334155",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        fontFamily: "DM Sans, system-ui, sans-serif",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "#334155", border: "2px solid #1a1a1a" }} />
      <span title="Fim">⏹</span>
    </div>
  );
}

const NODE_TYPES: NodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  endNode: EndNode,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildNodes(
  flow: FlowData,
  onSelect: (id: string) => void
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const Y = 160;
  const GAP = 240;

  nodes.push({
    id: "trigger",
    type: "triggerNode",
    position: { x: 60, y: Y },
    data: {
      triggerType: flow.triggerType,
      triggerConfig: flow.triggerConfig,
      onSelect,
    },
  });

  flow.steps.forEach((step, i) => {
    nodes.push({
      id: step.id,
      type: "actionNode",
      position: { x: 60 + GAP * (i + 1), y: Y },
      data: {
        stepId: step.id,
        stepType: step.type,
        label: step.label,
        config: step.config,
        onSelect,
      },
    });
    const src = i === 0 ? "trigger" : flow.steps[i - 1].id;
    edges.push({ id: `e-${src}-${step.id}`, source: src, target: step.id, type: "smoothstep", animated: true, style: { stroke: "#475569" } });
  });

  const lastId = flow.steps.length > 0 ? flow.steps[flow.steps.length - 1].id : "trigger";
  nodes.push({
    id: "end",
    type: "endNode",
    position: { x: 60 + GAP * (flow.steps.length + 1), y: Y + 8 },
    data: {},
  });
  edges.push({ id: `e-${lastId}-end`, source: lastId, target: "end", type: "smoothstep", style: { stroke: "#475569" } });

  return { nodes, edges };
}

function extractStepsFromNodes(
  nodes: Node[],
  edges: Edge[]
): Array<{ id: string; type: string; label: string; config: Record<string, unknown> }> {
  const ordered: string[] = [];
  let cur = "trigger";
  const visited = new Set<string>();
  while (true) {
    if (visited.has(cur)) break;
    visited.add(cur);
    const next = edges.find((e) => e.source === cur && e.target !== "end");
    if (!next) break;
    if (next.target === "end") break;
    ordered.push(next.target);
    cur = next.target;
  }
  return ordered.map((id) => {
    const node = nodes.find((n) => n.id === id);
    const d = node?.data as StepData | undefined;
    return {
      id,
      type: d?.stepType ?? "",
      label: d?.label ?? "",
      config: d?.config ?? {},
    };
  });
}

// ─── Node Library (left panel) ────────────────────────────────────────────────

const ACTION_LIBRARY = [
  { type: "SEND_WHATSAPP", label: "Enviar WhatsApp", defaultConfig: { type: "SEND_WHATSAPP", to: "{{input.phone}}", message: "Olá, {{input.name}}! 🤎" } },
  { type: "SEND_EMAIL", label: "Enviar E-mail", defaultConfig: { type: "SEND_EMAIL", to: "{{input.email}}", subject: "Olá!", body: "Mensagem aqui." } },
  { type: "UPDATE_LEAD", label: "Atualizar Lead", defaultConfig: { type: "UPDATE_LEAD", whatsapp: "{{input.phone}}", status: "quente" } },
  { type: "NOTIFY_TEAM", label: "Notificar Equipe", defaultConfig: { type: "NOTIFY_TEAM", message: "🔔 {{input.name}}" } },
  { type: "HTTP_REQUEST", label: "Requisição HTTP", defaultConfig: { type: "HTTP_REQUEST", url: "https://", method: "POST", body: "{}" } },
];

// ─── Config Panel (right panel) ───────────────────────────────────────────────

function ConfigPanel({
  nodeId,
  nodes,
  onUpdate,
  onClose,
  onDelete,
}: {
  nodeId: string;
  nodes: Node[];
  onUpdate: (id: string, data: Partial<StepData & TriggerData>) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  if (node.id === "trigger") {
    const d = node.data as TriggerData;
    return (
      <PanelWrapper title="⚡ Gatilho" onClose={onClose}>
        <PField label="Tipo">
          <select
            value={d.triggerType}
            onChange={(e) => onUpdate("trigger", { triggerType: e.target.value as TriggerType })}
            style={pInputStyle}
          >
            <option value="EVENT">⚡ Evento interno</option>
            <option value="SCHEDULE">⏰ Agendado (cron)</option>
            <option value="WEBHOOK">🔗 Webhook</option>
          </select>
        </PField>
        {d.triggerType === "SCHEDULE" && (
          <PField label="Cron expression (UTC)">
            <input
              value={String(d.triggerConfig?.cron ?? "")}
              onChange={(e) => onUpdate("trigger", { triggerConfig: { ...d.triggerConfig, cron: e.target.value } })}
              placeholder="0 9 * * *"
              style={pInputStyle}
            />
          </PField>
        )}
        {d.triggerType === "EVENT" && (
          <PField label="Evento">
            <select
              value={String(d.triggerConfig?.event ?? "")}
              onChange={(e) => onUpdate("trigger", { triggerConfig: { ...d.triggerConfig, event: e.target.value } })}
              style={pInputStyle}
            >
              <option value="payment_confirmed">Pagamento confirmado</option>
              <option value="booking_created">Reserva criada</option>
              <option value="lead_status_changed">Lead mudou de status</option>
              <option value="checkout_abandoned">Checkout abandonado</option>
              <option value="customer_birthday">Aniversário</option>
            </select>
          </PField>
        )}
        {d.triggerType === "WEBHOOK" && (
          <p style={{ fontSize: 12, color: "#94a3b8" }}>Token gerado automaticamente. URL disponível no detalhe do fluxo.</p>
        )}
      </PanelWrapper>
    );
  }

  if (node.id === "end") {
    return (
      <PanelWrapper title="⏹ Fim" onClose={onClose}>
        <p style={{ fontSize: 12, color: "#94a3b8" }}>Este é o ponto final do fluxo. Nenhuma configuração necessária.</p>
      </PanelWrapper>
    );
  }

  const d = node.data as StepData;
  const color = STEP_COLORS[d.stepType] ?? "#64748b";

  return (
    <PanelWrapper title={`${STEP_ICONS[d.stepType] ?? "⚙️"} ${d.stepType.replace(/_/g, " ")}`} onClose={onClose} accentColor={color}>
      <PField label="Nome do passo">
        <input
          value={d.label}
          onChange={(e) => onUpdate(nodeId, { label: e.target.value })}
          style={pInputStyle}
        />
      </PField>

      {d.stepType === "SEND_WHATSAPP" && (
        <>
          <PField label="Para (número ou {{input.phone}})">
            <input value={String(d.config.to ?? "")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, to: e.target.value } })} style={pInputStyle} />
          </PField>
          <PField label="Mensagem">
            <textarea value={String(d.config.message ?? "")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, message: e.target.value } })} rows={4} style={{ ...pInputStyle, resize: "vertical" }} />
          </PField>
        </>
      )}

      {d.stepType === "SEND_EMAIL" && (
        <>
          <PField label="Para (e-mail ou {{input.email}})">
            <input value={String(d.config.to ?? "")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, to: e.target.value } })} style={pInputStyle} />
          </PField>
          <PField label="Assunto">
            <input value={String(d.config.subject ?? "")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, subject: e.target.value } })} style={pInputStyle} />
          </PField>
          <PField label="Corpo">
            <textarea value={String(d.config.body ?? "")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, body: e.target.value } })} rows={4} style={{ ...pInputStyle, resize: "vertical" }} />
          </PField>
        </>
      )}

      {d.stepType === "UPDATE_LEAD" && (
        <>
          <PField label="WhatsApp do lead">
            <input value={String(d.config.whatsapp ?? "")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, whatsapp: e.target.value } })} style={pInputStyle} />
          </PField>
          <PField label="Novo status">
            <select value={String(d.config.status ?? "")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, status: e.target.value } })} style={pInputStyle}>
              <option value="">— manter —</option>
              {["frio", "interessado", "quente", "pronto", "convertido"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </PField>
          <PField label="Ajuste de score (ex: +10 ou -5)">
            <input type="number" value={String(d.config.scoreDelta ?? "")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, scoreDelta: e.target.value } })} style={pInputStyle} />
          </PField>
        </>
      )}

      {d.stepType === "NOTIFY_TEAM" && (
        <PField label="Mensagem">
          <textarea value={String(d.config.message ?? "")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, message: e.target.value } })} rows={4} style={{ ...pInputStyle, resize: "vertical" }} />
        </PField>
      )}

      {d.stepType === "HTTP_REQUEST" && (
        <>
          <PField label="URL">
            <input value={String(d.config.url ?? "")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, url: e.target.value } })} style={pInputStyle} />
          </PField>
          <PField label="Método">
            <select value={String(d.config.method ?? "POST")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, method: e.target.value } })} style={pInputStyle}>
              {["GET", "POST", "PUT", "DELETE"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </PField>
          <PField label="Body (JSON)">
            <textarea value={String(d.config.body ?? "")} onChange={(e) => onUpdate(nodeId, { config: { ...d.config, body: e.target.value } })} rows={4} style={{ ...pInputStyle, resize: "vertical", fontFamily: "monospace" }} />
          </PField>
        </>
      )}

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #1e293b" }}>
        <button
          onClick={() => onDelete(nodeId)}
          style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #ef444444", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
        >
          🗑 Remover passo
        </button>
      </div>
    </PanelWrapper>
  );
}

// ─── Main Canvas Editor ───────────────────────────────────────────────────────

function CanvasEditorInner({ flow: initialFlow }: { flow: FlowData }) {
  const [flow, setFlow] = useState<FlowData>(initialFlow);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runLogs, setRunLogs] = useState<Array<{ ok: boolean; label: string; message: string }> | null>(null);
  const [active, setActive] = useState(initialFlow.active);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  const handleSelect = useCallback((id: string) => {
    setSelectedNodeId((prev) => (prev === id ? null : id));
  }, []);

  const initial = buildNodes(flow, handleSelect);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  // Inject onSelect into nodes so clicks work
  const nodesWithCb = nodes.map((n) => ({
    ...n,
    data: { ...n.data, onSelect: handleSelect, selected: n.id === selectedNodeId },
  }));

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: "smoothstep", animated: true, style: { stroke: "#475569" } }, eds)),
    [setEdges]
  );

  function addActionNode(type: string) {
    const lib = ACTION_LIBRARY.find((a) => a.type === type);
    if (!lib) return;
    const newId = `step_${Date.now()}_${idCounter.current++}`;
    const maxX = Math.max(...nodes.filter((n) => n.id !== "end").map((n) => n.position.x), 0);
    const endNode = nodes.find((n) => n.id === "end");
    const Y = 160;

    // Move end node right
    if (endNode) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === "end" ? { ...n, position: { ...n.position, x: maxX + 480 } } : n
        )
      );
    }

    const newNode: Node = {
      id: newId,
      type: "actionNode",
      position: { x: maxX + 240, y: Y },
      data: {
        stepId: newId,
        stepType: type,
        label: lib.label,
        config: lib.defaultConfig,
        onSelect: handleSelect,
      },
    };

    setNodes((nds) => [...nds, newNode]);

    // Connect: find node that previously pointed to "end", redirect to new node
    setEdges((eds) => {
      const toEnd = eds.find((e) => e.target === "end");
      const filtered = eds.filter((e) => e.target !== "end");
      const srcId = toEnd?.source ?? "trigger";
      return [
        ...filtered,
        { id: `e-${srcId}-${newId}`, source: srcId, target: newId, type: "smoothstep", animated: true, style: { stroke: "#475569" } },
        { id: `e-${newId}-end`, source: newId, target: "end", type: "smoothstep", style: { stroke: "#475569" } },
      ];
    });

    setSelectedNodeId(newId);
  }

  function updateNodeData(id: string, data: Partial<StepData & TriggerData>) {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
    );
  }

  function deleteNode(id: string) {
    // Reconnect edges around deleted node
    setEdges((eds) => {
      const incoming = eds.find((e) => e.target === id);
      const outgoing = eds.find((e) => e.source === id);
      const filtered = eds.filter((e) => e.source !== id && e.target !== id);
      if (incoming && outgoing) {
        filtered.push({
          id: `e-${incoming.source}-${outgoing.target}`,
          source: incoming.source,
          target: outgoing.target,
          type: "smoothstep",
          style: { stroke: "#475569" },
        });
      }
      return filtered;
    });
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setSelectedNodeId(null);
  }

  async function saveFlow() {
    setSaving(true);
    const steps = extractStepsFromNodes(nodes, edges);
    const triggerNode = nodes.find((n) => n.id === "trigger");
    const td = triggerNode?.data as TriggerData;

    await fetch(`/api/admin/automacoes/${flow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: flow.name,
        triggerType: td?.triggerType,
        triggerConfig: td?.triggerConfig,
        steps,
        active,
      }),
    });
    setSaving(false);
  }

  async function runNow() {
    setRunning(true);
    setRunLogs(null);
    const res = await fetch(`/api/admin/automacoes/${flow.id}/run`, { method: "POST" });
    const data = await res.json();
    setRunLogs(data.logs ?? []);
    setRunning(false);
  }

  async function toggleActive() {
    const next = !active;
    setActive(next);
    await fetch(`/api/admin/automacoes/${flow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#0f172a", fontFamily: "DM Sans, system-ui, sans-serif", overflow: "hidden" }}>
      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: "#111827", borderBottom: "1px solid #1e293b", flexShrink: 0, zIndex: 10 }}>
        <Link href={`/admin/automacoes/${flow.id}`} style={{ color: "#64748b", textDecoration: "none", fontSize: 18, lineHeight: 1 }} title="Voltar">←</Link>
        <div style={{ flex: 1 }}>
          <input
            value={flow.name}
            onChange={(e) => setFlow((f) => ({ ...f, name: e.target.value }))}
            style={{ background: "transparent", border: "none", color: "#e2e8f0", fontSize: 15, fontWeight: 700, outline: "none", width: "100%", maxWidth: 320 }}
          />
        </div>

        {/* Active toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: active ? "#22c55e" : "#64748b", fontWeight: 600 }}>{active ? "Ativo" : "Inativo"}</span>
          <button
            onClick={toggleActive}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: active ? "#22c55e" : "#334155",
              position: "relative",
              transition: "background 0.2s",
            }}
          >
            <span style={{ position: "absolute", top: 3, left: active ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </button>
        </div>

        <button
          onClick={saveFlow}
          disabled={saving}
          style={{ padding: "8px 20px", borderRadius: 8, background: "#c9963d", color: "#000", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Salvando…" : "💾 Salvar"}
        </button>
      </div>

      {/* ── Main area ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left panel: Node Library */}
        <div style={{ width: 200, background: "#111827", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "16px 12px 8px", fontSize: 10, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.15em" }}>Ações</div>
          {ACTION_LIBRARY.map((action) => {
            const color = STEP_COLORS[action.type] ?? "#64748b";
            return (
              <button
                key={action.type}
                onClick={() => addActionNode(action.type)}
                title={`Adicionar: ${action.label}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  color: "#cbd5e1",
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                  width: "100%",
                  borderRadius: 8,
                  margin: "2px 4px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{STEP_ICONS[action.type]}</span>
                <span style={{ fontSize: 12, color: "#e2e8f0" }}>{action.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 16, color, fontWeight: 700 }}>+</span>
              </button>
            );
          })}

          <div style={{ padding: "20px 12px 8px", fontSize: 10, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.15em" }}>Dicas</div>
          <div style={{ padding: "0 12px 16px", fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
            • Clique no nó para editar<br />
            • Arraste para mover<br />
            • Conecte saídas e entradas<br />
            • Use <code style={{ background: "#1e293b", padding: "1px 4px", borderRadius: 3 }}>{"{{input.x}}"}</code> nas mensagens
          </div>
        </div>

        {/* Canvas */}
        <div ref={reactFlowWrapper} style={{ flex: 1, position: "relative" }}>
          <ReactFlow
            nodes={nodesWithCb}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            colorMode="dark"
            defaultEdgeOptions={{ type: "smoothstep", animated: true, style: { stroke: "#475569" } }}
            style={{ background: "#0f172a" }}
          >
            <Background color="#1e293b" variant={BackgroundVariant.Dots} gap={24} size={1.5} />
            <Controls
              style={{ background: "#111827", border: "1px solid #1e293b" }}
              showInteractive={false}
            />
          </ReactFlow>
        </div>

        {/* Right panel: Config */}
        {selectedNodeId && (
          <div style={{ width: 300, background: "#111827", borderLeft: "1px solid #1e293b", overflowY: "auto", flexShrink: 0 }}>
            <ConfigPanel
              nodeId={selectedNodeId}
              nodes={nodes}
              onUpdate={updateNodeData}
              onClose={() => setSelectedNodeId(null)}
              onDelete={deleteNode}
            />
          </div>
        )}
      </div>

      {/* ── Bottom execution bar ── */}
      <div style={{ background: "#111827", borderTop: "1px solid #1e293b", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, zIndex: 10 }}>
        <button
          onClick={runNow}
          disabled={running}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
        >
          <span style={{ fontSize: 14 }}>{running ? "⏳" : "▶"}</span>
          {running ? "Executando…" : "Testar fluxo"}
        </button>

        {runLogs !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, overflow: "auto" }}>
            {runLogs.length === 0 ? (
              <span style={{ fontSize: 12, color: "#64748b" }}>Nenhum passo executado.</span>
            ) : (
              runLogs.map((log, i) => (
                <div
                  key={i}
                  title={log.message}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: log.ok ? "#16a34a22" : "#ef444422",
                    border: `1px solid ${log.ok ? "#16a34a44" : "#ef444444"}`,
                    fontSize: 12,
                    color: log.ok ? "#22c55e" : "#f87171",
                    whiteSpace: "nowrap",
                    maxWidth: 180,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <span>{log.ok ? "✓" : "✗"}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{log.label}</span>
                </div>
              ))
            )}
            <button onClick={() => setRunLogs(null)} style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 12, marginLeft: "auto", flexShrink: 0 }}>✕ Limpar</button>
          </div>
        )}

        <div style={{ marginLeft: "auto", fontSize: 12, color: "#475569", flexShrink: 0 }}>
          {nodes.filter((n) => n.type === "actionNode").length} passo(s)
        </div>
      </div>
    </div>
  );
}

// ─── Panel helpers ─────────────────────────────────────────────────────────────

function PanelWrapper({ title, children, onClose, accentColor }: { title: string; children: React.ReactNode; onClose: () => void; accentColor?: string }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", background: accentColor ? accentColor + "18" : "transparent" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: accentColor ?? "#c9963d" }}>{title}</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14, flex: 1, overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}

function PField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

const pInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 7,
  border: "1px solid #1e293b",
  background: "#0f172a",
  color: "#e2e8f0",
  fontSize: 13,
  boxSizing: "border-box",
  outline: "none",
};

// ─── Export wrapped in provider ───────────────────────────────────────────────

export default function CanvasEditor({ flow }: { flow: FlowData }) {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner flow={flow} />
    </ReactFlowProvider>
  );
}
