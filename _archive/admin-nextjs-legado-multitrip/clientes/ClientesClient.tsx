"use client";

import { useState } from "react";
import Link from "next/link";

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function tripLabel(t: string) {
  if (t === "so_citytour") return "Somente City Tour";
  if (t === "ida_volta") return "Chegada In + Retorno Out";
  if (t === "volta") return "Retorno Out";
  return "Chegada In";
}

function vehicleLabel(v: string) {
  const map: Record<string, string> = {
    sedan: "Sedan Premium",
    van: "Spin 6 Lugares",
    executivo: "Sedan Executivo",
    suv: "SUV",
    suv_eletrico: "SUV Elétrico",
  };
  return map[v] ?? v;
}

function vehicleLabelShort(v: string) {
  const map: Record<string, string> = {
    sedan: "Sedan Premium",
    van: "Spin",
    executivo: "Executivo",
    suv: "SUV",
    suv_eletrico: "SUV",
  };
  return map[v] ?? v;
}

function classifyCustomer(totalBookings: number, totalCents: number) {
  if (totalBookings >= 3 || totalCents >= 150000) {
    return {
      label: "Embaixador",
      icon: "👑",
      color: "#f97316",
      bg: "rgba(249,115,22,0.1)",
      border: "rgba(249,115,22,0.25)",
      tier: 3,
    };
  }
  if (totalBookings >= 2 || totalCents >= 80000) {
    return {
      label: "VIP",
      icon: "⭐",
      color: "#c9a84c",
      bg: "rgba(201,168,76,0.1)",
      border: "rgba(201,168,76,0.25)",
      tier: 2,
    };
  }
  return {
    label: "Regular",
    icon: "🤎",
    color: "#3ecf8e",
    bg: "rgba(62,207,142,0.08)",
    border: "rgba(62,207,142,0.2)",
    tier: 1,
  };
}

type BookingItem = {
  id: string;
  totalCents: number;
  createdAt: Date;
  tripType: string;
  vehicleType: string;
  idaDate: string | null;
  affiliateCode: string | null;
  affiliateName: string | null;
  affiliateId: string | null;
};

type CustomerData = {
  customer: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    birthDate: Date | null;
  };
  bookings: BookingItem[];
  totalCents: number;
};

export function ClientesClient({ initialCustomers }: { initialCustomers: CustomerData[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "class" | "ltv">("ltv");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedCust, setSelectedCust] = useState<CustomerData | null>(null);

  // 1. Filtragem por busca (Nome, Telefone, Email)
  const filtered = initialCustomers.filter((c) => {
    const term = search.toLowerCase();
    const nameMatch = c.customer.name?.toLowerCase().includes(term) ?? false;
    const phoneMatch = c.customer.phone.includes(term);
    const emailMatch = c.customer.email?.toLowerCase().includes(term) ?? false;
    return nameMatch || phoneMatch || emailMatch;
  });

  // 2. Ordenação dinâmica
  const sorted = [...filtered].sort((a, b) => {
    let valA: any = "";
    let valB: any = "";

    if (sortBy === "name") {
      valA = a.customer.name?.toLowerCase() || "";
      valB = b.customer.name?.toLowerCase() || "";
    } else if (sortBy === "date") {
      const dateA = a.bookings[0]?.idaDate || a.bookings[0]?.createdAt || 0;
      const dateB = b.bookings[0]?.idaDate || b.bookings[0]?.createdAt || 0;
      valA = new Date(dateA).getTime();
      valB = new Date(dateB).getTime();
    } else if (sortBy === "class") {
      valA = classifyCustomer(a.bookings.length, a.totalCents).tier;
      valB = classifyCustomer(b.bookings.length, b.totalCents).tier;
    } else if (sortBy === "ltv") {
      valA = a.totalCents;
      valB = b.totalCents;
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Alterna o campo de ordenação ou inverte o sentido
  function handleSort(field: "name" | "date" | "class" | "ltv") {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(field === "name" || field === "class"); // A-Z para nome/classe padrão ascendente
    }
  }

  function getSortIndicator(field: "name" | "date" | "class" | "ltv") {
    if (sortBy !== field) return " ↕";
    return sortAsc ? " ▲" : " ▼";
  }

  // KPIs
  const totalCustomers = initialCustomers.length;
  const recorrentes = initialCustomers.filter((c) => c.bookings.length >= 2).length;
  const embaixadores = initialCustomers.filter(
    (c) => c.bookings.length >= 3 || c.totalCents >= 150000
  ).length;
  const totalLTV = initialCustomers.reduce((s, c) => s + c.totalCents, 0);
  const ticketMedioGeral = totalCustomers > 0 ? Math.round(totalLTV / totalCustomers) : 0;

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "20px 24px",
  };

  return (
    <div>
      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {[
          { label: "Total Clientes", value: totalCustomers, color: "#fff", sub: "com contrato confirmado" },
          { label: "Recorrentes", value: recorrentes, color: "#c9a84c", sub: "2+ viagens" },
          { label: "Embaixadores", value: embaixadores, color: "#f97316", sub: "3+ viagens ou R$1.500+" },
          { label: "LTV Médio", value: brl(ticketMedioGeral), color: "#3ecf8e", sub: "por cliente" },
        ].map((k) => (
          <div key={k.label} style={{ ...cardStyle, borderTop: `3px solid ${k.color}33` }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--muted)",
                marginBottom: 8,
              }}
            >
              {k.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Legenda de classificação & Barra de Busca */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* Bloco legenda otimizado, menor e em uma linha */}
        <div
          style={{
            ...cardStyle,
            flex: "1 1 500px",
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            padding: "12px 20px",
            fontSize: "11px",
            alignItems: "center",
          }}
        >
          {[
            { icon: "👑", label: "Embaixador", desc: "atendimento ida e volta + citytour 2 dias ou Bento", color: "#f97316" },
            { icon: "⭐", label: "VIP", desc: "atendimento ida e volta + citytour", color: "#c9a84c" },
            { icon: "🤎", label: "Regular", desc: "atendimento ida e volta", color: "#3ecf8e" },
          ].map((c) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>{c.icon}</span>
              <span style={{ fontWeight: 700, color: c.color, fontSize: "11px" }}>{c.label}:</span>
              <span style={{ color: "var(--muted)", fontSize: "11px" }}>{c.desc}</span>
            </div>
          ))}
        </div>

        {/* Input de busca */}
        <div style={{ position: "relative", width: "320px" }}>
          <input
            type="text"
            placeholder="Buscar por nome, WhatsApp ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "12px 16px",
              paddingLeft: "36px",
              color: "var(--text)",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "14px",
              color: "var(--muted)",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista de clientes */}
      <div style={{ ...cardStyle, overflow: "hidden", padding: 0 }}>
        {/* Header tabela */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 100px",
            gap: 12,
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(255,255,255,0.02)",
            userSelect: "none",
          }}
        >
          <button
            onClick={() => handleSort("name")}
            style={{
              background: "none",
              border: "none",
              textAlign: "left",
              padding: 0,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: sortBy === "name" ? "var(--gold)" : "var(--muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            Cliente {getSortIndicator("name")}
          </button>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted)",
            }}
          >
            Viagens
          </span>
          <button
            onClick={() => handleSort("ltv")}
            style={{
              background: "none",
              border: "none",
              textAlign: "left",
              padding: 0,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: sortBy === "ltv" ? "var(--gold)" : "var(--muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            LTV Total {getSortIndicator("ltv")}
          </button>
          <button
            onClick={() => handleSort("date")}
            style={{
              background: "none",
              border: "none",
              textAlign: "left",
              padding: 0,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: sortBy === "date" ? "var(--gold)" : "var(--muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            Última atendimento {getSortIndicator("date")}
          </button>
          <button
            onClick={() => handleSort("class")}
            style={{
              background: "none",
              border: "none",
              textAlign: "left",
              padding: 0,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: sortBy === "class" ? "var(--gold)" : "var(--muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            Classe {getSortIndicator("class")}
          </button>
        </div>

        {/* Linhas de clientes */}
        {sorted.map((c, i) => {
          const { label, icon, color, bg, border } = classifyCustomer(c.bookings.length, c.totalCents);
          const lastBooking = c.bookings[0];

          // Busca se alguma agendamento do cliente tem indicação de representante associado
          const firstBookingWithAffiliate = c.bookings.find((b) => b.affiliateCode && b.affiliateId);
          const affName = firstBookingWithAffiliate?.affiliateName;
          const affId = firstBookingWithAffiliate?.affiliateId;

          return (
            <div
              key={c.customer.id}
              onClick={() => setSelectedCust(c)}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 100px",
                gap: 12,
                padding: "16px 20px",
                alignItems: "center",
                borderBottom: i < sorted.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                cursor: "pointer",
                transition: "background 0.2s, transform 0.1s",
              }}
              className="hover:bg-white/[0.03] active:scale-[0.99]"
            >
              {/* Cliente */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                    {c.customer.name ?? "—"}
                  </span>
                  {affName && affId && (
                    <Link
                      href={`/admin/representantes/${affId}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Evita abrir o drawer de dados do cliente
                      }}
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#a78bfa",
                        background: "rgba(167,139,250,0.1)",
                        border: "1px solid rgba(167,139,250,0.2)",
                        padding: "1px 6px",
                        borderRadius: 4,
                        textDecoration: "none",
                        transition: "all 0.15s",
                      }}
                      className="hover:bg-[#a78bfa] hover:text-[#000]"
                    >
                      {affName.toUpperCase()}
                    </Link>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{c.customer.phone}</span>
                  {c.customer.email && (
                    <span style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
                      · {c.customer.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Viagens */}
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: c.bookings.length >= 2 ? color : "var(--text)" }}>
                  {c.bookings.length}
                </p>
                <p style={{ fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.bookings.map((b) => vehicleLabelShort(b.vehicleType)).join(", ")}
                </p>
              </div>

              {/* LTV */}
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#c9a84c" }}>{brl(c.totalCents)}</p>
                <p style={{ fontSize: 10, color: "var(--muted)" }}>
                  {brl(Math.round(c.totalCents / c.bookings.length))} / atendimento
                </p>
              </div>

              {/* Última atendimento */}
              <div>
                <p style={{ fontSize: 12, color: "var(--text)" }}>
                  {fmtDate(lastBooking?.idaDate ?? lastBooking?.createdAt ?? null)}
                </p>
                <span style={{ fontSize: 10, color: "var(--muted)" }} className="hover:text-[color:var(--gold)]">
                  ver histórico →
                </span>
              </div>

              {/* Classificação */}
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: bg,
                    color,
                    border: `1px solid ${border}`,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {icon} {label}
                </span>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div style={{ padding: "64px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Nenhum cliente encontrado para os filtros selecionados.
          </div>
        )}
      </div>

      {/* Painel lateral deslizante (Drawer) para Detalhes do Cliente */}
      {selectedCust && (
        <div
          onClick={() => setSelectedCust(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            justifyContent: "flex-end",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "480px",
              height: "100%",
              background: "#0d1117",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-10px 0 40px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              padding: "32px 28px",
              boxSizing: "border-box",
              overflowY: "auto",
              position: "relative",
              animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Header Drawer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: classifyCustomer(selectedCust.bookings.length, selectedCust.totalCents).bg,
                    color: classifyCustomer(selectedCust.bookings.length, selectedCust.totalCents).color,
                    border: `1px solid ${classifyCustomer(selectedCust.bookings.length, selectedCust.totalCents).border}`,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  {classifyCustomer(selectedCust.bookings.length, selectedCust.totalCents).icon}{" "}
                  {classifyCustomer(selectedCust.bookings.length, selectedCust.totalCents).label}
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                  {selectedCust.customer.name ?? "Cliente Sem Nome"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCust(null)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Dados do Cliente */}
            <div style={{ display: "grid", gap: "16px", marginBottom: "28px", borderBottom: "1px solid var(--border)", paddingBottom: "24px" }}>
              <div>
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>WhatsApp</p>
                <a
                  href={`https://wa.me/55${selectedCust.customer.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: "14px", fontWeight: 600, color: "#3ecf8e", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  💬 {selectedCust.customer.phone}
                </a>
              </div>
              {selectedCust.customer.email && (
                <div>
                  <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>E-mail</p>
                  <p style={{ fontSize: "14px", color: "var(--text)", margin: 0 }}>{selectedCust.customer.email}</p>
                </div>
              )}
              {selectedCust.customer.birthDate && (
                <div>
                  <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Data de Nascimento</p>
                  <p style={{ fontSize: "14px", color: "var(--text)", margin: 0 }}>
                    🎂 {fmtDate(selectedCust.customer.birthDate)}
                  </p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "12px", borderRadius: 10 }}>
                  <p style={{ fontSize: "9px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", margin: "0 0 4px 0" }}>LTV Total</p>
                  <p style={{ fontSize: "16px", fontWeight: 800, color: "#c9a84c", margin: 0 }}>{brl(selectedCust.totalCents)}</p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "12px", borderRadius: 10 }}>
                  <p style={{ fontSize: "9px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", margin: "0 0 4px 0" }}>Contratos</p>
                  <p style={{ fontSize: "16px", fontWeight: 800, color: "#fff", margin: 0 }}>{selectedCust.bookings.length} viagens</p>
                </div>
              </div>
            </div>

            {/* Histórico de Contratos */}
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: "16px", letterSpacing: "0.08em" }}>
                📋 Histórico de Contratos ({selectedCust.bookings.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedCust.bookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/agendamentos/${b.id}`}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "16px",
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      transition: "all 0.15s",
                    }}
                    className="hover:border-[rgba(201,168,76,0.4)] hover:bg-white/[0.05]"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--gold)" }}>
                        {b.idaDate ? fmtDate(b.idaDate) : fmtDate(b.createdAt)}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#3ecf8e" }}>
                        {brl(b.totalCents)}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>
                      {tripLabel(b.tripType)}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                      🚗 {vehicleLabel(b.vehicleType)}
                    </div>
                    {b.affiliateCode && b.affiliateName && (
                      <div style={{ fontSize: "10px", color: "#a78bfa", marginTop: 4 }}>
                        🔗 Indicação: {b.affiliateName.toUpperCase()}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS embutidos para animações do drawer e responsivo */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
