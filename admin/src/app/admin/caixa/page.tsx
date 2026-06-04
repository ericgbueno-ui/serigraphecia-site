import { requireAdmin } from "@/lib/server/adminAuth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AReceberCard } from "./AReceberCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fluxo de Caixa | Admin Multi Trip",
  robots: { index: false, follow: false },
};

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Corte do sistema: viagens com chegada antes de maio/2026 são históricas
const SYSTEM_START = new Date("2026-05-01T00:00:00.000Z");

// Histórico (chegada antes de mai/2026): grupo pelo mês de chegada.
// Novo (chegada em mai/2026+): grupo pelo mês de criação do contrato.
function getBookingDate(b: { createdAt: Date; idaDate?: Date | null; voltaDate?: Date | null }) {
  const tripDate = b.idaDate ?? b.voltaDate;
  if (tripDate && tripDate < SYSTEM_START) return tripDate;
  return b.createdAt;
}

// A Receber: sempre pelo mês de chegada do cliente (quando ele paga o restante)
function getTripDate(b: { createdAt: Date; idaDate?: Date | null; voltaDate?: Date | null }) {
  return b.idaDate ?? b.voltaDate ?? b.createdAt;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function vehicleLabel(v: string) {
  const map: Record<string, string> = {
    sedan: "Sedan Premium",
    van: "Spin 6L",
    executivo: "Executivo",
    suv: "SUV",
    suv_eletrico: "SUV Elétrico",
  };
  return map[v] ?? v;
}

function tripLabel(t: string) {
  if (t === "so_citytour") return "Somente City Tour";
  if (t === "ida_volta") return "Ida + Volta";
  if (t === "volta") return "Retorno";
  return "Ida";
}

export default async function AdminCaixaPage() {
  await requireAdmin();

  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      publicToken: true,
      createdAt: true,
      status: true,
      tripType: true,
      vehicleType: true,
      passengerCount: true,
      hotel: true,
      idaDate: true,
      idaFlightNumber: true,
      voltaDate: true,
      voltaFlightNumber: true,
      totalCents: true,
      payMethod: true,
      affiliateCode: true,
      remainderCents: true,
      routeLabel: true,
      optionalsJson: true,
      driverInName: true,
      driverOutName: true,
      driverCityTourName: true,
      customer: { select: { name: true, phone: true } },
    },
  });

  // ── Datas de referência ────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const currentMonth = today.slice(0, 7);

  // ── Gastos com Motoristas — lê de optionalsJson (sem migration) ──────────
  const driverPayments = bookings
    .map((b) => {
      let opts: Record<string, unknown> = {};
      try { opts = JSON.parse(b.optionalsJson ?? "{}"); } catch {}
      const inPay = typeof opts._driverInPaymentCents === "number" ? opts._driverInPaymentCents : 0;
      const outPay = typeof opts._driverOutPaymentCents === "number" ? opts._driverOutPaymentCents : 0;
      const tourPay = typeof opts._driverCityTourPaymentCents === "number" ? opts._driverCityTourPaymentCents : 0;
      return {
        id: b.id,
        name: b.customer?.name ?? "—",
        createdAt: b.createdAt,
        inPayment: inPay,
        outPayment: outPay,
        cityTourPayment: tourPay,
        total: inPay + outPay + tourPay,
        driverInName: b.driverInName,
        driverOutName: b.driverOutName,
        driverCityTourName: b.driverCityTourName,
      };
    })
    .filter((b) => b.total > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const driverPaymentMonth = driverPayments
    .filter((r: any) => monthKey(new Date(r.createdAt)) === currentMonth)
    .reduce((s: number, r: any) => s + r.total, 0);



  // ── Roteiros e Cashbacks Calculations ──
  const standardRoteiros = bookings.filter(
    (b) => b.vehicleType === "roteiro" && b.totalCents === 2990
  );
  const curadoriaJolieBookings = bookings.filter(
    (b) => b.vehicleType === "roteiro" && b.totalCents === 15000
  );

  const standardQty = standardRoteiros.length;
  const standardRevenue = standardRoteiros.reduce((sum, b) => sum + b.totalCents, 0);

  const curadoriaQty = curadoriaJolieBookings.length;
  const curadoriaRevenue = curadoriaJolieBookings.reduce((sum, b) => sum + b.totalCents, 0);

  // Total cashbacks gerados: R$ 150 para cada Curadoria Jolie
  const cashbackGeneratedCents = curadoriaQty * 15000;

  // Somar todos os cashbacks resgatados em todas as reservas confirmadas
  let totalCashbackRedeemedCents = 0;
  for (const b of bookings) {
    try {
      const opts = JSON.parse(b.optionalsJson ?? "{}");
      if (opts && typeof opts === "object" && "_cashbackRedeemedCents" in opts) {
        totalCashbackRedeemedCents += Number(opts._cashbackRedeemedCents) || 0;
      }
    } catch {}
  }

  const cashbackBalanceCents = Math.max(0, cashbackGeneratedCents - totalCashbackRedeemedCents);

  // ── KPIs do mês atual ──
  // Faturamento e recebido: híbrido (hist_ por viagem, novas por criação)
  const bookingsCreatedThisMonth = bookings.filter(
    (b) => monthKey(getBookingDate(b)) === currentMonth
  );
  // A Receber: reservas com chegada neste mês (quando o cliente paga o restante)
  const bookingsArrivingThisMonth = bookings.filter(
    (b) => monthKey(getTripDate(b)) === currentMonth
  );

  const faturamentoMes = bookingsCreatedThisMonth.reduce((s, b) => s + b.totalCents, 0);
  const recebidoMes = bookingsCreatedThisMonth.reduce((s, b) => s + (b.totalCents - b.remainderCents), 0);
  const aReceberMes = bookingsArrivingThisMonth.reduce((s, b) => s + b.remainderCents, 0);
  const ticketMedioMes = bookingsCreatedThisMonth.length > 0 ? Math.round(faturamentoMes / bookingsCreatedThisMonth.length) : 0;
  const pixCountMes = bookingsCreatedThisMonth.filter((b) => b.payMethod === "pix" || b.payMethod === "pix_50").length;
  const cartaoCountMes = bookingsCreatedThisMonth.filter((b) => b.payMethod === "cartao").length;

  const pendingBookingsMes = bookingsArrivingThisMonth
    .filter((b) => b.remainderCents > 0)
    .map((b) => ({
      id: b.id,
      customerName: b.customer?.name ?? "—",
      remainderCents: b.remainderCents,
      idaDate: b.idaDate ? b.idaDate.toISOString().slice(0, 10) : null,
      voltaDate: b.voltaDate ? b.voltaDate.toISOString().slice(0, 10) : null,
      tripType: b.tripType,
      payMethod: b.payMethod,
    }))
    .sort((a, b) => {
      const da = (a.tripType === "volta" ? a.voltaDate : a.idaDate) ?? "9999";
      const db_ = (b.tripType === "volta" ? b.voltaDate : b.idaDate) ?? "9999";
      return da.localeCompare(db_);
    });

  // ── Lucro do mês ──
  const recebidoRoteirosMes = bookingsCreatedThisMonth
    .filter((b) => b.vehicleType === "roteiro")
    .reduce((s, b) => s + (b.totalCents - b.remainderCents), 0);

  const recebidoFrotaMes = recebidoMes - recebidoRoteirosMes;

  const lucroMes = recebidoMes - driverPaymentMonth;

  // ── Breakdown por mês ──
  // Faturamento e recebido: agrupados por data de criação
  // A Receber: agrupado por data de chegada (quando o cliente paga o restante)
  const byMonth: Record<
    string,
    { reservas: number; faturamento: number; recebido: number; aReceber: number; driverPayment: number }
  > = {};

  for (const b of bookings) {
    const createdKey = monthKey(b.createdAt);
    if (!byMonth[createdKey]) byMonth[createdKey] = { reservas: 0, faturamento: 0, recebido: 0, aReceber: 0, driverPayment: 0 };
    byMonth[createdKey].reservas += 1;
    byMonth[createdKey].faturamento += b.totalCents;
    byMonth[createdKey].recebido += b.totalCents - b.remainderCents;

    // A receber vai para o mês de chegada
    if (b.remainderCents > 0) {
      const tripKey = monthKey(getTripDate(b));
      if (!byMonth[tripKey]) byMonth[tripKey] = { reservas: 0, faturamento: 0, recebido: 0, aReceber: 0, driverPayment: 0 };
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
        .caixa-page { padding: 32px 40px; }
        .caixa-page > div { max-width: 1200px; }
        .caixa-header { margin-bottom: 32px; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .caixa-kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 32px; }
        .caixa-driver-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px; }
        .caixa-ads-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; align-items: center; }
        .caixa-month-grid { display: grid; grid-template-columns: 1.8fr 0.7fr 1.2fr 1.2fr 1.2fr 120px; gap: 12px; padding: 12px 20px; }
        .caixa-month-row { display: grid; grid-template-columns: 1.8fr 0.7fr 1.2fr 1.2fr 1.2fr 120px; gap: 12px; padding: 14px 20px; align-items: center; }
        .caixa-entry-grid { display: grid; grid-template-columns: 1.6fr 1.2fr 1fr 1fr 1fr auto; gap: 12px; padding: 12px 20px; }
        .caixa-entry-row { display: grid; grid-template-columns: 1.6fr 1.2fr 1fr 1fr 1fr auto; gap: 12px; padding: 14px 20px; align-items: center; text-decoration: none; color: inherit; transition: background 0.12s; }
        .caixa-driver-row { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr; gap: 12px; padding: 13px 20px; align-items: center; text-decoration: none; color: inherit; transition: background 0.12s; }
        .caixa-driver-head { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr; gap: 12px; padding: 10px 20px; }
        .caixa-col-hide { }
        @media (max-width: 767px) {
          .caixa-page { padding: 16px; }
          .caixa-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .caixa-driver-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .caixa-ads-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
          .caixa-month-grid { grid-template-columns: 1fr 1fr 1fr; }
          .caixa-month-row { grid-template-columns: 1fr 1fr 1fr; }
          .caixa-entry-grid { grid-template-columns: 1fr 1fr 1fr; }
          .caixa-entry-row { grid-template-columns: 1fr 1fr 1fr; }
          .caixa-driver-row { grid-template-columns: 1.4fr 1fr 1fr; }
          .caixa-driver-head { grid-template-columns: 1.4fr 1fr 1fr; }
          .caixa-col-hide { display: none; }
        }
      `}</style>
      <div>

        {/* ── Cabeçalho ── */}
        <div className="caixa-header">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Fluxo de Caixa</h1>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
              Entradas das reservas confirmadas — separado por período.
            </p>
          </div>
          <Link
            href="/admin/reservas"
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
              transition: "color 0.15s",
            }}
          >
            ← Reservas
          </Link>
        </div>

        {/* ── KPI Cards (5) ── */}
        <div className="caixa-kpi-grid">
          {[
            {
              label: "Faturamento (Mês)",
              value: brl(faturamentoMes),
              sub: `${bookingsCreatedThisMonth.length} reservas confirmadas`,
              color: "var(--text)",
              accent: "var(--border)",
            },
            {
              label: "Já Entrou (Mês)",
              value: brl(recebidoMes),
              sub: faturamentoMes > 0
                ? `${Math.round((recebidoMes / faturamentoMes) * 100)}% das vendas`
                : "—",
              color: "#3ecf8e",
              accent: "rgba(62,207,142,0.25)",
            },
            null, // substituído por AReceberCard abaixo
            {
              label: "Ticket Médio (Mês)",
              value: brl(ticketMedioMes),
              sub: "por reserva confirmada",
              color: "#a78bfa",
              accent: "rgba(167,139,250,0.25)",
            },
            {
              label: "Forma de Pgto (Mês)",
              value: `${pixCountMes} PIX`,
              sub: `${cartaoCountMes} cartão`,
              color: "#60a5fa",
              accent: "rgba(96,165,250,0.25)",
            },
          ].map((c, idx) =>
            c === null ? (
              <AReceberCard
                key="a-receber"
                aReceberTotal={aReceberMes}
                faturamentoTotal={faturamentoMes}
                pendingBookings={pendingBookingsMes}
              />
            ) : (
              <div
                key={c.label}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid var(--border)`,
                  borderTop: `3px solid ${c.accent}`,
                  borderRadius: "14px",
                  padding: "18px 20px",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--muted)",
                    marginBottom: "10px",
                  }}
                >
                  {c.label}
                </p>
                <p style={{ fontSize: "20px", fontWeight: 800, color: c.color, lineHeight: 1 }}>
                  {c.value}
                </p>
                <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>{c.sub}</p>
              </div>
            )
          )}
        </div>

        {/* ── Card Lucro do Mês ── */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              background: lucroMes >= 0 ? "rgba(62,207,142,0.07)" : "rgba(248,113,113,0.07)",
              border: `1px solid ${lucroMes >= 0 ? "rgba(62,207,142,0.35)" : "rgba(248,113,113,0.35)"}`,
              borderRadius: "14px",
              padding: "20px 24px",
              marginBottom: "16px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--muted)", marginBottom: "6px" }}>
                  💰 Lucro do Mês — {monthLabel(currentMonth)}
                </p>
                <p style={{ fontSize: "28px", fontWeight: 900, color: lucroMes >= 0 ? "#3ecf8e" : "#f87171", lineHeight: 1 }}>
                  {brl(lucroMes)}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "right" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Recebido Frota: <strong style={{ color: "var(--text)" }}>{brl(recebidoFrotaMes)}</strong>
                </span>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  + Roteiros / Guias: <strong style={{ color: "#a78bfa" }}>{brl(recebidoRoteirosMes)}</strong>
                </span>
                <span style={{ fontSize: "12px", color: "#f87171" }}>
                  − Motoristas: <strong>{brl(driverPaymentMonth)}</strong>
                </span>
              </div>
            </div>

          </div>

          {/* Botão de redirecionamento para o Relatório Detalhado (Posicionado diretamente abaixo do Lucro do Mês) */}
          <div>
            <Link
              href="/admin/caixa/motoristas"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text)",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "12px 20px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                transition: "background 0.15s, border-color 0.15s, transform 0.1s",
              }}
              className="hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98]"
            >
              📋 Ver Relatório Detalhado e Auditoria de Motoristas →
            </Link>
          </div>
        </div>

        {/* ── Roteiros & Cashbacks ── */}
        <div style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--muted)",
              marginBottom: "12px",
            }}
          >
            Roteiros & Cashbacks
          </h2>

          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Roteiro Padrão Card */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#a78bfa",
                    background: "rgba(167, 139, 250, 0.1)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    display: "inline-block",
                    marginBottom: "12px",
                  }}
                >
                  Roteiro Padrão
                </span>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                  Guia Essencial Digital
                </p>
                <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                  Sem Cashback (100% de Lucro Líquido para Meta Ads)
                </p>
              </div>
              <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <p style={{ fontSize: "10px", color: "var(--muted)" }}>Vendas</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{standardQty}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "10px", color: "var(--muted)" }}>Faturamento</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#3ecf8e" }}>{brl(standardRevenue)}</p>
                </div>
              </div>
            </div>

            {/* Curadoria Jolie Card */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--gold)",
                    background: "var(--gold-dim)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    display: "inline-block",
                    marginBottom: "12px",
                  }}
                >
                  Curadoria Jolie
                </span>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                  Roteiro Personalizado
                </p>
                <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                  Gera R$ 150,00 de bônus / cashback para Transfers
                </p>
              </div>
              <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <p style={{ fontSize: "10px", color: "var(--muted)" }}>Curadorias</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{curadoriaQty}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "10px", color: "var(--muted)" }}>Faturamento</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#3ecf8e" }}>{brl(curadoriaRevenue)}</p>
                </div>
              </div>
            </div>

            {/* Cashback Stats Card */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#3ecf8e",
                    background: "rgba(62, 207, 142, 0.1)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    display: "inline-block",
                    marginBottom: "12px",
                  }}
                >
                  Visão Geral de Cashbacks
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "var(--muted)" }}>Gerado (Bônus):</span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{brl(cashbackGeneratedCents)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "var(--muted)" }}>Resgatado (Deduções):</span>
                    <span style={{ fontWeight: 600, color: "#f87171" }}>-{brl(totalCashbackRedeemedCents)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "8px" }}>
                    <span style={{ color: "var(--muted)" }}>Saldo de Cashback:</span>
                    <span style={{ fontWeight: 700, color: "#3ecf8e" }}>{brl(cashbackBalanceCents)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prazo e Regras Card */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "16px 20px",
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--gold)" }}>
                ⏳ Prazo e Validade de Uso do Cashback
              </p>
              <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                Os créditos de cashback gerados na contratação do roteiro personalizado (**Curadoria Jolie**) têm o prazo estrito de validade de **12 meses (1 ano)** a contar da data de compra do roteiro. Decorrido este prazo, o saldo expira automaticamente caso não tenha sido resgatado na contratação de transfers ou city tours privativos.
              </p>
            </div>
          </div>
        </div>

        {/* ── Meta Ads Spend ── */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--muted)",
              }}
            >
              Investimento Meta Ads
            </h2>
            {lastFetch && (
              <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                Atualizado às{" "}
                {new Date(lastFetch).toLocaleTimeString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {new Date(lastFetch).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </span>
            )}
          </div>

          {metaAdsError ? (
            <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "14px", padding: "16px 20px", fontSize: "13px", color: "#f87171" }}>
              ⚠️ Erro ao conectar com o Facebook Ads. Verifique se o seu Token de Acesso não expirou no painel de desenvolvedor da Meta.
            </div>
          ) : adSpendRows.length === 0 ? (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
              Nenhum dado ainda — keys configuradas, aguardando primeira sincronização.
            </div>
          ) : (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px 24px" }}>
              <div className="caixa-ads-grid">
              {[
                { label: "Gasto Hoje", value: `R$ ${adSpendToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "#f97316" },
                { label: "Total do Mês", value: `R$ ${adSpendMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "#fb923c" },
                { label: "CPA do Mês", value: cpaMonth != null ? `R$ ${cpaMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—", color: cpaMonth != null && cpaMonth < 150 ? "#3ecf8e" : "#c9a84c" },
                { label: `${adSpendRows.length} de ${lastDayOfMonth} dias`, value: `01–${String(lastDayOfMonth).padStart(2,"0")}/${String(currentMonthNum).padStart(2,"0")}`, color: "var(--muted)" },
              ].map((c) => (
                <div key={c.label}>
                  <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "6px" }}>{c.label}</p>
                  <p style={{ fontSize: "18px", fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</p>
                </div>
              ))}
              <Link
                href="/admin/caixa/ads"
                style={{
                  gridColumn: "1 / -1",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#fb923c",
                  textDecoration: "none",
                  marginTop: "4px",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "14px",
                }}
              >
                Ver histórico diário →
              </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Breakdown Mensal (Botão) ── */}
        {monthsSorted.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            {/* Botão de redirecionamento para o Relatório Anual (Entradas por Período) */}
            <div>
              <Link
                href="/admin/caixa/anual"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text)",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "12px 20px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "32px",
                  transition: "background 0.15s, border-color 0.15s, transform 0.1s",
                }}
                className="hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98]"
              >
                📊 Ver Relatório Detalhado de Receitas Anuais →
              </Link>
            </div>
          </div>
        )}

        {/* ── Lista de Entradas ── */}
        <h2
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--muted)",
            marginBottom: "12px",
          }}
        >
          Entradas (Reservas Confirmadas)
        </h2>

        {bookings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "var(--muted)",
              fontSize: "14px",
              background: "var(--bg-card)",
              borderRadius: "14px",
              border: "1px solid var(--border)",
            }}
          >
            Nenhuma entrada registrada.
          </div>
        ) : (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              className="caixa-entry-grid"
              style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}
            >
              {["Cliente", "Rota / Veículo", "Total", "Recebido", "A Receber", ""].map((h) => (
                <span
                  key={h}
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
              ))}
            </div>

            {bookings.map((b, i) => {
              const recebido = b.totalCents - b.remainderCents;
              return (
                <Link
                  key={b.id}
                  href={`/admin/reservas/${b.id}`}
                  className="caixa-entry-row hover:bg-white/[0.02]"
                  style={{ borderBottom: i < bookings.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  {/* Cliente */}
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                      {b.customer?.name || "—"}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                      {formatDate(b.createdAt)}
                      {b.idaDate ? ` · ✈️ ${formatDate(b.idaDate)}` : ""}
                    </p>
                  </div>

                  {/* Rota / Veículo */}
                  <div className="caixa-col-hide">
                    <p style={{ fontSize: "12px", color: "var(--text)" }}>
                      {tripLabel(b.tripType)}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                      {vehicleLabel(b.vehicleType)}
                    </p>
                  </div>

                  {/* Total */}
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                      {brl(b.totalCents)}
                    </p>
                    <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px", textTransform: "uppercase" }}>
                      {b.payMethod === "pix" ? "PIX" : "Cartão"}
                    </p>
                  </div>

                  {/* Recebido */}
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#3ecf8e" }}>
                    {brl(recebido)}
                  </p>

                  {/* A Receber */}
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: b.remainderCents > 0 ? 600 : 400,
                      color: b.remainderCents > 0 ? "#c9a84c" : "var(--muted)",
                    }}
                  >
                    {b.remainderCents > 0 ? brl(b.remainderCents) : "—"}
                  </p>

                  {/* Método badge */}
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "100px",
                      color: b.remainderCents === 0 ? "#3ecf8e" : "#c9a84c",
                      background: b.remainderCents === 0
                        ? "rgba(62,207,142,0.1)"
                        : "rgba(201,168,76,0.1)",
                      border: `1px solid ${b.remainderCents === 0
                        ? "rgba(62,207,142,0.25)"
                        : "rgba(201,168,76,0.3)"}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b.remainderCents === 0 ? "Quitado" : "Parcial"}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
