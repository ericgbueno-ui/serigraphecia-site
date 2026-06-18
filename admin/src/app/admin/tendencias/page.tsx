import { requireAdmin } from "@/lib/server/adminAuth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Tendências | Admin Multi Trip",
  robots: { index: false, follow: false },
};

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(n: number, d: number) {
  if (!d) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

function weekKey(d: Date) {
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getBookingDate(b: { publicToken?: string | null; createdAt: Date; idaDate?: Date | null; voltaDate?: Date | null }) {
  if (b.publicToken?.startsWith("hist_")) {
    return b.idaDate ?? b.voltaDate ?? b.createdAt;
  }
  return b.createdAt;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", {
    month: "short", year: "2-digit",
  });
}

function weekLabel(key: string) {
  const d = new Date(key);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function Bar({ value, max, color = "#c9a84c", height = 40 }: { value: number; max: number; color?: string; height?: number }) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{value}</span>
      <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 4, height, display: "flex", alignItems: "flex-end" }}>
        <div style={{
          width: "100%", height: `${pctVal}%`, minHeight: value > 0 ? 2 : 0,
          background: color, borderRadius: 4, transition: "height 0.3s",
        }} />
      </div>
    </div>
  );
}

export default async function TendenciasPage() {
  await requireAdmin();

  const now = new Date();
  const week12Ago = new Date(now); week12Ago.setDate(now.getDate() - 84); // 12 semanas
  const month12Ago = new Date(now); month12Ago.setMonth(now.getMonth() - 12);

  const [allLeads, allBookings] = await Promise.all([
    prisma.lead.findMany({
      where: { createdAt: { gte: month12Ago } },
      select: { createdAt: true, status: true, source: true, whatsapp: true },
    }),
    prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      select: { publicToken: true, createdAt: true, idaDate: true, voltaDate: true, totalCents: true, tripType: true, vehicleType: true, payMethod: true },
    }),
  ]);

  // ── Por semana (últimas 12) ─────────────────────────────────────────────────
  const weekLeads: Record<string, number> = {};
  const weekBookings: Record<string, number> = {};
  const weekRevenue: Record<string, number> = {};

  allLeads.filter(l => new Date(l.createdAt) >= week12Ago).forEach(l => {
    const k = weekKey(new Date(l.createdAt));
    weekLeads[k] = (weekLeads[k] ?? 0) + 1;
  });
  allBookings.filter(b => getBookingDate(b) >= week12Ago).forEach(b => {
    const k = weekKey(getBookingDate(b));
    weekBookings[k] = (weekBookings[k] ?? 0) + 1;
    weekRevenue[k] = (weekRevenue[k] ?? 0) + b.totalCents;
  });

  // Gera as últimas 12 semanas em ordem
  const weeks: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    weeks.push(weekKey(d));
  }
  const uniqueWeeks = [...new Set(weeks)];

  const maxWeekLeads    = Math.max(...uniqueWeeks.map(w => weekLeads[w] ?? 0), 1);
  const maxWeekBookings = Math.max(...uniqueWeeks.map(w => weekBookings[w] ?? 0), 1);
  const maxWeekRevenue  = Math.max(...uniqueWeeks.map(w => weekRevenue[w] ?? 0), 1);

  // ── Por mês (últimos 12) ────────────────────────────────────────────────────
  const monthLeads: Record<string, number> = {};
  const monthBookings: Record<string, number> = {};
  const monthRevenue: Record<string, number> = {};
  const monthConverted: Record<string, number> = {};

  allLeads.forEach(l => {
    const k = monthKey(new Date(l.createdAt));
    monthLeads[k] = (monthLeads[k] ?? 0) + 1;
    if (l.status === "convertido") monthConverted[k] = (monthConverted[k] ?? 0) + 1;
  });
  allBookings.forEach(b => {
    const k = monthKey(getBookingDate(b));
    monthBookings[k] = (monthBookings[k] ?? 0) + 1;
    monthRevenue[k] = (monthRevenue[k] ?? 0) + b.totalCents;
  });

  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }

  const currentMonth = monthKey(now);
  const prevMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  // ── Sazonalidade (agrupa por mês do ano, ignora o ano) ─────────────────────
  const seasonLeads: Record<number, number[]> = {};
  const seasonBookings: Record<number, number[]> = {};
  allLeads.forEach(l => {
    const m = new Date(l.createdAt).getMonth();
    if (!seasonLeads[m]) seasonLeads[m] = [];
    const k = monthKey(new Date(l.createdAt));
    seasonLeads[m].push(monthLeads[k] ?? 0);
  });
  allBookings.forEach(b => {
    const m = getBookingDate(b).getMonth();
    if (!seasonBookings[m]) seasonBookings[m] = [];
    seasonBookings[m].push(1);
  });

  const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const seasonData = monthNames.map((name, i) => ({
    name,
    leads: (seasonLeads[i] ?? []).reduce((s, v) => s + v, 0),
    bookings: (seasonBookings[i] ?? []).length,
  }));
  const maxSeasonLeads = Math.max(...seasonData.map(s => s.leads), 1);
  const maxSeasonBookings = Math.max(...seasonData.map(s => s.bookings), 1);

  // ── Canais com taxa de conversão ───────────────────────────────────────────
  const sourceLeads: Record<string, number> = {};
  const sourceConverted: Record<string, number> = {};
  allLeads.forEach(l => {
    const s = l.source ?? "desconhecido";
    sourceLeads[s] = (sourceLeads[s] ?? 0) + 1;
    if (l.status === "convertido") sourceConverted[s] = (sourceConverted[s] ?? 0) + 1;
  });
  const sourceData = Object.entries(sourceLeads)
    .map(([source, leads]) => ({
      source,
      leads,
      converted: sourceConverted[source] ?? 0,
      rate: Math.round(((sourceConverted[source] ?? 0) / leads) * 100),
    }))
    .sort((a, b) => b.leads - a.leads);
  const maxSourceLeads = Math.max(...sourceData.map(s => s.leads), 1);

  // ── KPIs globais do período ────────────────────────────────────────────────
  const totalLeads12m = allLeads.length;
  const totalBookings12m = allBookings.length;
  const totalRevenue12m = allBookings.reduce((s, b) => s + b.totalCents, 0);
  const totalConvertedLeads = allLeads.filter(l => l.status === "convertido" || l.status === "won" || l.status === "CONVERTED").length;
  const convRate12m = totalLeads12m > 0 ? Math.round((totalConvertedLeads / totalLeads12m) * 100) : 0;

  // Variação mês atual vs anterior
  const varLeads = prevMonth && monthLeads[prevMonth]
    ? Math.round(((monthLeads[currentMonth] ?? 0) - monthLeads[prevMonth]) / monthLeads[prevMonth] * 100)
    : null;
  const varBookings = prevMonth && monthBookings[prevMonth]
    ? Math.round(((monthBookings[currentMonth] ?? 0) - monthBookings[prevMonth]) / monthBookings[prevMonth] * 100)
    : null;

  const card: React.CSSProperties = {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 16, padding: "20px 24px",
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.14em", color: "var(--muted)", marginBottom: 16,
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, color: "var(--text)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <Link href="/admin" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>← Admin</Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>📈 Tendências</h1>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>Histórico dos últimos 12 meses — leads, contratos e faturamento.</p>
        </div>
      </div>

      {/* KPIs 12 meses */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Leads (12 meses)", value: totalLeads12m, color: "#fff", var: varLeads !== null ? `${varLeads > 0 ? "+" : ""}${varLeads}% vs mês ant.` : null },
          { label: "Contratos (12 meses)", value: totalBookings12m, color: "#3ecf8e", var: varBookings !== null ? `${varBookings > 0 ? "+" : ""}${varBookings}% vs mês ant.` : null },
          { label: "Faturamento (12 meses)", value: brl(totalRevenue12m), color: "#c9a84c", var: null },
          { label: "Taxa de Conversão", value: `${convRate12m}%`, color: "#a78bfa", var: "leads → contratos" },
        ].map((k) => (
          <div key={k.label} style={{ ...card, borderTop: `3px solid ${k.color}20` }}>
            <p style={sectionTitle}>{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</p>
            {k.var && (
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{k.var}</p>
            )}
          </div>
        ))}
      </div>

      {/* Últimas 12 semanas */}
      <div style={{ ...card, marginBottom: 24 }}>
        <p style={sectionTitle}>Últimas 12 Semanas</p>
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          {[
            { color: "#c9a84c", label: "Leads" },
            { color: "#3ecf8e", label: "Contratos" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
          {uniqueWeeks.map((w) => (
            <div key={w} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", width: "100%" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 9, color: "var(--muted)", fontWeight: 600 }}>{weekLeads[w] ?? 0}</span>
                  <div style={{ width: "100%", background: "rgba(201,168,76,0.15)", borderRadius: 3, height: 60, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", height: `${Math.round(((weekLeads[w] ?? 0) / maxWeekLeads) * 100)}%`, minHeight: (weekLeads[w] ?? 0) > 0 ? 2 : 0, background: "#c9a84c", borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 9, color: "var(--muted)", fontWeight: 600 }}>{weekBookings[w] ?? 0}</span>
                  <div style={{ width: "100%", background: "rgba(62,207,142,0.1)", borderRadius: 3, height: 60, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", height: `${Math.round(((weekBookings[w] ?? 0) / maxWeekBookings) * 100)}%`, minHeight: (weekBookings[w] ?? 0) > 0 ? 2 : 0, background: "#3ecf8e", borderRadius: 3 }} />
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 8, color: "var(--muted)", whiteSpace: "nowrap" }}>{weekLabel(w)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comparativo Mensal */}
      <div style={{ ...card, marginBottom: 24 }}>
        <p style={sectionTitle}>Comparativo Mensal (12 meses)</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Mês", "Leads", "Contratos", "Faturamento", "Conv."].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: h === "Mês" ? "left" : "right", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const isCurrentMonth = m === currentMonth;
                const isPrevMonth = m === prevMonth;
                return (
                  <tr key={m} style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: isCurrentMonth ? "rgba(201,168,76,0.05)" : "transparent",
                  }}>
                    <td style={{ padding: "10px 12px", fontWeight: isCurrentMonth ? 700 : 400, color: isCurrentMonth ? "#c9a84c" : "var(--text)" }}>
                      {monthLabel(m)}
                      {isCurrentMonth && <span style={{ marginLeft: 6, fontSize: 9, background: "rgba(201,168,76,0.2)", color: "#c9a84c", padding: "1px 6px", borderRadius: 4 }}>atual</span>}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: monthLeads[m] ? "var(--text)" : "var(--muted)" }}>{monthLeads[m] ?? "—"}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: monthBookings[m] ? "#3ecf8e" : "var(--muted)" }}>{monthBookings[m] ?? "—"}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: monthRevenue[m] ? "#c9a84c" : "var(--muted)", fontWeight: monthRevenue[m] ? 600 : 400 }}>
                      {monthRevenue[m] ? brl(monthRevenue[m]) : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--muted)" }}>
                      {monthLeads[m] ? pct(monthConverted[m] ?? 0, monthLeads[m]) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

        {/* Sazonalidade */}
        <div style={card}>
          <p style={sectionTitle}>Sazonalidade Detectada</p>
          <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 16 }}>
            Acumulado histórico por mês — base para previsão de demanda.
          </p>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 100 }}>
            {seasonData.map((s) => {
              const isHigh = [6, 10, 11, 0].includes(monthNames.indexOf(s.name)); // jul, nov, dez, jan
              return (
                <div key={s.name} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: 3, height: 80, display: "flex", alignItems: "flex-end" }}>
                    <div style={{
                      width: "100%",
                      height: `${Math.round((s.leads / maxSeasonLeads) * 100)}%`,
                      minHeight: s.leads > 0 ? 2 : 0,
                      background: isHigh ? "#f97316" : "#c9a84c",
                      borderRadius: 3, opacity: 0.85,
                    }} />
                  </div>
                  <span style={{ fontSize: 8, color: "var(--muted)" }}>{s.name}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--muted)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#f97316" }} /> Alta temporada
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--muted)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#c9a84c" }} /> Período normal
            </div>
          </div>
        </div>

        {/* Taxa por canal */}
        <div style={card}>
          <p style={sectionTitle}>Conversão por Canal (12 meses)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sourceData.slice(0, 6).map((s) => {
              const icon =
                s.source.includes("whatsapp_ad") ? "📱" :
                s.source.includes("checkout") ? "💻" :
                s.source.includes("equipe") ? "📞" :
                s.source.includes("whatsapp") ? "🤖" :
                s.source.includes("indica") ? "🤝" : "📌";
              const label = s.source
                .replace("whatsapp_equipe", "WhatsApp Equipe")
                .replace("whatsapp_ad", "Meta Ads → WA")
                .replace("whatsapp", "Jolie (WA)")
                .replace("checkout", "Checkout Site")
                .replace("site", "Site")
                .replace("abandonment", "Abandono");
              return (
                <div key={s.source}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--text)" }}>{icon} {label}</span>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{s.leads} leads</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.rate > 20 ? "#3ecf8e" : s.rate > 5 ? "#c9a84c" : "var(--muted)" }}>
                        {s.rate}%
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      width: `${Math.round((s.leads / maxSourceLeads) * 100)}%`,
                      background: s.rate > 20 ? "#3ecf8e" : "#c9a84c",
                    }} />
                  </div>
                </div>
              );
            })}
            {sourceData.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>
                Dados de origem começarão a aparecer com os próximos leads captados.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Nota de dados */}
      <div style={{ ...card, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.15)" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          💡 <strong style={{ color: "#a78bfa" }}>Inteligência histórica</strong> — Os gráficos ficam mais precisos com o tempo.
          Com 6+ meses de dados, a sazonalidade detectada se torna base confiável para previsão de demanda
          e calibração automática de campanhas. Continue usando o sistema e os padrões vão emergir naturalmente.
        </p>
      </div>

    </div>
  );
}
