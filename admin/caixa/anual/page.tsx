import { requireAdmin } from "@/lib/server/adminAuth";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fechamento Anual | Admin [NOME DO NEGÓCIO]",
  robots: { index: false, follow: false },
};

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const SYSTEM_START = new Date("2026-05-01T00:00:00.000Z");

function getBookingDate(b: { createdAt: Date; idaDate?: Date | null; voltaDate?: Date | null }) {
  const tripDate = b.idaDate ?? b.voltaDate;
  if (tripDate && tripDate < SYSTEM_START) return tripDate;
  return b.createdAt;
}

function getTripDate(b: { createdAt: Date; idaDate?: Date | null; voltaDate?: Date | null }) {
  return b.idaDate ?? b.voltaDate ?? b.createdAt;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default async function AdminCaixaAnualPage() {
  await requireAdmin();

  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      publicToken: true,
      createdAt: true,
      idaDate: true,
      voltaDate: true,
      totalCents: true,
      remainderCents: true,
      optionalsJson: true,
    },
  });

  // ── Breakdown por mês ──
  const byMonth: Record<
    string,
    { agendamentos: number; faturamento: number; recebido: number; aReceber: number; driverPayment: number }
  > = {};

  for (const b of bookings) {
    // Faturamento e recebido: híbrido (hist_ por atendimento, novas por criação)
    const createdKey = monthKey(getBookingDate(b));
    if (!byMonth[createdKey]) byMonth[createdKey] = { agendamentos: 0, faturamento: 0, recebido: 0, aReceber: 0, driverPayment: 0 };
    byMonth[createdKey].agendamentos += 1;
    byMonth[createdKey].faturamento += b.totalCents;
    byMonth[createdKey].recebido += b.totalCents - b.remainderCents;

    // A receber: mês de chegada do cliente
    if (b.remainderCents > 0) {
      const tripKey = monthKey(getTripDate(b));
      if (!byMonth[tripKey]) byMonth[tripKey] = { agendamentos: 0, faturamento: 0, recebido: 0, aReceber: 0, driverPayment: 0 };
      byMonth[tripKey].aReceber += b.remainderCents;
    }

    try {
      const opts = JSON.parse(b.optionalsJson ?? "{}");
      const inPay = typeof opts._driverInPaymentCents === "number" ? opts._driverInPaymentCents : 0;
      const outPay = typeof opts._driverOutPaymentCents === "number" ? opts._driverOutPaymentCents : 0;
      const tourPay = typeof opts._driverCityTourPaymentCents === "number" ? opts._driverCityTourPaymentCents : 0;
      byMonth[createdKey].driverPayment += (inPay + outPay + tourPay);
    } catch {}
  }

  const monthsSorted = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  return (
    <div className="caixa-page">
      <style>{`
        .caixa-page { padding: 32px 40px; color: var(--text); background: var(--bg); }
        .caixa-page > div { max-width: 1200px; margin: 0 auto; }
        .caixa-header { margin-bottom: 32px; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .caixa-title-block h1 { font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .caixa-title-block p { font-size: 13px; color: var(--muted); }
        .btn-voltar {
          font-size: 12px;
          color: var(--muted);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          transition: color 0.15s, border-color 0.15s;
        }
        .btn-voltar:hover {
          color: var(--text);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .caixa-month-grid { display: grid; grid-template-columns: 1.6fr 0.7fr 1.2fr 1.2fr 1.2fr 1.2fr 120px; gap: 12px; padding: 12px 20px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02); }
        .caixa-month-row { display: grid; grid-template-columns: 1.6fr 0.7fr 1.2fr 1.2fr 1.2fr 1.2fr 120px; gap: 12px; padding: 14px 20px; align-items: center; }
        @media (max-width: 768px) {
          .caixa-page { padding: 20px 16px; }
          .caixa-col-hide { display: none; }
          .caixa-month-grid, .caixa-month-row { grid-template-columns: 1.2fr 1fr 1fr 1fr; }
        }
      `}</style>
      <div>
        <div className="caixa-header">
          <div className="caixa-title-block">
            <h1>Entradas e Fechamento por Período</h1>
            <p>Relatório anualizado de agendamentos, recebimentos e lucros brutos mês a mês.</p>
          </div>
          <Link href="/admin/caixa" className="btn-voltar">
            ← Voltar ao Caixa
          </Link>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            overflow: "hidden",
            marginBottom: "32px"
          }}
        >
          <div className="caixa-month-grid">
            {["Período", "Agendamentos", "Faturamento", "Recebido", "Lucro Bruto", "A Receber", "Cobertura"].map(
              (h) => (
                <span
                  key={h}
                  className={h === "Agendamentos" || h === "A Receber" ? "caixa-col-hide" : ""}
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--muted)",
                  }}
                >
                  {h}
                </span>
              )
            )}
          </div>

          {monthsSorted.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
              Nenhuma entrada registrada ainda.
            </div>
          ) : (
            monthsSorted.map((key, i) => {
              const m = byMonth[key];
              const pct = m.faturamento > 0 ? Math.round((m.recebido / m.faturamento) * 100) : 0;
              const lucroBruto = m.recebido - m.driverPayment;
              
              return (
                <div
                  key={key}
                  className="caixa-month-row"
                  style={{ borderBottom: i < monthsSorted.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <Link
                    href={`/admin/agendamentos?month=${key}`}
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--gold)",
                      textTransform: "capitalize",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "color 0.1s",
                    }}
                    className="hover:text-amber-400"
                  >
                    {monthLabel(key)} <span style={{ fontSize: "10px", opacity: 0.6 }}>🔍</span>
                  </Link>
                  <Link
                    href={`/admin/agendamentos?month=${key}`}
                    style={{
                      fontSize: "13px",
                      color: "var(--text)",
                      textDecoration: "none",
                      fontWeight: 600,
                      transition: "color 0.1s",
                    }}
                    className="caixa-col-hide hover:text-[var(--gold)]"
                  >
                    {m.agendamentos}
                  </Link>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                    {brl(m.faturamento)}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#3ecf8e" }}>
                    {brl(m.recebido)}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: lucroBruto >= 0 ? "#3ecf8e" : "#f87171" }}>
                    {brl(lucroBruto)}
                  </span>
                  <span
                    className="caixa-col-hide"
                    style={{
                      fontSize: "13px",
                      color: m.aReceber > 0 ? "#c9a84c" : "var(--muted)",
                      fontWeight: m.aReceber > 0 ? 600 : 400,
                    }}
                  >
                    {m.aReceber > 0 ? brl(m.aReceber) : "—"}
                  </span>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div
                      style={{
                        height: "6px",
                        borderRadius: "100px",
                        background: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          borderRadius: "100px",
                          background: pct === 100 ? "#3ecf8e" : "#c9a84c",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--muted)" }}>{pct}% recebido</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
