import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Painel | Admin [NOME DO NEGÓCIO]",
  robots: { index: false, follow: false },
};

const MENU_CARDS = [
  // -- OPERAÇÃO --
  {
    href: "/admin/agenda",
    icon: "📅",
    label: "Agenda",
    description: "Visualizar compromissos, viagens e prazos do dia a dia.",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.20)",
  },
  {
    href: "/admin/nova-agendamento",
    icon: "＋",
    label: "Nova Agendamento",
    description: "Criar uma agendamento manual diretamente no sistema.",
    color: "var(--mt-gold)",
    bg: "rgba(201,168,76,0.08)",
    border: "rgba(201,168,76,0.25)",
  },
  {
    href: "/admin/agendamentos",
    icon: "🗓️",
    label: "Agendamentos",
    description: "Ver, filtrar e gerenciar todas as agendamentos ativas e passadas.",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.20)",
  },
  {
    href: "/admin/profissionais",
    icon: "🚙",
    label: "Profissionais / Frota",
    description: "Gerenciar veículos, profissionais parceiros e escalas.",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.20)",
  },

  // -- COMERCIAL --
  {
    href: "/admin/leads",
    icon: "🎯",
    label: "Leads",
    description: "Acompanhar contatos e oportunidades em aberto.",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.20)",
  },
  {
    href: "/admin/clientes",
    icon: "🤎",
    label: "Clientes",
    description: "Histórico, preferências e relacionamento com clientes.",
    color: "#d4a373",
    bg: "rgba(212,163,115,0.08)",
    border: "rgba(212,163,115,0.20)",
  },
  {
    href: "/admin/inteligencia",
    icon: "🧠",
    label: "Assistente Inteligência",
    description: "Insights e automações inteligentes para o seu negócio.",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.08)",
    border: "rgba(192,132,252,0.20)",
  },
  {
    href: "/admin/tendencias",
    icon: "📈",
    label: "Tendências",
    description: "Acompanhar sazonalidades, destinos e oportunidades em alta.",
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.20)",
  },
  {
    href: "/admin/painel/whatsapp",
    icon: "💬",
    label: "WhatsApp CRM",
    description: "Conectar número da equipe via QR e sincronizar conversas ao CRM.",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.07)",
    border: "rgba(34,197,94,0.20)",
  },
  {
    href: "/admin/b2b",
    icon: "💼",
    label: "CRM B2B",
    description: "Gestão de agências, hotéis e networking comercial.",
    color: "#fcd34d",
    bg: "rgba(252,211,77,0.08)",
    border: "rgba(252,211,77,0.20)",
  },
  {
    href: "/admin/representantes",
    icon: "🤝",
    label: "Representantes",
    description: "Gerenciar parceiros, comissões e links de indicação.",
    color: "#3ecf8e",
    bg: "rgba(62,207,142,0.08)",
    border: "rgba(62,207,142,0.20)",
  },

  // -- GESTÃO --
  {
    href: "/admin/caixa",
    icon: "📈",
    label: "Financeiro",
    description: "Gerenciar caixa, transações e fluxo financeiro do sistema.",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.20)",
  },
  {
    href: "/admin/analytics",
    icon: "📊",
    label: "Analytics",
    description: "Métricas, relatórios de vendas e desempenho geral.",
    color: "#e879f9",
    bg: "rgba(232,121,249,0.08)",
    border: "rgba(232,121,249,0.20)",
  },
  {
    href: "/admin/marketing",
    icon: "📣",
    label: "Marketing",
    description: "Campanhas, UTMs, anúncios e desempenho de canais.",
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.20)",
  },
  {
    href: "/admin/automacoes",
    icon: "⚡",
    label: "Automações",
    description: "Configurar fluxos automáticos e integrações do sistema.",
    color: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.20)",
  },
];

export default function PainelPage() {
  const now = new Date();
  const hora = now.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hour12: false,
  });
  const horaNum = parseInt(hora);
  const saudacao = horaNum < 12 ? "Bom dia" : horaNum < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <p
          className="text-xs font-bold uppercase tracking-[0.25em] mb-2"
          style={{ color: "var(--muted)" }}
        >
          [NOME DO NEGÓCIO] · Admin
        </p>
        <h1 className="text-3xl font-bold text-white mb-1">{saudacao}, Rita e Eric. 👋</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {now.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Cards de menu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MENU_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col gap-4 rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
            style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
            }}
          >
            <div
              className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl"
              style={{ background: "rgba(0,0,0,0.25)" }}
            >
              {card.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-1" style={{ color: card.color }}>
                {card.label}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {card.description}
              </p>
            </div>
            <div
              className="text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: card.color }}
            >
              Acessar <span>→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Rodapé */}
      <div
        className="mt-10 pt-6 flex items-center gap-4 text-xs"
        style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
      >
        <span>seudominio.com.br/admin</span>
        <span>·</span>
        <Link href="/" className="hover:text-white transition-colors">
          Ver site público →
        </Link>
      </div>
    </div>
  );
}
