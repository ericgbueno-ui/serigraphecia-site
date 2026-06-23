<<<<<<< Updated upstream
"use client";

import { useState } from "react";

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
    return { label: "Embaixador", icon: "👑", color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)", tier: 3 };
  }
  if (totalBookings >= 2 || totalCents >= 80000) {
    return { label: "VIP", icon: "⭐", color: "#c9a84c", bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.25)", tier: 2 };
  }
  return { label: "Regular", icon: "🤎", color: "#3ecf8e", bg: "rgba(62,207,142,0.08)", border: "rgba(62,207,142,0.2)", tier: 1 };
}

type BookingItem = {
  id: string;
  totalCents: number;
  createdAt: Date;
  tipoProduto?: string;
  quantidade?: number;
  idaDate?: string | null;
  affiliateCode: string | null;
  affiliateName: string | null;
  affiliateId: string | null;
};

type CustomerData = {
  customer: { id: string; name: string | null; phone: string; email: string | null; birthDate: Date | null };
  bookings: BookingItem[];
  totalCents: number;
};

export function ClientesClient({ initialCustomers }: { initialCustomers: CustomerData[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "class" | "ltv">("ltv");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedCust, setSelectedCust] = useState<CustomerData | null>(null);

  const filtered = initialCustomers.filter((c) => {
    const term = search.toLowerCase();
    return (
      (c.customer.name?.toLowerCase().includes(term) ?? false) ||
      c.customer.phone.includes(term) ||
      (c.customer.email?.toLowerCase().includes(term) ?? false)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA: any = "", valB: any = "";
    if (sortBy === "name") { valA = a.customer.name?.toLowerCase() || ""; valB = b.customer.name?.toLowerCase() || ""; }
    else if (sortBy === "date") { valA = new Date(a.bookings[0]?.idaDate ?? a.bookings[0]?.createdAt ?? 0).getTime(); valB = new Date(b.bookings[0]?.idaDate ?? b.bookings[0]?.createdAt ?? 0).getTime(); }
    else if (sortBy === "class") { valA = classifyCustomer(a.bookings.length, a.totalCents).tier; valB = classifyCustomer(b.bookings.length, b.totalCents).tier; }
    else { valA = a.totalCents; valB = b.totalCents; }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  function handleSort(field: "name" | "date" | "class" | "ltv") {
    if (sortBy === field) setSortAsc(!sortAsc);
    else { setSortBy(field); setSortAsc(field === "name" || field === "class"); }
  }

  function getSortIndicator(field: string) {
    if (sortBy !== field) return " ↕";
    return sortAsc ? " ▲" : " ▼";
  }

  const totalCustomers = initialCustomers.length;
  const recorrentes = initialCustomers.filter((c) => c.bookings.length >= 2).length;
  const embaixadores = initialCustomers.filter((c) => c.bookings.length >= 3 || c.totalCents >= 150000).length;
  const totalLTV = initialCustomers.reduce((s, c) => s + c.totalCents, 0);
  const ticketMedioGeral = totalCustomers > 0 ? Math.round(totalLTV / totalCustomers) : 0;

  const cardStyle: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total Clientes", value: totalCustomers, color: "#fff", sub: "com pedido confirmado" },
          { label: "Recorrentes", value: recorrentes, color: "#c9a84c", sub: "2+ pedidos" },
          { label: "Embaixadores", value: embaixadores, color: "#f97316", sub: "3+ pedidos ou R$1.500+" },
          { label: "LTV Médio", value: brl(ticketMedioGeral), color: "#3ecf8e", sub: "por cliente" },
        ].map((k) => (
          <div key={k.label} style={{ ...cardStyle, borderTop: `3px solid ${k.color}33` }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 8 }}>{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap" as const, justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div style={{ ...cardStyle, flex: "1 1 500px", display: "flex", gap: "20px", flexWrap: "wrap" as const, padding: "12px 20px", fontSize: "11px", alignItems: "center" }}>
          {[
            { icon: "👑", label: "Embaixador", desc: "3+ pedidos ou R$1.500+", color: "#f97316" },
            { icon: "⭐", label: "VIP", desc: "2+ pedidos ou R$800+", color: "#c9a84c" },
            { icon: "🤎", label: "Regular", desc: "1 pedido", color: "#3ecf8e" },
          ].map((c) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>{c.icon}</span>
              <span style={{ fontWeight: 700, color: c.color, fontSize: "11px" }}>{c.label}:</span>
              <span style={{ color: "var(--muted)", fontSize: "11px" }}>{c.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", width: "320px" }}>
          <input
            type="text"
            placeholder="Buscar por nome, WhatsApp ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box" as const, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 16px 12px 36px", color: "var(--text)", fontSize: "13px", outline: "none" }}
          />
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "var(--muted)", pointerEvents: "none" }}>🔍</span>
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden", padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
          {(["name", "ltv", "date", "class"] as const).map((field, i) => (
            <button key={field} onClick={() => handleSort(field)} style={{ background: "none", border: "none", textAlign: "left", padding: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: sortBy === field ? "var(--gold)" : "var(--muted)", cursor: "pointer" }}>
              {["Cliente", "LTV Total", "Último pedido", "Classe"][i]}{getSortIndicator(field)}
            </button>
          ))}
        </div>

        {sorted.map((c, i) => {
          const { label, icon, color, bg, border } = classifyCustomer(c.bookings.length, c.totalCents);
          const lastBooking = c.bookings[0];
          const firstWithAffiliate = c.bookings.find((b) => b.affiliateCode && b.affiliateId);
          return (
            <div key={c.customer.id} onClick={() => setSelectedCust(c)} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", gap: 12, padding: "16px 20px", alignItems: "center", borderBottom: i < sorted.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.customer.name ?? "—"}</span>
                  {firstWithAffiliate?.affiliateName && (
                    <a href={`/admin/afiliados/${firstWithAffiliate.affiliateId}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", padding: "1px 6px", borderRadius: 4, textDecoration: "none" }}>
                      {firstWithAffiliate.affiliateName.toUpperCase()}
                    </a>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{c.customer.phone}</span>
                  {c.customer.email && <span style={{ fontSize: 11, color: "var(--muted)" }}>· {c.customer.email}</span>}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: c.bookings.length >= 2 ? color : "var(--text)" }}>{c.bookings.length}</p>
                <p style={{ fontSize: 10, color: "var(--muted)" }}>{c.bookings.length} {c.bookings.length === 1 ? "pedido" : "pedidos"}</p>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#c9a84c" }}>{brl(c.totalCents)}</p>
                <p style={{ fontSize: 10, color: "var(--muted)" }}>{brl(Math.round(c.totalCents / c.bookings.length))} / pedido</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "var(--text)" }}>{fmtDate(lastBooking?.idaDate ?? lastBooking?.createdAt ?? null)}</p>
              </div>
              <div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: bg, color, border: `1px solid ${border}`, fontSize: 11, fontWeight: 700 }}>
                  {icon} {label}
                </span>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div style={{ padding: "64px", textAlign: "center" as const, color: "var(--muted)", fontSize: 13 }}>
            Nenhum cliente encontrado.
          </div>
        )}
      </div>

      {selectedCust && (
        <div onClick={() => setSelectedCust(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "480px", height: "100%", background: "#0d1117", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "32px 28px", boxSizing: "border-box", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{selectedCust.customer.name ?? "Cliente"}</h2>
              <button onClick={() => setSelectedCust(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "50%", width: "32px", height: "32px", color: "var(--text)", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>WhatsApp</p>
              <a href={`https://wa.me/55${selectedCust.customer.phone}`} target="_blank" rel="noreferrer" style={{ color: "#3ecf8e", textDecoration: "none" }}>💬 {selectedCust.customer.phone}</a>
            </div>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", marginBottom: "16px" }}>📋 Histórico de Pedidos ({selectedCust.bookings.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedCust.bookings.map((b) => (
                  <a key={b.id} href={`/admin/reservas/${b.id}`} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--gold)" }}>{b.idaDate ? fmtDate(b.idaDate) : fmtDate(b.createdAt)}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#3ecf8e" }}>{brl(b.totalCents)}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>{b.tipoProduto ?? "Pedido"} {b.quantidade ? `· ${b.quantidade} un` : ""}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
=======
"use client";

import { useState } from "react";

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
    return { label: "Embaixador", icon: "👑", color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)", tier: 3 };
  }
  if (totalBookings >= 2 || totalCents >= 80000) {
    return { label: "VIP", icon: "⭐", color: "#c9a84c", bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.25)", tier: 2 };
  }
  return { label: "Regular", icon: "🤎", color: "#3ecf8e", bg: "rgba(62,207,142,0.08)", border: "rgba(62,207,142,0.2)", tier: 1 };
}

type BookingItem = {
  id: string;
  totalCents: number;
  createdAt: Date;
  tipoProduto?: string;
  quantidade?: number;
  idaDate?: string | null;
  affiliateCode: string | null;
  affiliateName: string | null;
  affiliateId: string | null;
};

type CustomerData = {
  customer: { id: string; name: string | null; phone: string; email: string | null; birthDate: Date | null };
  bookings: BookingItem[];
  totalCents: number;
};

export function ClientesClient({ initialCustomers }: { initialCustomers: CustomerData[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "class" | "ltv">("ltv");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedCust, setSelectedCust] = useState<CustomerData | null>(null);

  const filtered = initialCustomers.filter((c) => {
    const term = search.toLowerCase();
    return (
      (c.customer.name?.toLowerCase().includes(term) ?? false) ||
      c.customer.phone.includes(term) ||
      (c.customer.email?.toLowerCase().includes(term) ?? false)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA: any = "", valB: any = "";
    if (sortBy === "name") { valA = a.customer.name?.toLowerCase() || ""; valB = b.customer.name?.toLowerCase() || ""; }
    else if (sortBy === "date") { valA = new Date(a.bookings[0]?.idaDate ?? a.bookings[0]?.createdAt ?? 0).getTime(); valB = new Date(b.bookings[0]?.idaDate ?? b.bookings[0]?.createdAt ?? 0).getTime(); }
    else if (sortBy === "class") { valA = classifyCustomer(a.bookings.length, a.totalCents).tier; valB = classifyCustomer(b.bookings.length, b.totalCents).tier; }
    else { valA = a.totalCents; valB = b.totalCents; }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  function handleSort(field: "name" | "date" | "class" | "ltv") {
    if (sortBy === field) setSortAsc(!sortAsc);
    else { setSortBy(field); setSortAsc(field === "name" || field === "class"); }
  }

  function getSortIndicator(field: string) {
    if (sortBy !== field) return " ↕";
    return sortAsc ? " ▲" : " ▼";
  }

  const totalCustomers = initialCustomers.length;
  const recorrentes = initialCustomers.filter((c) => c.bookings.length >= 2).length;
  const embaixadores = initialCustomers.filter((c) => c.bookings.length >= 3 || c.totalCents >= 150000).length;
  const totalLTV = initialCustomers.reduce((s, c) => s + c.totalCents, 0);
  const ticketMedioGeral = totalCustomers > 0 ? Math.round(totalLTV / totalCustomers) : 0;

  const cardStyle: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total Clientes", value: totalCustomers, color: "#fff", sub: "com pedido confirmado" },
          { label: "Recorrentes", value: recorrentes, color: "#c9a84c", sub: "2+ pedidos" },
          { label: "Embaixadores", value: embaixadores, color: "#f97316", sub: "3+ pedidos ou R$1.500+" },
          { label: "LTV Médio", value: brl(ticketMedioGeral), color: "#3ecf8e", sub: "por cliente" },
        ].map((k) => (
          <div key={k.label} style={{ ...cardStyle, borderTop: `3px solid ${k.color}33` }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 8 }}>{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap" as const, justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div style={{ ...cardStyle, flex: "1 1 500px", display: "flex", gap: "20px", flexWrap: "wrap" as const, padding: "12px 20px", fontSize: "11px", alignItems: "center" }}>
          {[
            { icon: "👑", label: "Embaixador", desc: "3+ pedidos ou R$1.500+", color: "#f97316" },
            { icon: "⭐", label: "VIP", desc: "2+ pedidos ou R$800+", color: "#c9a84c" },
            { icon: "🤎", label: "Regular", desc: "1 pedido", color: "#3ecf8e" },
          ].map((c) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>{c.icon}</span>
              <span style={{ fontWeight: 700, color: c.color, fontSize: "11px" }}>{c.label}:</span>
              <span style={{ color: "var(--muted)", fontSize: "11px" }}>{c.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", width: "320px" }}>
          <input
            type="text"
            placeholder="Buscar por nome, WhatsApp ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box" as const, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 16px 12px 36px", color: "var(--text)", fontSize: "13px", outline: "none" }}
          />
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "var(--muted)", pointerEvents: "none" }}>🔍</span>
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden", padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
          {(["name", "ltv", "date", "class"] as const).map((field, i) => (
            <button key={field} onClick={() => handleSort(field)} style={{ background: "none", border: "none", textAlign: "left", padding: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: sortBy === field ? "var(--gold)" : "var(--muted)", cursor: "pointer" }}>
              {["Cliente", "LTV Total", "Último pedido", "Classe"][i]}{getSortIndicator(field)}
            </button>
          ))}
        </div>

        {sorted.map((c, i) => {
          const { label, icon, color, bg, border } = classifyCustomer(c.bookings.length, c.totalCents);
          const lastBooking = c.bookings[0];
          const firstWithAffiliate = c.bookings.find((b) => b.affiliateCode && b.affiliateId);
          return (
            <div key={c.customer.id} onClick={() => setSelectedCust(c)} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", gap: 12, padding: "16px 20px", alignItems: "center", borderBottom: i < sorted.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.customer.name ?? "—"}</span>
                  {firstWithAffiliate?.affiliateName && (
                    <a href={`/admin/afiliados/${firstWithAffiliate.affiliateId}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", padding: "1px 6px", borderRadius: 4, textDecoration: "none" }}>
                      {firstWithAffiliate.affiliateName.toUpperCase()}
                    </a>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{c.customer.phone}</span>
                  {c.customer.email && <span style={{ fontSize: 11, color: "var(--muted)" }}>· {c.customer.email}</span>}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: c.bookings.length >= 2 ? color : "var(--text)" }}>{c.bookings.length}</p>
                <p style={{ fontSize: 10, color: "var(--muted)" }}>{c.bookings.length} {c.bookings.length === 1 ? "pedido" : "pedidos"}</p>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#c9a84c" }}>{brl(c.totalCents)}</p>
                <p style={{ fontSize: 10, color: "var(--muted)" }}>{brl(Math.round(c.totalCents / c.bookings.length))} / pedido</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "var(--text)" }}>{fmtDate(lastBooking?.idaDate ?? lastBooking?.createdAt ?? null)}</p>
              </div>
              <div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: bg, color, border: `1px solid ${border}`, fontSize: 11, fontWeight: 700 }}>
                  {icon} {label}
                </span>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div style={{ padding: "64px", textAlign: "center" as const, color: "var(--muted)", fontSize: 13 }}>
            Nenhum cliente encontrado.
          </div>
        )}
      </div>

      {selectedCust && (
        <div onClick={() => setSelectedCust(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "480px", height: "100%", background: "#0d1117", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "32px 28px", boxSizing: "border-box", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{selectedCust.customer.name ?? "Cliente"}</h2>
              <button onClick={() => setSelectedCust(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "50%", width: "32px", height: "32px", color: "var(--text)", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>WhatsApp</p>
              <a href={`https://wa.me/55${selectedCust.customer.phone}`} target="_blank" rel="noreferrer" style={{ color: "#3ecf8e", textDecoration: "none" }}>💬 {selectedCust.customer.phone}</a>
            </div>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", marginBottom: "16px" }}>📋 Histórico de Pedidos ({selectedCust.bookings.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedCust.bookings.map((b) => (
                  <a key={b.id} href={`/admin/reservas/${b.id}`} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--gold)" }}>{b.idaDate ? fmtDate(b.idaDate) : fmtDate(b.createdAt)}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#3ecf8e" }}>{brl(b.totalCents)}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>{b.tipoProduto ?? "Pedido"} {b.quantidade ? `· ${b.quantidade} un` : ""}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
>>>>>>> Stashed changes
