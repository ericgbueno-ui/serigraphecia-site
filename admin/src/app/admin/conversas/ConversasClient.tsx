"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { updateLeadStatus, deleteLeadFromConversas } from "./actions";
import { DangerConfirmModal } from "@/app/admin/components/DangerConfirmModal";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface LeadPreview {
  id: string;
  name?: string;
  whatsapp: string;
  status: string;
  score: number;
  updatedAt: string;
  valueCents?: number;
  interactions: { role: string; content: string; createdAt: string }[];
}

interface Interaction {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  aiEngine?: string;
}

interface Lead {
  id: string;
  name?: string;
  whatsapp: string;
  status: string;
  score: number;
  updatedAt: string;
  valueCents?: number;
}

interface Booking {
  id: string;
  status: string;
  idaDate?: string;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["frio", "interessado", "quente", "pronto", "convertido"];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  frio:        { bg: "rgba(100,116,139,0.2)",  text: "#94a3b8", dot: "#64748b" },
  interessado: { bg: "rgba(59,130,246,0.15)",  text: "#60a5fa", dot: "#3b82f6" },
  quente:      { bg: "rgba(249,115,22,0.15)",  text: "#fb923c", dot: "#f97316" },
  pronto:      { bg: "rgba(34,197,94,0.15)",   text: "#4ade80", dot: "#22c55e" },
  convertido:  { bg: "rgba(201,168,76,0.2)",   text: "#c9a84c", dot: "#c9a84c" },
};

const STATUS_LABELS: Record<string, string> = {
  frio: "Frio", interessado: "Interessado", quente: "Quente",
  pronto: "Pronto", convertido: "Convertido",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ago(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(id: string) {
  const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#06b6d4", "#c9a84c"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Avatar({ name, id, size = 40 }: { name?: string; id: string; size?: number }) {
  const color = avatarColor(id);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: "#fff", flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.frio;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: small ? "2px 7px" : "3px 9px",
      borderRadius: 20, background: c.bg, color: c.text,
      fontSize: small ? 10 : 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Painel esquerdo — lista de leads ─────────────────────────────────────────

function LeadsList({
  leads,
  selectedId,
  search,
  onSearch,
  onSelect,
}: {
  leads: LeadPreview[];
  selectedId: string | null;
  search: string;
  onSearch: (v: string) => void;
  onSelect: (id: string) => void;
}) {
  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (l.name ?? "").toLowerCase().includes(q) ||
      l.whatsapp.includes(q)
    );
  });

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      borderRight: "1px solid rgba(255,255,255,0.07)",
    }}>
      {/* Busca */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="🔍  Buscar nome ou número..."
          style={{
            width: "100%", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
            padding: "8px 12px", fontSize: 13, color: "var(--text)",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 && (
          <p style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Nenhuma conversa encontrada.
          </p>
        )}
        {filtered.map((lead) => {
          const last = lead.interactions[0];
          const active = selectedId === lead.id;
          return (
            <button
              key={lead.id}
              onClick={() => onSelect(lead.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", border: "none", cursor: "pointer", textAlign: "left",
                background: active ? "rgba(201,168,76,0.08)" : "transparent",
                borderLeft: active ? "3px solid #c9a84c" : "3px solid transparent",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                transition: "background 0.15s",
              }}
            >
              <Avatar name={lead.name} id={lead.id} size={42} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    {/* Score circular */}
                    {(() => {
                      const pct = Math.min(100, Math.round((lead.score / 200) * 100));
                      const color = lead.score >= 150 ? "#22c55e" : lead.score >= 80 ? "#f97316" : lead.score >= 30 ? "#3b82f6" : "#64748b";
                      return (
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                          background: `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.06) 0)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: "50%", background: active ? "rgba(201,168,76,0.08)" : "#0a0d12",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 7, fontWeight: 700, color,
                          }}>
                            {lead.score}
                          </div>
                        </div>
                      );
                    })()}
                    <span style={{ fontWeight: 600, fontSize: 14, color: active ? "#c9a84c" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lead.name ?? lead.whatsapp}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                    {last ? ago(last.createdAt) : ago(lead.updatedAt)}
                  </span>
                </div>
                <p style={{
                  fontSize: 12, color: "rgba(255,255,255,0.45)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0,
                }}>
                  {last
                    ? `${last.role === "jolie" ? "Jolie: " : ""}${last.content}`
                    : "Sem mensagens"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bolha de mensagem ────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Interaction }) {
  const isJolie = msg.role === "jolie";
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: isJolie ? "flex-end" : "flex-start",
      marginBottom: 4,
    }}>
      <div style={{
        maxWidth: "72%", padding: "9px 13px", borderRadius: isJolie ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        background: isJolie ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.07)",
        color: "var(--text)", fontSize: 13.5, lineHeight: 1.5,
        wordBreak: "break-word", whiteSpace: "pre-wrap",
      }}>
        {msg.content}
      </div>
      <span style={{
        fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 3,
        paddingLeft: isJolie ? 0 : 4, paddingRight: isJolie ? 4 : 0,
      }}>
        {fmtTime(msg.createdAt)}
        {isJolie && msg.aiEngine ? ` · ${msg.aiEngine.split("/")[0]}` : ""}
      </span>
    </div>
  );
}

// ─── Painel direito — conversa ────────────────────────────────────────────────

function ConversationPanel({
  lead,
  interactions,
  booking,
  onBack,
}: {
  lead: Lead;
  interactions: Interaction[];
  booking: Booking | null;
  onBack?: () => void;
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [isPending, startTransition] = useTransition();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [localStatus, setLocalStatus] = useState(lead.status);
  const [localInteractions, setLocalInteractions] = useState(interactions);

  // Rastreia se o usuário está perto do final da conversa
  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  // Auto-scroll só se o usuário estiver perto do final (não subiu para ler)
  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [localInteractions]);

  // Polling a cada 5s para novas mensagens
  useEffect(() => {
    setLocalInteractions(interactions);
    setLocalStatus(lead.status);
  }, [lead.id, interactions, lead.status]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/admin/conversas/${lead.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.interactions) setLocalInteractions(data.interactions);
      if (data.lead?.status) setLocalStatus(data.lead.status);
    }, 5000);
    return () => clearInterval(interval);
  }, [lead.id]);

  function handleStatusChange(status: string) {
    setLocalStatus(status);
    setShowStatusMenu(false);
    startTransition(() => updateLeadStatus(lead.id, status));
  }

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  function handleDelete() {
    setDeleteModalOpen(true);
  }

  function handleConfirmDelete() {
    startTransition(() => {
      deleteLeadFromConversas(lead.id);
      setDeleteModalOpen(false);
    });
  }

  const c = STATUS_COLORS[localStatus] ?? STATUS_COLORS.frio;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header */}
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        background: "rgba(10,13,18,0.8)", backdropFilter: "blur(8px)",
      }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: "none", border: "none", color: "var(--muted)", cursor: "pointer",
            fontSize: 18, padding: "0 4px", display: "flex", alignItems: "center",
          }}>←</button>
        )}
        <Avatar name={lead.name} id={lead.id} size={38} />

        {/* Score circular */}
        {(() => {
          const pct = Math.min(100, Math.round((lead.score / 200) * 100));
          const color = lead.score >= 150 ? "#22c55e" : lead.score >= 80 ? "#f97316" : lead.score >= 30 ? "#3b82f6" : "#64748b";
          return (
            <div style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              background: `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.06) 0)`,
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
            }}>
              <div style={{
                position: "absolute", inset: 4, borderRadius: "50%", background: "#0a0d12",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color,
              }}>
                {lead.score}
              </div>
            </div>
          );
        })()}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
              {lead.name ?? lead.whatsapp}
            </span>
          </div>
          {/* Progressão de status */}
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {["frio", "interessado", "quente", "pronto", "convertido"].map((s, i, arr) => {
              const sc = STATUS_COLORS[s];
              const idx = arr.indexOf(localStatus);
              const done = i <= idx;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <div title={STATUS_LABELS[s]} style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: done ? sc.dot : "rgba(255,255,255,0.1)",
                    transition: "background 0.3s",
                  }} />
                  {i < arr.length - 1 && (
                    <div style={{
                      width: 12, height: 1,
                      background: done && i < idx ? sc.dot : "rgba(255,255,255,0.08)",
                    }} />
                  )}
                </div>
              );
            })}
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>
              +{lead.whatsapp}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>

          {/* Status dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowStatusMenu((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 20, cursor: "pointer",
                background: c.bg, border: `1px solid ${c.dot}`, color: c.text,
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot }} />
              {STATUS_LABELS[localStatus] ?? localStatus}
              <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
            </button>
            {showStatusMenu && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                background: "#13161d", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, overflow: "hidden", minWidth: 150,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}>
                {STATUS_OPTIONS.map((s) => {
                  const sc = STATUS_COLORS[s];
                  return (
                    <button key={s} onClick={() => handleStatusChange(s)} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 14px", background: localStatus === s ? "rgba(255,255,255,0.05)" : "none",
                      border: "none", cursor: "pointer", color: sc.text, fontSize: 13,
                      fontWeight: localStatus === s ? 700 : 400, textAlign: "left",
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot }} />
                      {STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Abrir no WhatsApp */}
          <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" rel="noreferrer" title="Abrir no WhatsApp" style={{
            padding: "6px 10px", borderRadius: 8, fontSize: 16, textDecoration: "none",
            background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.2)",
          }}>
            💬
          </a>

          {/* Ver reserva */}
          {booking && (
            <Link href={`/admin/reservas/${booking.id}`} title="Ver reserva" style={{
              padding: "6px 10px", borderRadius: 8, fontSize: 16, textDecoration: "none",
              background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)",
            }}>
              📋
            </Link>
          )}

          {/* Excluir */}
          <button onClick={handleDelete} disabled={isPending} title="Excluir lead" style={{
            padding: "6px 10px", borderRadius: 8, fontSize: 16, cursor: isPending ? "wait" : "pointer",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            color: isPending ? "rgba(248,113,113,0.4)" : "#f87171",
          }}>
            🗑️
          </button>

          <DangerConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Excluir lead permanentemente"
            description={`Você está prestes a excluir ${lead.name ?? lead.whatsapp} e todo o histórico de conversas. Esta ação é irreversível.`}
            items={[
              `Lead: ${lead.name ?? lead.whatsapp}`,
              "Histórico completo de mensagens",
              "Eventos e interações registradas",
            ]}
            pending={isPending}
          />
        </div>
      </div>

      {/* Mensagens */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: "auto", padding: "16px 20px",
          display: "flex", flexDirection: "column", gap: 2,
          background: "rgba(0,0,0,0.15)",
        }}
        onClick={() => setShowStatusMenu(false)}
      >
        {localInteractions.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", color: "rgba(255,255,255,0.2)" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
            <p style={{ fontSize: 13 }}>Sem mensagens ainda</p>
          </div>
        )}

        {localInteractions.map((msg, i) => {
          const showDate =
            i === 0 ||
            new Date(msg.createdAt).toDateString() !==
              new Date(localInteractions[i - 1].createdAt).toDateString();

          return (
            <div key={msg.id}>
              {showDate && (
                <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
                  <span style={{
                    fontSize: 11, color: "rgba(255,255,255,0.3)",
                    background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 20,
                  }}>
                    {new Date(msg.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </span>
                </div>
              )}
              <MessageBubble msg={msg} />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ConversasClient({
  leads,
  selectedId,
  selectedLead,
  interactions,
  booking,
}: {
  leads: LeadPreview[];
  selectedId: string | null;
  selectedLead: Lead | null;
  interactions: Interaction[];
  booking: Booking | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">(
    selectedId ? "chat" : "list"
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (selectedId) setMobileView("chat");
  }, [selectedId]);

  function selectLead(id: string) {
    router.push(`/admin/conversas?id=${id}`);
    if (isMobile) setMobileView("chat");
  }

  function goBack() {
    setMobileView("list");
    router.push("/admin/conversas");
  }

  const showList = !isMobile || mobileView === "list";
  const showChat = !isMobile || mobileView === "chat";

  return (
    <div style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: "var(--bg)", color: "var(--text)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Topbar */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px",
        display: "flex", alignItems: "center", gap: 16, flexShrink: 0,
        background: "rgba(10,13,18,0.97)", backdropFilter: "blur(12px)",
        zIndex: 100,
      }}>
        <Link href="/admin/leads" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
          ← Leads
        </Link>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Conversas</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
          {leads.length} leads
        </span>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

        {/* Painel esquerdo */}
        {showList && (
          <div style={{ width: isMobile ? "100%" : 320, flexShrink: 0, height: "100%", overflow: "hidden" }}>
            <LeadsList
              leads={leads}
              selectedId={selectedId}
              search={search}
              onSearch={setSearch}
              onSelect={selectLead}
            />
          </div>
        )}

        {/* Divisor */}
        {!isMobile && (
          <div style={{ width: 1, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
        )}

        {/* Painel direito */}
        {showChat && (
          <div style={{ flex: 1, height: "100%", overflow: "hidden" }}>
            {selectedLead ? (
              <ConversationPanel
                lead={selectedLead}
                interactions={interactions}
                booking={booking}
                onBack={isMobile ? goBack : undefined}
              />
            ) : (
              <div style={{
                height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.2)",
              }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>💬</p>
                <p style={{ fontSize: 15, fontWeight: 600 }}>Selecione uma conversa</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>
                  Escolha um lead na lista à esquerda
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
