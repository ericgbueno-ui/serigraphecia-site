import { requireAdmin } from "@/lib/server/adminAuth";
import Link from "next/link";
import { toBrtDateString, fetchMetaAdInsights } from "@/lib/meta-ads";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meta Ads — Histórico | Admin [NOME DO NEGÓCIO]",
  robots: { index: false, follow: false },
};

export default async function MetaAdsDetailPage() {
  await requireAdmin();

  const today = toBrtDateString();
  const currentMonth = today.slice(0, 7);
  const [currentYear, currentMonthNum] = currentMonth.split("-").map(Number);
  const lastDayOfMonth = new Date(currentYear, currentMonthNum, 0).getDate();
  const monthStart = `${currentMonth}-01`;

  let rows: Awaited<ReturnType<typeof fetchMetaAdInsights>> = [];
  let error: string | null = null;

  try {
    rows = await fetchMetaAdInsights(monthStart, today);
    rows = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  } catch (err: any) {
    error = err?.message ?? "Erro ao buscar dados do Meta Ads";
  }

  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "—";

  function brl(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ maxWidth: "900px" }}>

        {/* Cabeçalho */}
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
              Meta Ads — Histórico
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
              Gasto diário de 01/{String(currentMonthNum).padStart(2, "0")}/{currentYear} a {String(lastDayOfMonth).padStart(2, "0")}/{String(currentMonthNum).padStart(2, "0")}/{currentYear}
            </p>
          </div>
          <Link
            href="/admin/caixa"
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
            }}
          >
            ← Caixa
          </Link>
        </div>

        {error ? (
          <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "14px", padding: "24px", color: "#f87171" }}>
            ⚠️ {error}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "48px", textAlign: "center", color: "var(--muted)" }}>
            Nenhum dado para este período.
          </div>
        ) : (
          <>
            {/* Totais do mês */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
              {[
                { label: "Total Gasto", value: brl(totalSpend), color: "#fb923c" },
                { label: "Impressões", value: totalImpressions.toLocaleString("pt-BR"), color: "var(--text)" },
                { label: "Cliques", value: totalClicks.toLocaleString("pt-BR"), color: "var(--text)" },
                { label: "CTR Médio", value: `${avgCtr}%`, color: "#60a5fa" },
              ].map((c) => (
                <div key={c.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "8px" }}>{c.label}</p>
                  <p style={{ fontSize: "20px", fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Tabela diária */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "12px", padding: "10px 20px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                {["Data", "Gasto (R$)", "Impressões", "Cliques", "CTR"].map((h) => (
                  <span key={h} style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)" }}>{h}</span>
                ))}
              </div>

              {rows.map((r, i) => {
                const ctr = r.impressions > 0 ? ((r.clicks / r.impressions) * 100).toFixed(2) : "—";
                const isToday = r.date === today;
                return (
                  <div
                    key={r.date}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                      gap: "12px",
                      padding: "12px 20px",
                      alignItems: "center",
                      borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                      background: isToday ? "rgba(249,115,22,0.04)" : "transparent",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: isToday ? 700 : 400, color: isToday ? "#f97316" : "var(--text)" }}>
                      {new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR")}
                      {isToday && <span style={{ fontSize: "9px", marginLeft: "6px", color: "#f97316" }}>HOJE</span>}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#fb923c" }}>
                      {r.spend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{r.impressions.toLocaleString("pt-BR")}</span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{r.clicks.toLocaleString("pt-BR")}</span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ctr !== "—" ? `${ctr}%` : "—"}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
