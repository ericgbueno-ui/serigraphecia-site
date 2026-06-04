import { requireAdmin } from "@/lib/server/adminAuth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import MonthSelector from "./MonthSelector";
import { AReceberCard } from "../caixa/AReceberCard";

export const dynamic = "force-dynamic";

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

function tripLabel(t: string) {
  if (t === "so_citytour") return "Somente City Tour";
  if (t === "ida_volta") return "Chegada In + Retorno Out";
  if (t === "volta") return "Retorno Out";
  return "Chegada In";
}

function statusBadge(s: string): { label: string; color: string; bg: string; border: string } {
  if (s === "CONFIRMED")
    return {
      label: "Confirmada",
      color: "#3ecf8e",
      bg: "rgba(62,207,142,0.1)",
      border: "rgba(62,207,142,0.25)",
    };
  if (s === "CANCELLED")
    return {
      label: "Cancelada",
      color: "#f87171",
      bg: "rgba(248,113,113,0.1)",
      border: "rgba(248,113,113,0.25)",
    };
  return {
    label: "Pendente",
    color: "#c9a84c",
    bg: "rgba(201,168,76,0.1)",
    border: "rgba(201,168,76,0.3)",
  };
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

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const PAGE_SIZE = 100;

export default async function AdminReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; month?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const selectedMonth = params.month ?? monthKey(new Date());

  // Obter intervalo do mês selecionado
  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1; // 0-indexed

  const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));

  // Corte do sistema: viagens com chegada antes de mai/2026 são históricas.
  const SYSTEM_START = new Date("2026-05-01T00:00:00.000Z");
  // Para históricos: só busca chegadas no mês SE o mês for anterior a mai/2026
  const historicalEnd = endOfMonth <= SYSTEM_START ? endOfMonth : SYSTEM_START;

  // Contratos do mês (lista + KPIs de faturamento/recebido):
  // - Histórico (chegada antes de mai/2026): filtra pela data de chegada
  // - Sistema novo (chegada em mai/2026+): filtra pela data de criação do contrato
  const monthWhere = {
    OR: [
      // Histórico: chegada neste mês, antes do sistema
      {
        OR: [
          { idaDate: { gte: startOfMonth, lt: historicalEnd } },
          { idaDate: null, voltaDate: { gte: startOfMonth, lt: historicalEnd } },
        ],
      },
      // Sistema novo: contrato feito neste mês, com viagem em mai/2026+
      {
        createdAt: { gte: startOfMonth, lt: endOfMonth },
        OR: [
          { idaDate: { gte: SYSTEM_START } },
          { idaDate: null, voltaDate: { gte: SYSTEM_START } },
          { idaDate: null, voltaDate: null },
        ],
      },
    ],
  };

  // A Receber: sempre pela data de chegada (quando o cliente paga o restante)
  const tripMonthWhere = {
    OR: [
      { idaDate: { gte: startOfMonth, lt: endOfMonth } },
      { idaDate: null, voltaDate: { gte: startOfMonth, lt: endOfMonth } },
    ],
  };

  const [allMonthBookings, aReceberBookings, bookings] = await Promise.all([
    // Contratos do mês → KPIs de faturamento/recebido + contagem da lista
    prisma.booking.findMany({
      where: monthWhere,
      select: { status: true, totalCents: true, remainderCents: true, payMethod: true },
    }),
    // Chegadas com saldo pendente → A Receber
    prisma.booking.findMany({
      where: { ...tripMonthWhere, status: "CONFIRMED", remainderCents: { gt: 0 } },
      select: { remainderCents: true },
    }),
    // Lista de contratos (paginada)
    prisma.booking.findMany({
      where: monthWhere,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        createdAt: true,
        status: true,
        tripType: true,
        vehicleType: true,
        passengerCount: true,
        hotel: true,
        idaDate: true,
        idaFlightTime: true,
        idaFlightNumber: true,
        voltaDate: true,
        voltaFlightTime: true,
        voltaFlightNumber: true,
        totalCents: true,
        payMethod: true,
        affiliateCode: true,
        remainderCents: true,
        idaConcluida: true,
        voltaConcluida: true,
        customer: { select: { name: true, phone: true } },
      },
    }),
  ]);

  const totalCount = allMonthBookings.length;
  const confirmedCount = allMonthBookings.filter((b) => b.status === "CONFIRMED").length;

  const confirmedBookings = allMonthBookings.filter((b) => b.status === "CONFIRMED");
  const faturamentoMes = confirmedBookings.reduce((sum, b) => sum + b.totalCents, 0);
  const recebidoMes = confirmedBookings.reduce((sum, b) => sum + (b.totalCents - b.remainderCents), 0);
  const ticketMedioMes = confirmedCount > 0 ? Math.round(faturamentoMes / confirmedCount) : 0;
  const pixCountMes = confirmedBookings.filter((b) => b.payMethod === "pix" || b.payMethod === "pix_50").length;
  const cartaoCountMes = confirmedBookings.filter((b) => b.payMethod === "cartao").length;

  // A Receber → saldo de quem chega neste mês (data de chegada, independente de quando reservou)
  const aReceberMes = aReceberBookings.reduce((sum, b) => sum + b.remainderCents, 0);

  // Pendentes do mês: para expandir no card A Receber (por data de chegada)
  const pendingBookingsQuery = await prisma.booking.findMany({
    where: {
      ...tripMonthWhere,
      status: "CONFIRMED",
      remainderCents: { gt: 0 },
    },
    select: {
      id: true,
      customer: { select: { name: true } },
      remainderCents: true,
      idaDate: true,
      voltaDate: true,
      tripType: true,
      payMethod: true,
    },
  });

  const pendingBookingsMes = pendingBookingsQuery
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

  // Obter a data mais antiga pelo idaDate (data de viagem)
  const [earliestByIda, earliestByVolta] = await Promise.all([
    prisma.booking.findFirst({
      where: { idaDate: { not: null } },
      orderBy: { idaDate: "asc" },
      select: { idaDate: true },
    }),
    prisma.booking.findFirst({
      where: { idaDate: null, voltaDate: { not: null } },
      orderBy: { voltaDate: "asc" },
      select: { voltaDate: true },
    }),
  ]);

  const date1 = earliestByIda?.idaDate ?? new Date();
  const date2 = earliestByVolta?.voltaDate ?? new Date();
  const earliestDate = date1 < date2 ? date1 : date2;
  const latestDate = new Date();

  // Gerar lista de meses
  const months: string[] = [];
  const current = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
  const start = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);

  while (current >= start) {
    months.push(monthKey(current));
    current.setMonth(current.getMonth() - 1);
  }

  // Garantir que o mês selecionado e o atual estejam presentes
  const currentMonthKey = monthKey(new Date());
  if (!months.includes(currentMonthKey)) {
    months.push(currentMonthKey);
  }
  if (!months.includes(selectedMonth)) {
    months.push(selectedMonth);
  }
  months.sort((a, b) => b.localeCompare(a));

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ maxWidth: "1200px" }}>
        {/* Cabeçalho */}
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Contratos</h1>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
              Contratos cadastrados neste mês · Históricos aparecem pela data de chegada · A Receber pelo mês de chegada do cliente.
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <MonthSelector months={months} selectedMonth={selectedMonth} />
            <Link
              href="/admin/caixa"
              style={{
                fontSize: "12px",
                color: "#3ecf8e",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(62,207,142,0.25)",
                background: "rgba(62,207,142,0.06)",
              }}
            >
              💰 Ver Fluxo de Caixa →
            </Link>
          </div>
        </div>

        {/* Cards de status (5 containers alinhados com o Fluxo de Caixa) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {[
            {
              label: "Faturamento (Mês)",
              value: brl(faturamentoMes),
              sub: `${confirmedCount} de ${totalCount} contratos confirmados`,
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
              sub: "por contrato confirmado",
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
                  padding: "20px 24px",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--muted)",
                    marginBottom: "8px",
                  }}
                >
                  {c.label}
                </p>
                <p style={{ fontSize: "24px", fontWeight: 800, color: c.color, lineHeight: 1 }}>
                  {c.value}
                </p>
                <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>{c.sub}</p>
              </div>
            )
          )}
        </div>

        {/* Booking list */}
        {bookings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "var(--muted)",
              fontSize: "14px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
            }}
          >
            Nenhum contrato encontrado para este mês.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {bookings.map((b) => {
              const badge = statusBadge(b.status);
              return (
                <Link
                  key={b.id}
                  href={`/admin/reservas/${b.id}`}
                  className="hover:border-[rgba(201,168,76,0.35)]"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "18px 24px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: "16px",
                    alignItems: "center",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "border-color 0.15s",
                  }}
                >
                  {/* Col 1: Cliente + data */}
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                      {b.customer?.name || "Sem Nome"}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                      {b.customer?.phone || "—"}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                      Criada em {formatDate(b.createdAt)}
                    </p>
                  </div>

                  {/* Col 2: Rota + veículo */}
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>
                      {tripLabel(b.tripType)}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                      {vehicleLabel(b.vehicleType)} · {b.passengerCount} pax
                    </p>
                    {b.hotel && (
                      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                        🏨 {b.hotel}
                      </p>
                    )}
                    {b.idaDate && (
                      <p style={{ fontSize: "11px", color: "var(--text)", fontWeight: 500, marginTop: "4px" }}>
                        ✈️ Chegada: {formatDate(b.idaDate)}
                        {b.idaFlightTime ? ` às ${b.idaFlightTime}` : ""}
                        {b.idaFlightNumber ? ` (Voo ${b.idaFlightNumber})` : ""}
                      </p>
                    )}
                    {b.voltaDate && (
                      <p style={{ fontSize: "11px", color: "var(--text)", fontWeight: 500, marginTop: "2px" }}>
                        ↩️ Retorno: {formatDate(b.voltaDate)}
                        {b.voltaFlightTime ? ` às ${b.voltaFlightTime}` : ""}
                        {b.voltaFlightNumber ? ` (Voo ${b.voltaFlightNumber})` : ""}
                      </p>
                    )}
                  </div>

                  {/* Col 3: Valor + afiliado */}
                  <div>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#3ecf8e" }}>
                      {brl(b.totalCents)}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--muted)",
                        marginTop: "2px",
                        textTransform: "uppercase",
                      }}
                    >
                      {b.payMethod === "pix" ? "Pix" : "Cartão"}
                    </p>
                    {b.affiliateCode && (
                      <p style={{ fontSize: "11px", color: "var(--gold)", marginTop: "4px" }}>
                        👥 {b.affiliateCode}
                      </p>
                    )}
                  </div>

                  {/* Col 4: Status */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "100px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: badge.color,
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {badge.label}
                    </span>
                    {b.remainderCents > 0 && (
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                        Restante: {brl(b.remainderCents)}
                      </span>
                    )}
                    {/* Corrida concluída indicators */}
                    {(b.tripType === "ida" || b.tripType === "ida_volta") && b.idaConcluida && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "100px",
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#3ecf8e",
                          background: "rgba(62,207,142,0.1)",
                          border: "1px solid rgba(62,207,142,0.25)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🛬 Chegada concluída
                      </span>
                    )}
                    {(b.tripType === "volta" || b.tripType === "ida_volta") && b.voltaConcluida && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "100px",
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#a78bfa",
                          background: "rgba(167,139,250,0.1)",
                          border: "1px solid rgba(167,139,250,0.25)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🛫 Retorno concluído
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              const isCurrent = p === page;
              return (
                <Link
                  key={p}
                  href={`/admin/reservas?month=${selectedMonth}&page=${p}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                    background: isCurrent ? "var(--gold-dim)" : "var(--bg-card)",
                    color: isCurrent ? "var(--gold)" : "var(--text)",
                    borderColor: isCurrent ? "var(--gold-line)" : "var(--border)",
                  }}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
