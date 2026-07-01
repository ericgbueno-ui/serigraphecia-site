"use client";

import { useState, useEffect, useCallback } from "react";

// ── Tipos ──────────────────────────────────────────────────────────────────

type FunilStage = { stage: string; count: number };
type CanalItem = { canal: string; count: number };
type UtmItem = { source: string; count: number };
type TimelinePoint = { date: string; leads: number; agendamentos: number };

type AnalyticsData = {
  period: number;
  kpis: {
    leads: { total: number; periodo: number; hoje: number };
    agendamentos: {
      confirmadas: number;
      periodo: number;
      faturamentoTotal: number;
      faturamentoPeriodo: number;
    };
    clientes: { total: number };
    taxaConversao: number;
    taxaAbandono: number;
    ticketMedio: number;
    noShow: { periodo: number; outCancelados: number; taxa: number };
  };
  funil: FunilStage[];
  canais: CanalItem[];
  utms: UtmItem[];
  metaAds: {
    spend: number;
    clicks: number;
    impressions: number;
    reach: number;
    cpc: number;
    cpl: number;
    ctr: number;
    cpm: number;
    cpa: number;
    cac: number;
    roas: number;
    roi: number;
    cbr: number;
    aov: number;
    ltv: number;
    leads: number;
    faturamento: number;
    conversoes: number;
    bookings: Array<{
      id: string;
      createdAt: string;
      totalCents: number;
      routeLabel: string | null;
      customerName: string;
      customerPhone: string;
      originType: string;
    }>;
  };
  followups: { d1: number; d3: number; d7: number; r30: number; r60: number; r90: number };
  timeline: TimelinePoint[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}
function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}
function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

// ── Micro-componentes ──────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color = "var(--gold)",
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: highlight ? "rgba(180,140,60,0.07)" : "var(--bg-card)",
        border: `1px solid ${highlight ? "var(--gold-line)" : "var(--border)"}`,
        borderRadius: "14px",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: "var(--muted)",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: "26px", fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      {sub && (
        <span style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{sub}</span>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        color: "var(--muted)",
        marginBottom: "14px",
      }}
    >
      {children}
    </h2>
  );
}

// ── Funil visual ──────────────────────────────────────────────────────────

function Funil({ stages }: { stages: FunilStage[] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  const colors = ["#b48c3c", "#c9a44d", "#d4b05e", "#e0bc6f", "#4ade80"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {stages.map((s, i) => {
        const pctWidth = (s.count / max) * 100;
        const dropoff =
          i > 0 && stages[i - 1].count > 0
            ? ((stages[i - 1].count - s.count) / stages[i - 1].count) * 100
            : null;
        return (
          <div key={s.stage}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "var(--text)" }}>{s.stage}</span>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {dropoff !== null && dropoff > 0 && (
                  <span style={{ fontSize: "10px", color: "#f87171" }}>
                    ↓ {dropoff.toFixed(0)}%
                  </span>
                )}
                <span style={{ fontWeight: 600, color: "var(--text)" }}>{fmt(s.count)}</span>
              </div>
            </div>
            <div
              style={{
                height: "8px",
                background: "var(--border)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pctWidth}%`,
                  background: colors[i] ?? "var(--gold)",
                  borderRadius: "4px",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Timeline SVG ──────────────────────────────────────────────────────────

function TimelineChart({ data }: { data: TimelinePoint[] }) {
  const W = 600;
  const H = 120;
  const PAD = { top: 8, right: 8, bottom: 24, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxLeads = Math.max(...data.map((d) => d.leads), 1);
  const maxRes = Math.max(...data.map((d) => d.agendamentos), 1);
  const maxY = Math.max(maxLeads, maxRes, 1);

  const n = data.length;
  if (n < 2) return null;

  function xPos(i: number) {
    return PAD.left + (i / (n - 1)) * chartW;
  }
  function yPos(v: number) {
    return PAD.top + chartH - (v / maxY) * chartH;
  }

  const leadsPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(d.leads).toFixed(1)}`)
    .join(" ");
  const resPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(d.agendamentos).toFixed(1)}`)
    .join(" ");

  // Eixo X — mostra apenas ~6 labels espaçados
  const step = Math.max(1, Math.floor(n / 6));
  const xLabels = data.filter((_, i) => i % step === 0 || i === n - 1);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", maxWidth: W, height: "auto", display: "block" }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD.top + t * chartH;
          const val = Math.round(maxY * (1 - t));
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="var(--border)"
                strokeWidth="0.5"
              />
              <text
                x={PAD.left - 4}
                y={y + 3}
                textAnchor="end"
                fontSize="8"
                fill="var(--muted)"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {xLabels.map((d) => {
          const i = data.indexOf(d);
          return (
            <text
              key={d.date}
              x={xPos(i)}
              y={H - 4}
              textAnchor="middle"
              fontSize="8"
              fill="var(--muted)"
            >
              {fmtDate(d.date)}
            </text>
          );
        })}

        {/* Leads line */}
        <path d={leadsPath} fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinejoin="round" />
        {/* Agendamentos line */}
        <path d={resPath} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinejoin="round" />

        {/* Dots leads */}
        {data.map((d, i) => (
          <circle key={`l${i}`} cx={xPos(i)} cy={yPos(d.leads)} r="2.5" fill="var(--gold)" />
        ))}
        {/* Dots agendamentos */}
        {data.map((d, i) => (
          <circle key={`r${i}`} cx={xPos(i)} cy={yPos(d.agendamentos)} r="2.5" fill="#4ade80" />
        ))}
      </svg>

      {/* Legenda */}
      <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--muted)" }}>
          <span style={{ width: 20, height: 2, background: "var(--gold)", display: "inline-block", borderRadius: 1 }} />
          Leads
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--muted)" }}>
          <span style={{ width: 20, height: 2, background: "#4ade80", display: "inline-block", borderRadius: 1 }} />
          Contratos confirmados
        </div>
      </div>
    </div>
  );
}

// ── Canais ────────────────────────────────────────────────────────────────

function BarList({ items, label }: { items: { name: string; count: number }[]; label: string }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--muted)",
          marginBottom: "10px",
        }}
      >
        <span>{label}</span>
        <span>Total</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((item) => (
          <div key={item.name}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "var(--text)" }}>{item.name}</span>
              <span style={{ fontWeight: 600, color: "var(--gold)" }}>{fmt(item.count)}</span>
            </div>
            <div
              style={{
                height: "5px",
                background: "var(--border)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(item.count / max) * 100}%`,
                  background: "var(--gold)",
                  borderRadius: "3px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Diagnóstico Inteligente ────────────────────────────────────────────────

type DiagItem = {
  level: "critico" | "atencao" | "oportunidade";
  titulo: string;
  descricao: string;
  acao: string;
};

function buildDiagnostico(data: AnalyticsData): DiagItem[] {
  const items: DiagItem[] = [];
  const m = data.metaAds;
  const k = data.kpis;

  // Funil zerado mas há conversões → tracking quebrado
  const funilTotal = data.funil.slice(0, -1).reduce((s, f) => s + f.count, 0);
  const temCompras = data.funil.find((f) => f.stage === "Compra Finalizada")?.count ?? 0;
  if (funilTotal === 0 && temCompras > 0) {
    items.push({
      level: "critico",
      titulo: "Tracking do funil não está registrando",
      descricao: `${temCompras} vendas confirmadas mas nenhum evento (visita, clique, checkout) foi capturado no período.`,
      acao: "Verificar se o pixel/GA está disparando os eventos customizados no site. Abrir DevTools → Network e testar cada etapa do funil.",
    });
  }

  // ROAS crítico
  if (m.spend > 0 && m.roas < 1) {
    items.push({
      level: "critico",
      titulo: "Meta Ads com prejuízo",
      descricao: `ROAS ${m.roas.toFixed(2)}x — cada R$1 investido retorna menos de R$1.`,
      acao: "Pausar campanhas com CPA acima do ticket médio. Revisar segmentação e criativo imediatamente.",
    });
  }

  // CTR abaixo de 1%
  if (m.spend > 0 && m.ctr < 0.01) {
    items.push({
      level: "atencao",
      titulo: `CTR baixo (${(m.ctr * 100).toFixed(2)}%) — criativo fraco`,
      descricao: "Menos de 1% das pessoas que viram o anúncio clicaram. A mensagem não está gerando interesse.",
      acao: "Testar novo criativo: vídeo curto mostrando a experiência real + depoimento de cliente. Meta boa: CTR > 2%.",
    });
  }

  // CPL alto (acima de R$120)
  if (m.spend > 0 && m.cpl > 120) {
    items.push({
      level: "atencao",
      titulo: `Custo por lead alto (R$${m.cpl.toFixed(2)})`,
      descricao: "Cada lead gerado pelo Meta Ads está custando mais do que o benchmark do setor.",
      acao: "Afunilar o público — excluir quem já converteu, testar lookalike 1% baseado nos melhores clientes.",
    });
  }

  // Taxa de abandono alta
  if (k.taxaAbandono > 0.5) {
    items.push({
      level: "atencao",
      titulo: `${(k.taxaAbandono * 100).toFixed(0)}% de abandono no checkout`,
      descricao: "Mais da metade das pessoas que iniciaram o checkout não finalizaram.",
      acao: "Simplificar formulário de checkout. Adicionar prova social (avaliações) próximo ao botão de compra. Criar automação de recuperação de carrinho.",
    });
  }

  // Taxa de conversão de leads muito baixa
  if (k.taxaConversao < 0.05 && k.leads.periodo > 5) {
    items.push({
      level: "atencao",
      titulo: `Taxa de conversão baixa (${(k.taxaConversao * 100).toFixed(1)}%)`,
      descricao: "Menos de 5% dos leads viram contrato. Pode ser qualificação ruim ou follow-up lento.",
      acao: "Revisar tempo de resposta ao lead (meta: < 5 min). Criar script de qualificação por WhatsApp para filtrar leads quentes.",
    });
  }

  // ROAS excelente → escalar
  if (m.spend > 0 && m.roas >= 4) {
    items.push({
      level: "oportunidade",
      titulo: `ROAS ${m.roas.toFixed(2)}x — campanha lucrativa para escalar`,
      descricao: `Cada R$1 investido retorna R$${m.roas.toFixed(2)}. Há margem segura para aumentar investimento.`,
      acao: `Aumentar budget das campanhas ativas em +20% por semana até o ROAS começar a cair. Budget atual: R$${m.spend.toFixed(2)}.`,
    });
  }

  // Leads vs cliques: muitos cliques, poucos leads → rastreamento falha
  if (m.clicks > 30 && m.leads < m.clicks * 0.1) {
    items.push({
      level: "atencao",
      titulo: `${m.clicks} cliques mas só ${m.leads} leads rastreados`,
      descricao: "A maioria dos cliques do Meta Ads não está sendo capturada como lead — UTM ou pixel provavelmente não chegam até o WhatsApp.",
      acao: "Verificar se o link do WhatsApp nos anúncios inclui UTM (utm_source=facebook&utm_medium=cpc). Confirmar que o script de captura está rodando antes do redirecionamento.",
    });
  }

  // ROAS excelente E volume baixo → escalar
  if (m.spend > 0 && m.roas >= 4 && m.leads < 10) {
    items.push({
      level: "oportunidade",
      titulo: "ROAS alto com volume pequeno — escalar budget",
      descricao: `Apenas ${m.leads} leads no período com ROAS ${m.roas.toFixed(2)}x. O anúncio funciona, mas está alcançando pouca gente.`,
      acao: `Aumentar budget em +20%/semana e testar públicos similares (lookalike) baseados nos clientes que já converteram. Budget atual: R$${m.spend.toFixed(2)}.`,
    });
  }

  // Sem dados de Meta Ads
  if (m.spend === 0) {
    items.push({
      level: "atencao",
      titulo: "Nenhum gasto no Meta Ads no período",
      descricao: "Sem campanhas ativas ou os dados ainda não foram sincronizados.",
      acao: "Verificar conexão com Meta Business Suite. Confirmar se há campanhas ativas rodando.",
    });
  }

  return items;
}

const levelConfig = {
  critico: { bg: "rgba(220,53,69,0.07)", border: "rgba(220,53,69,0.25)", dot: "#dc3545", label: "CRÍTICO", labelColor: "#dc3545" },
  atencao: { bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.25)", dot: "#f59e0b", label: "ATENÇÃO", labelColor: "#f59e0b" },
  oportunidade: { bg: "rgba(74,222,128,0.07)", border: "rgba(74,222,128,0.25)", dot: "#4ade80", label: "OPORTUNIDADE", labelColor: "#4ade80" },
};

function DiagnosticoPanel({ data }: { data: AnalyticsData }) {
  const items = buildDiagnostico(data);
  const criticos = items.filter((i) => i.level === "critico").length;
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${criticos > 0 ? "rgba(220,53,69,0.3)" : "var(--border)"}`,
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "16px" }}>🎯</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
              Diagnóstico — Próximos Passos
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
              {items.length} ação{items.length !== 1 ? "ões" : ""} identificada{items.length !== 1 ? "s" : ""}
              {criticos > 0 && (
                <span style={{ color: "#dc3545", marginLeft: "6px", fontWeight: 700 }}>
                  · {criticos} crítica{criticos !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
          {collapsed ? "▼ Expandir" : "▲ Recolher"}
        </span>
      </button>

      {!collapsed && (
        <div
          style={{
            padding: "0 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {["critico", "atencao", "oportunidade"].map((level) =>
            items
              .filter((i) => i.level === level)
              .map((item, idx) => {
                const cfg = levelConfig[item.level];
                return (
                  <div
                    key={`${level}-${idx}`}
                    style={{
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      borderRadius: "10px",
                      padding: "14px 16px",
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: cfg.dot,
                        marginTop: "5px",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 800,
                            letterSpacing: "0.14em",
                            color: cfg.labelColor,
                          }}
                        >
                          {cfg.label}
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
                          {item.titulo}
                        </span>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 8px" }}>
                        {item.descricao}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "6px",
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: "6px",
                          padding: "8px 10px",
                        }}
                      >
                        <span style={{ fontSize: "12px", flexShrink: 0 }}>→</span>
                        <span style={{ fontSize: "12px", color: "var(--text)", lineHeight: 1.5 }}>
                          {item.acao}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
}

// ── Principal ──────────────────────────────────────────────────────────────

export default function AnalyticsClient() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMetaBookingsModal, setShowMetaBookingsModal] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      if (!res.ok) throw new Error("Falha ao carregar dados.");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [period, load]);

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "24px",
  };

  const chipBase: React.CSSProperties = {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    border: "1.5px solid var(--border)",
    background: "transparent",
    color: "var(--muted)",
  };
  const chipActive: React.CSSProperties = {
    ...chipBase,
    border: "1.5px solid var(--gold)",
    background: "rgba(180,140,60,0.1)",
    color: "var(--gold)",
  };

  const gridTwo: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1100px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
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
            Admin · Analytics
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)" }}>
            📊 Dashboard de Marketing
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
            Funil completo · Canais · Meta Ads · Follow-ups automáticos
          </p>
        </div>

        {/* Period selector */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { label: "7d", val: 7 },
            { label: "15d", val: 15 },
            { label: "30d", val: 30 },
            { label: "90d", val: 90 },
            { label: "6m", val: 180 },
            { label: "1 ano", val: 365 },
          ].map((p) => (
            <button
              key={p.val}
              onClick={() => setPeriod(p.val)}
              style={period === p.val ? chipActive : chipBase}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 0",
            color: "var(--muted)",
            fontSize: "13px",
          }}
        >
          Carregando dados...
        </div>
      )}
      {error && (
        <div
          style={{
            background: "rgba(220,53,69,0.08)",
            border: "1px solid rgba(220,53,69,0.25)",
            borderRadius: "10px",
            padding: "14px 18px",
            fontSize: "13px",
            color: "#dc3545",
          }}
        >
          ❌ {error}
        </div>
      )}

      {data && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* ── KPIs ─────────────────────────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "14px",
            }}
          >
            <KpiCard
              label={`Leads (${period}d)`}
              value={fmt(data.kpis.leads.periodo)}
              sub={`Total: ${fmt(data.kpis.leads.total)} · Hoje: ${data.kpis.leads.hoje}`}
            />
            <KpiCard
              label={`Contratos (${period}d)`}
              value={fmt(data.kpis.agendamentos.periodo)}
              sub={`Total confirmados: ${fmt(data.kpis.agendamentos.confirmadas)}`}
            />
            <KpiCard
              label={`Faturamento (${period}d)`}
              value={brl(data.kpis.agendamentos.faturamentoPeriodo)}
              sub={`Total: ${brl(data.kpis.agendamentos.faturamentoTotal)}`}
              color="#4ade80"
              highlight
            />
            <KpiCard
              label="Ticket Médio"
              value={brl(data.kpis.ticketMedio)}
              sub="por contrato confirmado"
            />
            <KpiCard
              label="Taxa de Conversão"
              value={pct(data.kpis.taxaConversao)}
              sub="leads convertidos / total"
            />
            <KpiCard
              label="Taxa de Abandono"
              value={pct(data.kpis.taxaAbandono)}
              sub="checkout sem compra"
              color={data.kpis.taxaAbandono > 0.5 ? "#f87171" : "var(--gold)"}
            />
            <KpiCard
              label={`NoShows (${period}d)`}
              value={fmt(data.kpis.noShow.periodo)}
              sub={`${data.kpis.noShow.outCancelados} retornos cancelados · ${data.kpis.noShow.taxa}% dos contratos`}
              color="#f87171"
            />
          </div>

          {/* ── Diagnóstico ──────────────────────────────────────────────── */}
          <DiagnosticoPanel data={data} />

          {/* ── Timeline ─────────────────────────────────────────────────── */}
          <div style={card}>
            <SectionTitle>Evolução — Últimos {period} dias</SectionTitle>
            {data.timeline.length >= 2 ? (
              <TimelineChart data={data.timeline} />
            ) : (
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>Dados insuficientes.</p>
            )}
          </div>

          {/* ── Funil + Meta Ads ─────────────────────────────────────────── */}
          <div style={gridTwo}>
            <div style={card}>
              <SectionTitle>Funil de Conversão</SectionTitle>
              <Funil stages={data.funil} />

              {data.kpis.taxaAbandono > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "10px 14px",
                    background: "rgba(248,113,113,0.06)",
                    border: "1px solid rgba(248,113,113,0.2)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#f87171",
                  }}
                >
                  ⚠️ {pct(data.kpis.taxaAbandono)} de abandono no checkout —{" "}
                  {fmt(
                    data.funil.find((f) => f.stage === "Iniciou Checkout")?.count ?? 0 -
                    (data.funil.find((f) => f.stage === "Compra Finalizada")?.count ?? 0)
                  )}{" "}
                  oportunidades perdidas
                </div>
              )}
            </div>

            <div style={card}>
              <SectionTitle>Meta Ads — {period}d</SectionTitle>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))",
                  gap: "12px",
                }}
              >
                {[
                  { label: "Investimento", value: brl(data.metaAds.spend * 100) },
                  { label: "Retorno (Faturamento)", value: brl(data.metaAds.faturamento), onClick: () => setShowMetaBookingsModal(true) },
                  { label: "ROAS (Retorno)", value: `${data.metaAds.roas.toFixed(2)}x`, onClick: () => setShowMetaBookingsModal(true) },
                  { label: "ROI", value: `${(data.metaAds.roi * 100).toFixed(0)}%`, onClick: () => setShowMetaBookingsModal(true) },
                  { label: "Leads Ads", value: fmt(data.metaAds.leads) },
                  { label: "Agendamentos Ads", value: fmt(data.metaAds.conversoes), onClick: () => setShowMetaBookingsModal(true) },
                  { label: "Cliques", value: fmt(data.metaAds.clicks) },
                  { label: "Impressões", value: fmt(data.metaAds.impressions) },
                  { label: "Reach (Alcance)", value: fmt(data.metaAds.reach) },
                  { label: "CTR (Cliques/Imp)", value: `${(data.metaAds.ctr * 100).toFixed(2)}%` },
                  { label: "CPM (Custo/Mil)", value: brl(data.metaAds.cpm * 100) },
                  { label: "CPC Médio", value: brl(data.metaAds.cpc * 100) },
                  { label: "CPL (Custo/Lead)", value: brl(data.metaAds.cpl * 100) },
                  { label: "CPA (Custo/Agendamento)", value: brl(data.metaAds.cpa * 100) },
                  { label: "CAC (Custo/Cliente)", value: brl(data.metaAds.cac * 100) },
                  { label: "CBR (Conversão)", value: `${(data.metaAds.cbr * 100).toFixed(2)}%` },
                  { label: "AOV (Ticket Médio)", value: brl(data.metaAds.aov * 100) },
                  { label: "LTV (Tempo de Vida)", value: brl(data.metaAds.ltv * 100) },
                ].map(({ label, value, onClick }) => (
                  <div
                    key={label}
                    onClick={onClick}
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      cursor: onClick ? "pointer" : "default",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={onClick ? (e) => {
                      e.currentTarget.style.borderColor = "var(--gold)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(180,140,60,0.08)";
                    } : undefined}
                    onMouseLeave={onClick ? (e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    } : undefined}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "var(--muted)",
                        marginBottom: "4px",
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--gold)" }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Canais + UTMs ─────────────────────────────────────────────── */}
          <div style={gridTwo}>
            <div style={card}>
              <SectionTitle>Canais de Origem</SectionTitle>
              {data.canais.length > 0 ? (
                <BarList
                  items={data.canais.map((c) => ({ name: c.canal, count: c.count }))}
                  label="Canal"
                />
              ) : (
                <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                  Nenhum dado no período.
                </p>
              )}
            </div>

            <div style={card}>
              <SectionTitle>UTM Sources</SectionTitle>
              {data.utms.length > 0 ? (
                <BarList
                  items={data.utms.map((u) => ({ name: u.source, count: u.count }))}
                  label="Origem UTM"
                />
              ) : (
                <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                  Nenhum UTM registrado no período.
                </p>
              )}
            </div>
          </div>

          {/* ── Follow-ups automáticos ────────────────────────────────────── */}
          <div style={card}>
            <SectionTitle>Follow-ups Automáticos — {period}d</SectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "12px",
              }}
            >
              {[
                { label: "Pós-compra D+1", value: data.followups.d1, icon: "✅" },
                { label: "Upsell D+3", value: data.followups.d3, icon: "🔁" },
                { label: "LTV D+7", value: data.followups.d7, icon: "⭐" },
                { label: "Reativação 30d", value: data.followups.r30, icon: "🔄" },
                { label: "Reativação 60d", value: data.followups.r60, icon: "🔄" },
                { label: "Reativação 90d", value: data.followups.r90, icon: "🔄" },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "14px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>{icon}</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--gold)" }}>
                    {fmt(value)}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--muted)",
                      marginTop: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <p
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              textAlign: "right",
              paddingBottom: "8px",
            }}
          >
            Atualizado agora · Período: últimos {period} dias
          </p>
        </div>
      )}

      {/* Modal de Agendamentos Meta Ads */}
      {showMetaBookingsModal && data && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowMetaBookingsModal(false)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "650px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "85vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                🎯 Agendamentos Atribuídas ao Meta Ads
              </h3>
              <button
                onClick={() => setShowMetaBookingsModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {data.metaAds.bookings && data.metaAds.bookings.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1.5px solid var(--border)", textAlign: "left" }}>
                        <th style={{ padding: "8px 0", color: "var(--muted)", fontWeight: 600 }}>Cliente</th>
                        <th style={{ padding: "8px 0", color: "var(--muted)", fontWeight: 600 }}>Origem</th>
                        <th style={{ padding: "8px 0", color: "var(--muted)", fontWeight: 600 }}>Trajeto</th>
                        <th style={{ padding: "8px 0", color: "var(--muted)", fontWeight: 600 }}>Data</th>
                        <th style={{ padding: "8px 0", color: "var(--muted)", fontWeight: 600, textAlign: "right" }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.metaAds.bookings.map((booking) => (
                        <tr key={booking.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "10px 0", color: "var(--text)", fontWeight: 500 }}>
                            {booking.customerName}
                          </td>
                          <td style={{ padding: "10px 0", color: "var(--muted)" }}>
                            {booking.originType === "WhatsApp (Direto)" ? "📱 WhatsApp" : "🌐 Site"}
                          </td>
                          <td style={{ padding: "10px 0", color: "var(--muted)" }}>
                            {booking.routeLabel ?? "Não informado"}
                          </td>
                          <td style={{ padding: "10px 0", color: "var(--muted)" }}>
                            {new Date(booking.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td style={{ padding: "10px 0", color: "var(--gold)", fontWeight: 700, textAlign: "right" }}>
                            {brl(booking.totalCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "12px 16px",
                      background: "rgba(180,140,60,0.06)",
                      border: "1px solid var(--gold-line)",
                      borderRadius: "10px",
                      fontSize: "12px",
                      color: "var(--muted)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>Total de agendamentos: <strong>{data.metaAds.bookings.length}</strong></span>
                    <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                      Soma: {brl(data.metaAds.faturamento)}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                  Nenhuma agendamento do Meta Ads registrada no período de {period} dias.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowMetaBookingsModal(false)}
                style={{
                  background: "var(--gold)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#000",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
