"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type MenuItem = { href: string; label: string; icon: string; matchPaths?: string[] };
type MenuSection = {
  label: string;
  items: MenuItem[];
};

const SECTIONS: MenuSection[] = [
  {
    label: "OPERAÇÃO",
    items: [
      { href: "/admin/novo-agendamento", label: "Novo Agendamento", icon: "＋" },
      { href: "/admin/agenda", label: "Agenda", icon: "📅" },
      { href: "/admin/agendamentos", label: "Agendamentos", icon: "🗓️" },
      { href: "/admin/equipe", label: "Equipe / Profissionais", icon: "🧑‍💼" },
    ],
  },
  {
    label: "COMERCIAL",
    items: [
      { href: "/admin/atendimento-whatsapp", label: "WhatsApp CRM", icon: "💬" },
      { href: "/admin/parcerias", label: "Parcerias B2B", icon: "💼" },
      { href: "/admin/representantes", label: "Representantes", icon: "🤝" },
    ],
  },
  {
    label: "INTELIGÊNCIA",
    items: [
      { href: "/admin/leads", label: "Leads & Pipeline", icon: "🎯" },
      { href: "/admin/clientes", label: "Clientes", icon: "🤎" },
      { href: "/admin/apps", label: "Assistente Apps", icon: "📱", matchPaths: ["/admin/conversas", "/admin/atendimento-whatsapp"] },
      { href: "/admin/inteligencia", label: "Inteligência do Negócio", icon: "🧠" },
      { href: "/admin/tendencias", label: "Tendências", icon: "📈" },
      { href: "/admin/analytics", label: "Analytics", icon: "📊" },
    ],
  },
  {
    label: "GESTÃO",
    items: [
      { href: "/admin/caixa", label: "Financeiro", icon: "💰" },
      { href: "/admin/marketing", label: "Marketing", icon: "📣" },
      { href: "/admin/automacoes", label: "Automações", icon: "⚡" },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Controla o estado de abertura (accordion) de cada seção
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    OPERAÇÃO: true,
    COMERCIAL: false,
    INTELIGÊNCIA: false,
    GESTÃO: false,
  });

  // Garante que a seção contendo a rota ativa sempre inicie aberta ao carregar ou navegar
  useEffect(() => {
    const activeSection = SECTIONS.find((sec) =>
      sec.items.some((item) =>
        pathname === item.href ||
        pathname.startsWith(item.href + "/") ||
        (item.matchPaths && item.matchPaths.some(path => pathname === path || pathname.startsWith(path + "/")))
      )
    );
    if (activeSection) {
      setOpenSections((prev) => ({ ...prev, [activeSection.label]: true }));
    }
  }, [pathname]);

  // Fecha o menu lateral móvel ao navegar
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Se for a página de login do painel administrativo, renderiza sem a casca do painel
  if (pathname === "/admin") {
    return <>{children}</>;
  }

  function toggleSection(label: string) {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <>
      <style>{`
        .admin-shell {
          min-height: 100dvh;
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', system-ui, sans-serif;
          display: flex;
        }
        /* ── Sidebar ── */
        .admin-sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--bg-card);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100dvh;
          z-index: 50;
          transition: transform 0.25s ease;
        }
        /* ── Top bar (mobile only) ── */
        .admin-topbar {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .admin-hamburger {
          background: none;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          cursor: pointer;
          padding: 6px 10px;
          font-size: 18px;
          line-height: 1;
        }
        /* ── Overlay ── */
        .admin-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 45;
        }
        .admin-main {
          flex: 1;
          overflow-y: auto;
          min-width: 0;
        }

        @media (max-width: 767px) {
          .admin-shell {
            flex-direction: column;
          }
          .admin-topbar {
            display: flex;
          }
          .admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100dvh;
            transform: translateX(-100%);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-overlay.open {
            display: block;
          }
          .admin-main {
            flex: 1;
          }
        }
      `}</style>

      <div className="admin-shell">
        {/* ── Top bar (mobile) ── */}
        <div className="admin-topbar">
          <Link href="/admin/painel">
            <Image
              src="/brand/logo-horizontal.webp"
              alt="[NOME DO NEGÓCIO]"
              width={120}
              height={34}
              style={{ height: "28px", width: "auto", display: "block" }}
            />
          </Link>
          <button
            className="admin-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* ── Overlay ── */}
        <div
          className={`admin-overlay${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(false)}
        />

        {/* ── Sidebar ── */}
        <aside className={`admin-sidebar${menuOpen ? " open" : ""}`}>
          {/* Logo + label */}
          <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
            <Link href="/admin/painel" aria-label="Painel" onClick={() => setMenuOpen(false)}>
              <Image
                src="/brand/logo-horizontal.webp"
                alt="[NOME DO NEGÓCIO]"
                width={140}
                height={40}
                style={{ height: "32px", width: "auto", display: "block" }}
              />
            </Link>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "var(--gold)",
                marginTop: "10px",
              }}
            >
              Painel Admin
            </p>
          </div>

          {/* Nav Accordion */}
          <nav
            style={{
              flex: 1,
              padding: "12px 8px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              overflowY: "auto",
            }}
          >
            {/* Link Central Fixo */}
            <Link
              href="/admin/painel"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: pathname === "/admin/painel" ? 600 : 400,
                background: pathname === "/admin/painel" ? "var(--gold-dim)" : "transparent",
                color: pathname === "/admin/painel" ? "var(--gold)" : "var(--muted)",
                textDecoration: "none",
                transition: "all 0.15s",
                border: pathname === "/admin/painel" ? "1px solid var(--gold-line)" : "1px solid transparent",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  lineHeight: 1,
                  width: "20px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                ⚡
              </span>
              Central
            </Link>

            {/* Seções Acordeão (Cortininha) */}
            {SECTIONS.map((sec) => {
              const isOpen = !!openSections[sec.label];
              return (
                <div key={sec.label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {/* Cabeçalho de Seção clicável */}
                  <button
                    type="button"
                    onClick={() => toggleSection(sec.label)}
                    style={{
                      background: "none",
                      border: "none",
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      marginTop: "12px",
                      marginBottom: "4px",
                      cursor: "pointer",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      userSelect: "none",
                      outline: "none",
                    }}
                    className="hover:text-[color:var(--gold)]"
                  >
                    <span>{sec.label}</span>
                    <span
                      style={{
                        fontSize: "8px",
                        transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Links dos Submenus com Transição de Cortininha (Accordion Height & Opacity) */}
                  <div
                    style={{
                      maxHeight: isOpen ? `${sec.items.length * 42}px` : "0px",
                      opacity: isOpen ? 1 : 0,
                      overflow: "hidden",
                      transition: "max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-out",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    {sec.items.map((item) => {
                      const active =
                        pathname === item.href ||
                        (item.href !== "/admin/painel" && pathname.startsWith(item.href + "/")) ||
                        (item.matchPaths && item.matchPaths.some(path => pathname === path || pathname.startsWith(path + "/")));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "9px 12px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: active ? 600 : 400,
                            background: active ? "var(--gold-dim)" : "transparent",
                            color: active ? "var(--gold)" : "var(--muted)",
                            textDecoration: "none",
                            transition: "all 0.15s",
                            border: active ? "1px solid var(--gold-line)" : "1px solid transparent",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "15px",
                              lineHeight: 1,
                              width: "20px",
                              textAlign: "center",
                              flexShrink: 0,
                            }}
                          >
                            {item.icon}
                          </span>
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
            <Link
              href="/"
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>←</span> Ver site
            </Link>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="admin-main">{children}</main>
      <