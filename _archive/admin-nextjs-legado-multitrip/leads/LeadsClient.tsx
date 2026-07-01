"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { deleteLead, updateLeadStatus, updateLeadDetails, createLead } from "./actions";

interface Interaction {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  aiEngine?: string;
}

interface LeadEvent {
  id: string;
  type: string;
  points: number;
  createdAt: string;
  meta?: any;
}

interface Lead {
  id: string;
  createdAt: string;
  updatedAt: string;
  whatsapp: string;
  name?: string;
  email?: string;
  origin?: string;
  destination?: string;
  travelDate?: string;
  passengers?: number;
  valueCents?: number;
  score: number;
  status: string;
  source: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  interactions: Interaction[];
  events: LeadEvent[];
}

interface Props {
  leads: Lead[];
  total: number;
  page: number;
  perPage: number;
  statusFilter?: string;
  statMap: Record<string, number>;
  convertedPhones: string[];
  monthlyStats: { month: string; count: number }[];
  totalAllLeads: number;
  sourceBreakdown: { source: string; count: number }[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  frio:        { bg: "rgba(100,116,139,0.08)", text: "#94a3b8", dot: "#64748b", border: "rgba(100,116,139,0.2)" },
  interessado: { bg: "rgba(59,130,246,0.08)",  text: "#60a5fa", dot: "#3b82f6", border: "rgba(59,130,246,0.2)" },
  quente:      { bg: "rgba(249,115,22,0.08)",  text: "#fb923c", dot: "#f97316", border: "rgba(249,115,22,0.2)" },
  pronto:      { bg: "rgba(34,197,94,0.08)",   text: "#4ade80", dot: "#22c55e", border: "rgba(34,197,94,0.2)" },
  convertido:  { bg: "rgba(201,168,76,0.08)",  text: "#c9a84c", dot: "#c9a84c", border: "rgba(201,168,76,0.2)" },
};

const STATUS_LABELS: Record<string, string> = {
  frio: "Frio",
  interessado: "Interessado",
  quente: "Quente",
  pronto: "Pronto",
  convertido: "Convertido",
};

const ALL_STATUSES = ["frio", "interessado", "quente", "pronto", "convertido"];

function brl(cents: number | null | undefined) {
  if (cents == null) return "R$ 0,00";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatUTM(val?: string) {
  if (!val) return "Direto / Orgânico";
  return val;
}

function formatSource(src: string) {
  if (src === "whatsapp_equipe") return "📞 WhatsApp Equipe (Rita e Eric)";
  if (src === "whatsapp") return "🤖 Assistente (WhatsApp)";
  if (src === "site") return "💻 Site Widget";
  if (src === "checkout") return "🛒 Checkout Site";
  if (src === "abandonment") return "⚠️ Abandono Checkout";
  return src;
}

function ago(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function LeadsClient({ leads, total, page, perPage, statusFilter, statMap, convertedPhones, monthlyStats, totalAllLeads, sourceBreakdown }: Props) {
  const convertedPhoneSet = new Set(convertedPhones);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);

  // States para novo lead
  const [newLeadWhatsApp, setNewLeadWhatsApp] = useState("");
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadOrigin, setNewLeadOrigin] = useState("");
  const [newLeadDestination, setNewLeadDestination] = useState("");
  const [newLeadTravelDate, setNewLeadTravelDate] = useState("");
  const [newLeadPassengers, setNewLeadPassengers] = useState("1");
  const [newLeadValueBRL, setNewLeadValueBRL] = useState("");
  const [newLeadSource, setNewLeadSource] = useState("whatsapp_equipe");
  const [newLeadError, setNewLeadError] = useState("");

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const totalPages = Math.ceil(total / perPage);
  const totalLeads = totalAllLeads;
  const hotLeads = (statMap["quente"] ?? 0) + (statMap["pronto"] ?? 0);
  // Conversão real: leads cujo telefone bate com agendamento confirmada
  const realConverted = leads.filter((l) => convertedPhoneSet.has(l.whatsapp.replace(/\D/g, ""))).length;
  // Para taxa geral usamos todos os leads
  const conversionRate = totalLeads > 0 ? Math.round((convertedPhones.length / totalLeads) * 100) : 0;

  function changeFilterStatus(s?: string) {
    const url = new URL(window.location.href);
    if (s) url.searchParams.set("status", s);
    else url.searchParams.delete("status");
    url.searchParams.set("page", "1");
    router.push(url.pathname + url.search);
  }

  // Ação de transição de estágio no Kanban
  async function handleMoveLead(leadId: string, currentStatus: string, direction: "prev" | "next") {
    const currentIndex = ALL_STATUSES.indexOf(currentStatus);
    let nextIndex = currentIndex + (direction === "next" ? 1 : -1);

    if (nextIndex >= 0 && nextIndex < ALL_STATUSES.length) {
      const nextStatus = ALL_STATUSES[nextIndex];
      startTransition(async () => {
        try {
          await updateLeadStatus(leadId, nextStatus);
          // Se o lead editado for o selecionado no Drawer, atualiza o estado local
          if (selectedLead && selectedLead.id === leadId) {
            setSelectedLead({ ...selectedLead, status: nextStatus });
          }
        } catch (err: any) {
          alert(err.message || "Erro ao atualizar status");
        }
      });
    }
  }

  // Criação de lead manual
  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setNewLeadError("");

    if (!newLeadWhatsApp) {
      setNewLeadError("O WhatsApp é obrigatório.");
      return;
    }

    startTransition(async () => {
      try {
        const valCents = newLeadValueBRL ? Math.round(parseFloat(newLeadValueBRL.replace(",", ".")) * 100) : undefined;
        await createLead({
          whatsapp: newLeadWhatsApp,
          name: newLeadName || undefined,
          email: newLeadEmail || undefined,
          origin: newLeadOrigin || undefined,
          destination: newLeadDestination || undefined,
          travelDate: newLeadTravelDate || undefined,
          passengers: newLeadPassengers ? parseInt(newLeadPassengers) : undefined,
          valueCents: valCents,
          source: newLeadSource,
        });

        // Reset forms
        setNewLeadWhatsApp("");
        setNewLeadName("");
        setNewLeadEmail("");
        setNewLeadOrigin("");
        setNewLeadDestination("");
        setNewLeadTravelDate("");
        setNewLeadPassengers("1");
        setNewLeadValueBRL("");
        setNewLeadSource("whatsapp_equipe");
        setShowNewLeadModal(false);
      } catch (err: any) {
        setNewLeadError(err.message || "Erro ao salvar lead.");
      }
    });
  }

  // Edição de detalhes do lead (Drawer)
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWhatsApp, setEditWhatsApp] = useState("");
  const [editOrigin, setEditOrigin] = useState("");
  const [editDestination, setEditDestination] = useState("");
  const [editTravelDate, setEditTravelDate] = useState("");
  const [editPassengers, setEditPassengers] = useState("1");
  const [editValueBRL, setEditValueBRL] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editUtmSource, setEditUtmSource] = useState("");
  const [editUtmMedium, setEditUtmMedium] = useState("");
  const [editUtmCampaign, setEditUtmCampaign] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (selectedLead) {
      setEditName(selectedLead.name || "");
      setEditEmail(selectedLead.email || "");
      setEditWhatsApp(selectedLead.whatsapp || "");
      setEditOrigin(selectedLead.origin || "");
      setEditDestination(selectedLead.destination || "");
      setEditTravelDate(selectedLead.travelDate ? new Date(selectedLead.travelDate).toISOString().split("T")[0] : "");
      setEditPassengers(selectedLead.passengers ? String(selectedLead.passengers) : "");
      setEditValueBRL(selectedLead.valueCents ? String(selectedLead.valueCents / 100) : "");
      setEditSource(selectedLead.source || "whatsapp_equipe");
      setEditUtmSource(selectedLead.utmSource || "");
      setEditUtmMedium(selectedLead.utmMedium || "");
      setEditUtmCampaign(selectedLead.utmCampaign || "");
      setSaveSuccess(false);
    }
  }, [selectedLead]);

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead) return;

    startTransition(async () => {
      try {
        const valCents = editValueBRL ? Math.round(parseFloat(editValueBRL.replace(",", ".")) * 100) : null;
        const payload = {
          name: editName || null,
          email: editEmail || null,
          whatsapp: editWhatsApp,
          origin: editOrigin || null,
          destination: editDestination || null,
          travelDate: editTravelDate || null,
          passengers: editPassengers ? parseInt(editPassengers) : null,
          valueCents: valCents,
          source: editSource,
          utmSource: editUtmSource || null,
          utmMedium: editUtmMedium || null,
          utmCampaign: editUtmCampaign || null,
        };

        await updateLeadDetails(selectedLead.id, payload);
        
        // Atualiza estado local para o Drawer refletir a alteração imediatamente
        setSelectedLead({
          ...selectedLead,
          ...payload,
          travelDate: editTravelDate ? new Date(editTravelDate).toISOString() : undefined,
          valueCents: valCents ?? undefined,
        } as any);

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err: any) {
        alert(err.message || "Erro ao salvar alterações.");
      }
    });
  }

  // Agrupamento de leads por status para o Kanban
  const kanbanGroups: Record<string, Lead[]> = {
    frio: [],
    interessado: [],
    quente: [],
    pronto: [],
    convertido: [],
  };

  // Se houver filtro de status ativo, exibe apenas os filtrados. Caso contrário, divide todos os carregados
  leads.forEach((l) => {
    if (kanbanGroups[l.status]) {
      kanbanGroups[l.status].push(l);
    }
  });

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", paddingBottom: 80, fontFamily: "inherit" }}>
      
      {/* Topbar */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(10,13,18,0.95)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
            ← Admin
          </Link>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Leads & Pipeline</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* View Mode Toggle */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: 2, display: "flex", gap: 2
          }}>
            <button
              onClick={() => {
                setViewMode("kanban");
                // Limpa o filtro de status da URL para carregar todas as colunas
                const url = new URL(window.location.href);
                url.searchParams.delete("status");
                router.push(url.pathname + url.search);
              }}
              style={{
                background: viewMode === "kanban" ? "rgba(201,168,76,0.15)" : "transparent",
                color: viewMode === "kanban" ? "#c9a84c" : "var(--muted)",
                border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12,
                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.2s"
              }}
            >
              📊 Quadro Funil
            </button>
            <button
              onClick={() => setViewMode("table")}
              style={{
                background: viewMode === "table" ? "rgba(201,168,76,0.15)" : "transparent",
                color: viewMode === "table" ? "#c9a84c" : "var(--muted)",
                border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12,
                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.2s"
              }}
            >
              📋 Tabela Lista
            </button>
          </div>

          {/* WhatsApp CRM Link */}
          <Link
            href="/admin/painel/whatsapp"
            style={{
              background: "rgba(34,197,94,0.07)",
              border: "1px solid rgba(34,197,94,0.2)",
              color: "#22c55e",
              borderRadius: 10, padding: "8px 16px", fontSize: 12,
              fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
              textDecoration: "none", transition: "all 0.2s",
            }}
          >
            💬 WhatsApp CRM
          </Link>

          {/* Novo Lead Button */}
          <button
            onClick={() => setShowNewLeadModal(true)}
            style={{
              background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
              color: "#c9a84c", borderRadius: 10, padding: "8px 16px", fontSize: 12,
              fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(201,168,76,0.05)"
            }}
          >
            + Novo Lead
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1250, margin: "0 auto", padding: isMobile ? "16px 12px" : "24px 24px" }}>

        {/* KPIs */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 10, marginBottom: 20,
        }}>
          {[
            { label: "Total Leads", value: totalLeads, color: "#fff", sub: "todos os períodos" },
            { label: "Quentes & Prontos", value: hotLeads, color: "#f97316", sub: "precisam de atenção" },
            { label: "Convertidos ✓", value: convertedPhones.length, color: "#c9a84c", sub: "agendamentos confirmadas" },
            { label: "Taxa de Conv.", value: `${conversionRate}%`, color: "#22c55e", sub: "leads → agendamento real" },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14, padding: "14px 16px", backdropFilter: "blur(4px)"
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 6 }}>
                {kpi.label}
              </p>
              <p style={{ fontSize: 24, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>
                {kpi.value}
              </p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 5 }}>
                {kpi.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Leads por Mês ── */}
        {monthlyStats.length > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: "14px 16px", marginBottom: 20,
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 12 }}>
              📅 Leads por Mês
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {monthlyStats.map(({ month, count }) => {
                const [year, m] = month.split("-");
                const label = new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
                const maxCount = Math.max(...monthlyStats.map((s) => s.count));
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 44 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{count}</span>
                    <div style={{
                      width: 36, height: 36,
                      background: `conic-gradient(#c9a84c ${pct}%, rgba(255,255,255,0.06) 0%)`,
                      borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--bg-card)" }} />
                    </div>
                    <span style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Origem dos Leads ── */}
        {sourceBreakdown.length > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: "14px 16px", marginBottom: 20,
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 12 }}>
              📡 Origem dos Leads
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sourceBreakdown.map(({ source, count }) => {
                const icon =
                  source.includes("facebook") || source.includes("instagram") || source.includes("whatsapp_ad") ? "📱" :
                  source.includes("google") ? "🔍" :
                  source.includes("checkout") || source.includes("site") ? "💻" :
                  source.includes("whatsapp") ? "🤖" :
                  source.includes("equipe") ? "📞" :
                  source.includes("indica") ? "🤝" : "📌";
                const label = source
                  .replace("whatsapp_equipe", "WhatsApp Equipe")
                  .replace("whatsapp_ad", "Meta Ads → WA")
                  .replace("whatsapp", "Assistente (WA)")
                  .replace("checkout", "Checkout Site")
                  .replace("site", "Site")
                  .replace("abandonment", "Abandono");
                return (
                  <div key={source} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 20, fontSize: 12,
                  }}>
                    <span>{icon}</span>
                    <span style={{ color: "var(--muted)" }}>{label}</span>
                    <span style={{ fontWeight: 700, color: "#fff" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pipeline Filtros Rápidos (Tabela) */}
        {viewMode === "table" && (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: "12px 14px", marginBottom: 20,
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)",
              gap: 8,
            }}>
              {ALL_STATUSES.map((s) => {
                const count = statMap[s] ?? 0;
                const colors = STATUS_COLORS[s];
                const active = statusFilter === s;
                return (
                  <button key={s} onClick={() => changeFilterStatus(active ? undefined : s)} style={{
                    padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                    background: active ? colors.bg : "rgba(255,255,255,0.01)",
                    border: `1px solid ${active ? colors.dot : "rgba(255,255,255,0.04)"}`,
                    transition: "all 0.2s",
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors.dot, margin: "0 auto 5px" }} />
                    <p style={{ fontSize: 16, fontWeight: 800, color: active ? colors.text : "#fff", margin: "0 0 2px" }}>{count}</p>
                    <p style={{ fontSize: 9, color: active ? colors.text : "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {STATUS_LABELS[s]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Link para Conversas Rápido */}
        <Link
          href="/admin/conversas"
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", borderRadius: 14,
            background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)",
            textDecoration: "none", transition: "all 0.2s",
            marginBottom: 20,
          }}
        >
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#c9a84c", marginBottom: 2 }}>
              💬 Ver Histórico de Conversas da Assistente
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              Acesse a tela de chat interativo da IA com os leads e clientes
            </p>
          </div>
          <span style={{ fontSize: 18, color: "rgba(201,168,76,0.4)" }}>→</span>
        </Link>

        {/* ── MODO KANBAN BOARD ── */}
        {viewMode === "kanban" && (
          <div 
            className="kanban-scroll-container"
            style={{
              width: "100%",
              overflowX: "auto",
              paddingBottom: 16,
              marginTop: 10
            }}
          >
            <style>{`
              .kanban-scroll-container::-webkit-scrollbar {
                height: 8px;
              }
              .kanban-scroll-container::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.02);
                border-radius: 4px;
              }
              .kanban-scroll-container::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.12);
                border-radius: 4px;
              }
              .kanban-scroll-container::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.22);
              }
            `}</style>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(190px, 1fr))",
              gap: 12,
              alignItems: "start",
            }}>
            {ALL_STATUSES.map((statusKey) => {
              const groupLeads = kanbanGroups[statusKey] || [];
              const colors = STATUS_COLORS[statusKey];
              const totalEstCents = groupLeads.reduce((acc, current) => acc + (current.valueCents || 0), 0);

              return (
                <div
                  key={statusKey}
                  style={{
                    background: "rgba(255,255,255,0.01)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: 10,
                    minHeight: isMobile ? "auto" : 450,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  {/* Col Header */}
                  <div style={{
                    paddingBottom: 8,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: colors.text,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.dot }} />
                        {STATUS_LABELS[statusKey]}
                      </span>
                      <span style={{
                        fontSize: 11,
                        background: "rgba(255,255,255,0.05)",
                        padding: "2px 6px",
                        borderRadius: 10,
                        fontWeight: 700,
                        color: "var(--muted)",
                      }}>
                        {groupLeads.length}
                      </span>
                    </div>
                    {totalEstCents > 0 && (
                      <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
                        Total: <strong style={{ color: "#fff" }}>{brl(totalEstCents)}</strong>
                      </span>
                    )}
                  </div>

                  {/* Cards container */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    maxHeight: isMobile ? 300 : "none",
                    overflowY: isMobile ? "auto" : "visible",
                    width: "100%",
                    minWidth: 0,
                  }}>
                    {groupLeads.length === 0 ? (
                      <div style={{
                        padding: "24px 10px",
                        textAlign: "center",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.15)",
                        border: "1px dashed rgba(255,255,255,0.04)",
                        borderRadius: 10,
                      }}>
                        Vazio
                      </div>
                    ) : (
                      groupLeads.map((lead) => {
                        const lastMsg = lead.interactions[0];
                        return (
                          <div
                            key={lead.id}
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: 10,
                              padding: "10px 12px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              width: "100%",
                              minWidth: 0,
                            }}
                            onClick={() => setSelectedLead(lead)}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>
                                {lead.name || "Sem Nome"}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                {convertedPhoneSet.has(lead.whatsapp.replace(/\D/g, "")) && (
                                  <span style={{
                                    fontSize: 8, fontWeight: 800, color: "#22c55e",
                                    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                                    padding: "1px 5px", borderRadius: 4, whiteSpace: "nowrap",
                                  }}>
                                    ✓ AGENDAMENTO
                                  </span>
                                )}
                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>★ {lead.score}</span>
                              </div>
                            </div>

                            <span style={{ fontSize: 11, color: "var(--muted)" }}>
                              +{lead.whatsapp}
                            </span>

                            {/* Detalhe de Atendimento e Preço */}
                            {(lead.origin || lead.valueCents) && (
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                                {lead.origin && (
                                  <span style={{
                                    fontSize: 9, background: "rgba(255,255,255,0.05)",
                                    padding: "2px 6px", borderRadius: 4, color: "rgba(255,255,255,0.6)"
                                  }}>
                                    📍 {lead.origin.slice(0, 15)}
                                  </span>
                                )}
                                {lead.valueCents && (
                                  <span style={{
                                    fontSize: 9, background: "rgba(201,168,76,0.1)",
                                    border: "1px solid rgba(201,168,76,0.2)",
                                    padding: "2px 6px", borderRadius: 4, color: "#c9a84c", fontWeight: 700
                                  }}>
                                    {brl(lead.valueCents)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Snippet da mensagem */}
                            {lastMsg && (
                              <p style={{
                                fontSize: 10,
                                color: "rgba(255,255,255,0.4)",
                                background: "rgba(255,255,255,0.02)",
                                padding: "4px 8px",
                                borderRadius: 6,
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                marginTop: 2,
                                width: "100%",
                              }}>
                                <strong style={{ color: lastMsg.role === "assistente" ? "#c9a84c" : "#3b82f6" }}>
                                  {lastMsg.role === "assistente" ? "Assistente" : "Cliente"}:
                                </strong>{" "}
                                {lastMsg.content.slice(0, 80)}{lastMsg.content.length > 80 ? "..." : ""}
                              </p>
                            )}

                            {/* Controles de Ação no Rodapé do Card */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: 4,
                                borderTop: "1px solid rgba(255,255,255,0.04)",
                                paddingTop: 6,
                              }}
                              onClick={(e) => e.stopPropagation()} // Evita abrir o drawer ao clicar nos botões do rodapé
                            >
                              {/* Setas de estágio do Funil */}
                              <div style={{ display: "flex", gap: 4 }}>
                                <button
                                  disabled={statusKey === "frio"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveLead(lead.id, lead.status, "prev");
                                  }}
                                  style={{
                                    border: "none", background: "rgba(255,255,255,0.04)", color: "#fff",
                                    width: 22, height: 22, borderRadius: 6, fontSize: 10, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                  }}
                                  title="Voltar etapa"
                                >
                                  ◀
                                </button>
                                <button
                                  disabled={statusKey === "convertido"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveLead(lead.id, lead.status, "next");
                                  }}
                                  style={{
                                    border: "none", background: "rgba(255,255,255,0.04)", color: "#fff",
                                    width: 22, height: 22, borderRadius: 6, fontSize: 10, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                  }}
                                  title="Avançar etapa"
                                >
                                  ▶
                                </button>
                              </div>

                              {/* Ações Rápidas */}
                              <div style={{ display: "flex", gap: 4 }}>
                                <a
                                  href={`https://wa.me/${lead.whatsapp}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    padding: "4px 8px", background: "rgba(37,211,102,0.1)",
                                    border: "1px solid rgba(37,211,102,0.2)", borderRadius: 6,
                                    fontSize: 9, color: "#25d366", textDecoration: "none", fontWeight: 700,
                                  }}
                                >
                                  Whats
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

        {/* ── MODO TABELA LISTA ── */}
        {viewMode === "table" && (
          <div style={{ marginTop: 10 }}>
            {leads.length === 0 ? (
              <div style={{
                background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "40px 24px", textAlign: "center", color: "var(--muted)"
              }}>
                <p style={{ fontSize: 14 }}>Nenhum lead encontrado.</p>
              </div>
            ) : isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {leads.map((lead) => {
                  const last = lead.interactions[0];
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      style={{
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10,
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                            {lead.name ?? "Sem Nome"}
                          </span>
                          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>+{lead.whatsapp}</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "3px 8px", borderRadius: 20,
                            background: STATUS_COLORS[lead.status].bg, color: STATUS_COLORS[lead.status].text,
                            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLORS[lead.status].dot }} />
                            {STATUS_LABELS[lead.status] ?? lead.status}
                          </span>
                          {convertedPhoneSet.has(lead.whatsapp.replace(/\D/g, "")) && (
                            <span style={{
                              fontSize: 9, fontWeight: 800, color: "#22c55e",
                              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                              padding: "2px 7px", borderRadius: 4,
                            }}>
                              ✓ Agendamento
                            </span>
                          )}
                        </div>
                      </div>

                      {last && (
                        <div style={{
                          background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "8px 12px",
                          borderLeft: `3px solid ${last.role === "assistente" ? "#c9a84c" : "#3b82f6"}`,
                        }}>
                          <p style={{ fontSize: 12, color: last.role === "assistente" ? "#c9a84c" : "rgba(255,255,255,0.75)", marginBottom: 2 }}>
                            <strong>{last.role === "assistente" ? "Assistente" : "Cliente"}:</strong> {last.content.slice(0, 100)}...
                          </p>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {lead.valueCents ? (
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c" }}>{brl(lead.valueCents)}</span>
                          ) : (
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Sem valor</span>
                          )}
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>· score {lead.score}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => setSelectedLead(lead)}
                            style={{
                              padding: "6px 10px", background: "rgba(201,168,76,0.1)",
                              border: "1px solid rgba(201,168,76,0.25)", borderRadius: 8,
                              fontSize: 11, color: "#c9a84c", fontWeight: 600, cursor: "pointer"
                            }}
                          >
                            Detalhes
                          </button>
                          <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" rel="noreferrer" style={{
                            padding: "6px 10px", background: "rgba(37,211,102,0.1)",
                            border: "1px solid rgba(37,211,102,0.2)", borderRadius: 8,
                            fontSize: 11, color: "#25d366", textDecoration: "none", fontWeight: 600,
                          }}>
                            Whats
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, overflow: "hidden"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
                      <th style={{ padding: "12px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)" }}>Lead</th>
                      <th style={{ padding: "12px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)" }}>Origem & Atendimento</th>
                      <th style={{ padding: "12px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)" }}>Última Interação</th>
                      <th style={{ padding: "12px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)" }}>Status</th>
                      <th style={{ padding: "12px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", textAlign: "right" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => {
                      const lastInteraction = lead.interactions[0];
                      const colors = STATUS_COLORS[lead.status];
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "background 0.2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.01)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "16px" }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
                              {lead.name || "Sem Nome"}
                            </span>
                            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>+{lead.whatsapp}</p>
                            <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>Criado: {new Date(lead.createdAt).toLocaleDateString("pt-BR")}</p>
                          </td>

                          <td style={{ padding: "16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ fontSize: 11, fontWeight: 600 }}>⭐ Score: {lead.score}</span>
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>Origem: {formatSource(lead.source)}</span>
                              {lead.origin && (
                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Atendimento: {lead.origin} ➔ {lead.destination || "?"}</span>
                              )}
                              {lead.valueCents && (
                                <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700 }}>{brl(lead.valueCents)}</span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: "16px", maxWidth: 280 }}>
                            {lastInteraction ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  <strong style={{ color: lastInteraction.role === "assistente" ? "#c9a84c" : "#3b82f6" }}>
                                    {lastInteraction.role === "assistente" ? "Assistente" : "Cliente"}:
                                  </strong>{" "}
                                  {lastInteraction.content}
                                </p>
                                <span style={{ fontSize: 10, color: "var(--muted)" }}>{ago(lastInteraction.createdAt)}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Sem interações</span>
                            )}
                          </td>

                          <td style={{ padding: "16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "3px 8px", borderRadius: 20,
                                background: colors.bg, color: colors.text,
                                fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                                width: "fit-content",
                              }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: colors.dot }} />
                                {STATUS_LABELS[lead.status] ?? lead.status}
                              </span>
                              {convertedPhoneSet.has(lead.whatsapp.replace(/\D/g, "")) && (
                                <span style={{
                                  fontSize: 9, fontWeight: 800, color: "#22c55e",
                                  background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                                  padding: "2px 7px", borderRadius: 4, width: "fit-content",
                                }}>
                                  ✓ Agendamento Confirmada
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: "16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                              <button
                                onClick={() => setSelectedLead(lead)}
                                style={{
                                  padding: "6px 12px", background: "rgba(201,168,76,0.1)",
                                  border: "1px solid rgba(201,168,76,0.25)", borderRadius: 8,
                                  fontSize: 12, color: "#c9a84c", fontWeight: 600, cursor: "pointer"
                                }}
                              >
                                Detalhes
                              </button>
                              <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" rel="noreferrer" style={{
                                padding: "6px 12px", background: "rgba(37,211,102,0.1)",
                                border: "1px solid rgba(37,211,102,0.2)", borderRadius: 8,
                                fontSize: 12, color: "#25d366", textDecoration: "none", fontWeight: 600,
                              }}>
                                Whats
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 24 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set("page", String(page - 1));
                    router.push(url.pathname + url.search);
                  }}
                  style={{
                    padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)", color: page <= 1 ? "var(--muted)" : "var(--text)",
                    cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600
                  }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  Página {page} de {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set("page", String(page + 1));
                    router.push(url.pathname + url.search);
                  }}
                  style={{
                    padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)", color: page >= totalPages ? "var(--muted)" : "var(--text)",
                    cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600
                  }}
                >
                  Próximo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── SLIDING DRAWER: DETALHES E EDIÇÃO DO LEAD ─── */}
      {selectedLead && (
        <>
          {/* Backdrop blur overlay */}
          <div
            onClick={() => setSelectedLead(null)}
            style={{
              position: "fixed", top: 0, left: 0, width: "100dvw", height: "100dvh",
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 900
            }}
          />

          {/* Drawer container */}
          <div style={{
            position: "fixed", top: 0, right: 0, width: "100%", maxWidth: 460, height: "100dvh",
            background: "rgba(10,13,18,0.98)", borderLeft: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", flexDirection: "column",
            overflowY: "auto", transition: "transform 0.3s ease-in-out"
          }}>
            {/* Header Drawer */}
            <div style={{
              padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "rgba(255,255,255,0.01)"
            }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>
                  Detalhes do Lead
                </h3>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>ID: #{selectedLead.id}</span>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                style={{
                  border: "none", background: "rgba(255,255,255,0.05)", color: "#fff",
                  width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 14
                }}
              >
                ✕
              </button>
            </div>

            {/* Content Drawer */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
              
              {/* Informações Básicas Rápidas */}
              <div style={{
                background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c" }}>
                    ⭐ Score: {selectedLead.score}
                  </span>
                  <span style={{
                    fontSize: 10, background: STATUS_COLORS[selectedLead.status].bg,
                    color: STATUS_COLORS[selectedLead.status].text, padding: "3px 8px",
                    borderRadius: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em"
                  }}>
                    {STATUS_LABELS[selectedLead.status]}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <Link
                    href={`/admin/conversas?id=${selectedLead.id}`}
                    style={{
                      flex: 1, padding: "8px 12px", background: "#c9a84c", color: "#000",
                      borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none",
                      textAlign: "center", transition: "all 0.2s"
                    }}
                  >
                    💬 Abrir Conversa Assistente
                  </Link>
                  <a
                    href={`https://wa.me/${selectedLead.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1, padding: "8px 12px", background: "rgba(37,211,102,0.1)",
                      border: "1px solid rgba(37,211,102,0.3)", color: "#25d366",
                      borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none",
                      textAlign: "center", transition: "all 0.2s"
                    }}
                  >
                    🟢 WhatsApp Direto
                  </a>
                </div>
              </div>

              {/* Formulário de Edição */}
              <form onSubmit={handleSaveDetails} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", margin: "4px 0 0 0" }}>
                  Editar Cadastro Local
                </h4>

                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Nome do Lead</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>WhatsApp (Apenas números)</label>
                    <input
                      type="text"
                      value={editWhatsApp}
                      onChange={(e) => setEditWhatsApp(e.target.value)}
                      required
                      style={{
                        width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>E-mail</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                      }}
                    />
                  </div>
                </div>

                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", margin: "14px 0 0 0" }}>
                  Informações da Atendimento
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Partida / Origem</label>
                    <input
                      type="text"
                      value={editOrigin}
                      onChange={(e) => setEditOrigin(e.target.value)}
                      placeholder="Ex: Aeroporto POA"
                      style={{
                        width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Destino</label>
                    <input
                      type="text"
                      value={editDestination}
                      onChange={(e) => setEditDestination(e.target.value)}
                      placeholder="Ex: Endereço de referência"
                      style={{
                        width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Data da Atendimento</label>
                    <input
                      type="date"
                      value={editTravelDate}
                      onChange={(e) => setEditTravelDate(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Clientes</label>
                    <input
                      type="number"
                      min="1"
                      value={editPassengers}
                      onChange={(e) => setEditPassengers(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Valor Estimado (R$)</label>
                    <input
                      type="text"
                      placeholder="Ex: 499.80"
                      value={editValueBRL}
                      onChange={(e) => setEditValueBRL(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Canal de Entrada</label>
                    <select
                      value={editSource}
                      onChange={(e) => setEditSource(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 12px", background: "rgba(10,13,18,0.95)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                      }}
                    >
                      <option value="whatsapp">🤖 Assistente (WhatsApp)</option>
                      <option value="whatsapp_equipe">📞 WhatsApp Equipe (Rita e Eric)</option>
                      <option value="site">💻 Site Widget</option>
                      <option value="checkout">🛒 Checkout Site</option>
                      <option value="abandonment">⚠️ Abandono Checkout</option>
                    </select>
                  </div>
                </div>

                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", margin: "14px 0 0 0" }}>
                  Métricas de Anúncios / UTMs
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 9, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>Origem (utm_source)</label>
                    <input
                      type="text"
                      value={editUtmSource}
                      onChange={(e) => setEditUtmSource(e.target.value)}
                      placeholder="Ex: facebook"
                      style={{
                        width: "100%", padding: "8px", background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#fff", fontSize: 11
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 9, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>Canal (utm_medium)</label>
                    <input
                      type="text"
                      value={editUtmMedium}
                      onChange={(e) => setEditUtmMedium(e.target.value)}
                      placeholder="Ex: cpc"
                      style={{
                        width: "100%", padding: "8px", background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#fff", fontSize: 11
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 9, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>Campanha (utm_campaign)</label>
                    <input
                      type="text"
                      value={editUtmCampaign}
                      onChange={(e) => setEditUtmCampaign(e.target.value)}
                      placeholder="Ex: campanha-natal"
                      style={{
                        width: "100%", padding: "8px", background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#fff", fontSize: 11
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button
                    type="submit"
                    disabled={isPending}
                    style={{
                      flex: 1, padding: "12px", background: "rgba(201,168,76,0.15)",
                      border: "1px solid #c9a84c", color: "#c9a84c", borderRadius: 10,
                      fontSize: 13, fontWeight: 700, cursor: isPending ? "wait" : "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {isPending ? "Salvando..." : "✓ Salvar Alterações"}
                  </button>
                </div>
                {saveSuccess && (
                  <p style={{ fontSize: 12, color: "#22c55e", textAlign: "center", fontWeight: 700, margin: 0 }}>
                    Dados locais salvos com sucesso!
                  </p>
                )}
              </form>

              {/* Timeline de Eventos Comportamentais */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 12 }}>
                  Rastreamento Comportamental
                </h4>
                
                {selectedLead.events && selectedLead.events.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedLead.events.map((evt) => (
                      <div
                        key={evt.id}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.04)",
                          borderRadius: 8,
                          padding: "8px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>
                            ⚙️ {evt.type === "page_view" ? "Visualizou página" : 
                               evt.type === "whatsapp_click" ? "Clicou no WhatsApp" :
                               evt.type === "quote_request" ? "Solicitou Cotação" :
                               evt.type === "checkout_start" ? "Iniciou Checkout" :
                               evt.type === "purchase" ? "Compra Concluída" :
                               evt.type === "response" ? "Respondeu à Assistente" : evt.type}
                          </p>
                          <span style={{ fontSize: 10, color: "var(--muted)" }}>
                            {new Date(evt.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: evt.points > 0 ? "#22c55e" : "var(--muted)"
                        }}>
                          {evt.points > 0 ? `+${evt.points} pts` : "0 pts"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
                    Nenhum evento registrado ainda.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── MODAL: CADASTRAR NOVO LEAD MANUALMENTE ─── */}
      {showNewLeadModal && (
        <>
          <div
            onClick={() => setShowNewLeadModal(false)}
            style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 1100
            }}
          />

          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: "90%", maxWidth: 500, background: "rgba(10,13,18,0.98)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18,
            boxShadow: "0 20px 50px rgba(0,0,0,0.8)", zIndex: 1200, display: "flex", flexDirection: "column",
            overflow: "hidden"
          }}>
            {/* Header Modal */}
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "rgba(255,255,255,0.01)"
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>
                ➕ Cadastrar Novo Lead Manual
              </h3>
              <button
                onClick={() => setShowNewLeadModal(false)}
                style={{
                  border: "none", background: "rgba(255,255,255,0.05)", color: "#fff",
                  width: 28, height: 28, borderRadius: "50%", cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleCreateLead} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {newLeadError && (
                <div style={{
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171", padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600
                }}>
                  ⚠️ {newLeadError}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>WhatsApp (Obrigatório — apenas números)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 5551986876557"
                  value={newLeadWhatsApp}
                  onChange={(e) => setNewLeadWhatsApp(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>E-mail</label>
                  <input
                    type="email"
                    placeholder="email@cliente.com"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Partida / Origem</label>
                  <input
                    type="text"
                    placeholder="Ex: Aeroporto POA"
                    value={newLeadOrigin}
                    onChange={(e) => setNewLeadOrigin(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Destino</label>
                  <input
                    type="text"
                    placeholder="Ex: Endereço de referência"
                    value={newLeadDestination}
                    onChange={(e) => setNewLeadDestination(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Data da Atendimento</label>
                  <input
                    type="date"
                    value={newLeadTravelDate}
                    onChange={(e) => setNewLeadTravelDate(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Clientes</label>
                  <input
                    type="number"
                    min="1"
                    value={newLeadPassengers}
                    onChange={(e) => setNewLeadPassengers(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Valor Estimado (R$)</label>
                  <input
                    type="text"
                    placeholder="Ex: 499.80"
                    value={newLeadValueBRL}
                    onChange={(e) => setNewLeadValueBRL(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>Origem do Lead</label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", background: "rgba(10,13,18,0.95)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13
                    }}
                  >
                    <option value="whatsapp_equipe">📞 WhatsApp Equipe (Rita e Eric)</option>
                    <option value="indicação">🤝 Indicação / Parceria</option>
                    <option value="whatsapp">🤖 Assistente (WhatsApp)</option>
                    <option value="site">💻 Site Widget</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    flex: 1, padding: "12px", background: "#c9a84c", color: "#000",
                    borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isPending ? "wait" : "pointer",
                    border: "none", transition: "all 0.2s"
                  }}
                >
                  {isPending ? "Cadastrando..." : "✓ Cadastrar Lead"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
