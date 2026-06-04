import { requireAdmin } from "@/lib/server/adminAuth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import MonthSelector from "../reservas/MonthSelector";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agenda e Operação | Admin Multi Trip",
  robots: { index: false, follow: false },
};

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

interface AgendaEvent {
  bookingId: string;
  type: "ida" | "volta" | "citytour";
  time: string;
  flightNumber: string | null;
  customerName: string;
  customerPhone: string;
  vehicleType: string;
  passengerCount: number;
  origin: string;
  dest: string;
  hotel: string | null;
  driverName: string | null;
  driverCar: string | null;
  driverWhatsapp: string | null;
  concluido: boolean;
}

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const selectedMonth = params.month ?? monthKey(new Date());

  // Obter o intervalo do mês selecionado
  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1; // 0-indexed

  const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));

  // Calcular chaves e rótulos de navegação mensal
  const prevMonthDate = new Date(year, month - 1, 1);
  const prevMonthKey = monthKey(prevMonthDate);

  const nextMonthDate = new Date(year, month + 1, 1);
  const nextMonthKey = monthKey(nextMonthDate);

  const monthNameStr = new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const capitalizedMonthName = monthNameStr.charAt(0).toUpperCase() + monthNameStr.slice(1);

  // Buscar todas as reservas CONFIRMED com atividade no mês
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      OR: [
        {
          idaDate: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
        {
          voltaDate: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
        {
          optionalsJson: {
            contains: selectedMonth,
          },
        },
      ],
    },
    include: {
      customer: true,
    },
  });

  // Mapear reservas em eventos por dia do mês (1 a 31)
  const eventsByDay: Record<number, AgendaEvent[]> = {};
  
  // Inicializar dias vazios no dicionário
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    eventsByDay[d] = [];
  }

  for (const b of bookings) {
    // 1. Chegada (In)
    if (b.tripType !== "volta" && b.idaDate) {
      const idaDateUTC = new Date(b.idaDate);
      if (idaDateUTC >= startOfMonth && idaDateUTC < endOfMonth) {
        const day = idaDateUTC.getUTCDate();
        eventsByDay[day].push({
          bookingId: b.id,
          type: "ida",
          time: b.idaFlightTime ?? "Não informado",
          flightNumber: b.idaFlightNumber,
          customerName: b.customer?.name ?? "Sem Nome",
          customerPhone: b.customer?.phone ?? "",
          vehicleType: b.vehicleType,
          passengerCount: b.passengerCount,
          origin: b.origin,
          dest: b.dest,
          hotel: b.hotel,
          driverName: b.driverInName ?? b.driverName,
          driverCar: b.driverInCar ?? b.driverCar,
          driverWhatsapp: b.driverInWhatsapp ?? b.driverWhatsapp,
          concluido: b.idaConcluida,
        });
      }
    }

    // 2. Retorno (Out)
    if (b.tripType !== "ida" && b.voltaDate) {
      const voltaDateUTC = new Date(b.voltaDate);
      if (voltaDateUTC >= startOfMonth && voltaDateUTC < endOfMonth) {
        const day = voltaDateUTC.getUTCDate();
        eventsByDay[day].push({
          bookingId: b.id,
          type: "volta",
          time: b.voltaFlightTime ?? "Não informado",
          flightNumber: b.voltaFlightNumber,
          customerName: b.customer?.name ?? "Sem Nome",
          customerPhone: b.customer?.phone ?? "",
          vehicleType: b.vehicleType,
          passengerCount: b.passengerCount,
          origin: b.dest, // O retorno inverte origem/destino na prática
          dest: b.origin,
          hotel: b.hotel,
          driverName: b.driverOutName ?? b.driverName,
          driverCar: b.driverOutCar ?? b.driverCar,
          driverWhatsapp: b.driverOutWhatsapp ?? b.driverWhatsapp,
          concluido: b.voltaConcluida,
        });
      }
    }

    // 3. City Tour
    if (b.optionalsJson) {
      try {
        const opts = JSON.parse(b.optionalsJson);
        if (opts.cityTour?.enabled && opts.cityTour?.date) {
          const [ctY, ctM, ctD] = opts.cityTour.date.split("-").map(Number);
          if (ctY === year && ctM === month + 1) {
            eventsByDay[ctD].push({
              bookingId: b.id,
              type: "citytour",
              time: "08:30 (Padrão)",
              flightNumber: null,
              customerName: b.customer?.name ?? "Sem Nome",
              customerPhone: b.customer?.phone ?? "",
              vehicleType: b.vehicleType,
              passengerCount: b.passengerCount,
              origin: "Gramado / Canela (Hotéis)",
              dest: "Roteiro City Tour Gramado/Canela",
              hotel: b.hotel,
              driverName: b.driverCityTourName ?? b.driverName,
              driverCar: b.driverCityTourCar ?? b.driverCar,
              driverWhatsapp: b.driverCityTourWhatsapp ?? b.driverWhatsapp,
              concluido: b.cityTourConcluido,
            });
          }
        }
      } catch {}
    }
  }

  // Ordenar eventos de cada dia pelo horário
  for (let d = 1; d <= daysInMonth; d++) {
    eventsByDay[d].sort((a, b) => a.time.localeCompare(b.time));
  }

  // Obter meses disponíveis para o seletor (com base na data mais antiga)
  const earliestBooking = await prisma.booking.findFirst({
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const earliestDate = earliestBooking?.createdAt ?? new Date();
  const latestDate = new Date();

  const months: string[] = [];
  const current = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
  const start = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);

  while (current >= start) {
    months.push(monthKey(current));
    current.setMonth(current.getMonth() - 1);
  }

  if (!months.includes(selectedMonth)) {
    months.push(selectedMonth);
    months.sort((a, b) => b.localeCompare(a));
  }

  // Montar o grid visual do calendário
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Dom, 1 = Seg...
  const totalCells = firstDayOfWeek + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const weekdayLabel = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Total de eventos no mês
  const totalEventsCount = Object.values(eventsByDay).reduce((sum, list) => sum + list.length, 0);

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ maxWidth: "1200px" }}>
        {/* Cabeçalho */}
        <div
          style={{
            marginBottom: "28px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Agenda e Operação</h1>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
              Escalonamento de motoristas, city tours e transfers do mês de forma cronológica.
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <MonthSelector months={months} selectedMonth={selectedMonth} basePath="/admin/agenda" />
          </div>
        </div>

        {/* Layout de duas colunas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "28px",
            alignItems: "start",
          }}
          className="agenda-layout"
        >
          <style>{`
            @media (max-width: 900px) {
              .agenda-layout {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>

          {/* Coluna 1: Mini Calendário Visual */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
              position: "sticky",
              top: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "12px",
              }}
            >
              <Link
                href={`/admin/agenda?month=${prevMonthKey}`}
                style={{
                  fontSize: "13px",
                  color: "var(--gold)",
                  textDecoration: "none",
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.02)",
                  transition: "all 0.1s",
                }}
                className="hover:border-[var(--gold)] hover:bg-[rgba(201,168,76,0.05)]"
                title="Mês Anterior"
              >
                ◀
              </Link>
              
              <div style={{ textAlign: "center" }}>
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text)",
                    margin: 0,
                    textTransform: "capitalize",
                    letterSpacing: "0.02em",
                  }}
                >
                  {capitalizedMonthName}
                </h3>
                <span style={{ fontSize: "9px", color: "var(--muted)", fontWeight: 600 }}>
                  {totalEventsCount} serviço{totalEventsCount !== 1 ? "s" : ""}
                </span>
              </div>

              <Link
                href={`/admin/agenda?month=${nextMonthKey}`}
                style={{
                  fontSize: "13px",
                  color: "var(--gold)",
                  textDecoration: "none",
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.02)",
                  transition: "all 0.1s",
                }}
                className="hover:border-[var(--gold)] hover:bg-[rgba(201,168,76,0.05)]"
                title="Próximo Mês"
              >
                ▶
              </Link>
            </div>

            {/* Cabeçalho semana */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "8px", textAlign: "center" }}>
              {weekdayLabel.map((w) => (
                <span key={w} style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>
                  {w}
                </span>
              ))}
            </div>

            {/* Grid de dias */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
              {/* Células vazias do início do mês */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: "42px" }} />
              ))}

              {/* Dias do mês */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const events = eventsByDay[day] || [];
                const hasEvents = events.length > 0;

                return (
                  <Link
                    key={`day-${day}`}
                    href={hasEvents ? `#agenda-day-${day}` : "#"}
                    style={{
                      height: "44px",
                      background: hasEvents ? "rgba(255,255,255,0.03)" : "transparent",
                      border: hasEvents ? "1px solid var(--border)" : "1px solid transparent",
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                      color: "inherit",
                      cursor: hasEvents ? "pointer" : "default",
                      transition: "border-color 0.15s, background-color 0.15s",
                    }}
                    className={hasEvents ? "hover:border-[rgba(201,168,76,0.5)] hover:bg-[rgba(255,255,255,0.06)]" : ""}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: hasEvents ? 700 : 400,
                        color: hasEvents ? "var(--text)" : "var(--muted)",
                      }}
                    >
                      {day}
                    </span>
                    
                    {/* Indicador de eventos por cores */}
                    {hasEvents && (
                      <div style={{ display: "flex", gap: "2px", marginTop: "4px" }}>
                        {events.map((e, idx) => {
                          const color =
                            e.type === "ida" ? "#3ecf8e" : e.type === "volta" ? "#a78bfa" : "#c9a84c";
                          return (
                            <span
                              key={idx}
                              style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                background: color,
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Legenda */}
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                fontSize: "11px",
                color: "var(--muted)",
                borderTop: "1px solid var(--border)",
                paddingTop: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3ecf8e" }} /> Chegada In
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#a78bfa" }} /> Retorno Out
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#c9a84c" }} /> City Tour
              </div>
            </div>
          </div>

          {/* Coluna 2: Detalhes do Cronograma Dia-a-Dia */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "8px",
              }}
            >
              📋 Cronograma Diário Detalhado
            </h3>

            {totalEventsCount === 0 ? (
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "48px 20px",
                  textAlign: "center",
                  color: "var(--muted)",
                }}
              >
                Nenhum serviço confirmado ou agendado para o mês selecionado.
              </div>
            ) : (
              Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const events = eventsByDay[day] || [];
                if (events.length === 0) return null;

                const dayDateStr = new Date(year, month, day).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                });
                const capitalizedDayDate = dayDateStr.charAt(0).toUpperCase() + dayDateStr.slice(1);

                return (
                  <div
                    key={`timeline-${day}`}
                    id={`agenda-day-${day}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      scrollMarginTop: "24px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--gold)",
                        margin: "8px 0 4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>📅</span> {capitalizedDayDate}
                    </h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {events.map((e, idx) => {
                        const isIda = e.type === "ida";
                        const isVolta = e.type === "volta";
                        
                        const labelType = isIda
                          ? "Chegada In"
                          : isVolta
                          ? "Retorno Out"
                          : "City Tour";

                        const color = isIda
                          ? "#3ecf8e"
                          : isVolta
                          ? "#a78bfa"
                          : "#c9a84c";

                        const bgOpacity = isIda
                          ? "rgba(62,207,142,0.04)"
                          : isVolta
                          ? "rgba(167,139,250,0.04)"
                          : "rgba(201,168,76,0.04)";

                        const borderOpacity = isIda
                          ? "rgba(62,207,142,0.15)"
                          : isVolta
                          ? "rgba(167,139,250,0.15)"
                          : "rgba(201,168,76,0.15)";

                        return (
                          <div
                            key={idx}
                            style={{
                              background: e.concluido
                                ? "rgba(255, 255, 255, 0.015)"
                                : "var(--bg-card)",
                              border: e.concluido
                                ? "1px dashed rgba(62, 207, 142, 0.25)"
                                : "1px solid var(--border)",
                              borderRadius: "12px",
                              padding: "16px 20px",
                              display: "grid",
                              gridTemplateColumns: "100px 1.5fr 1.2fr auto",
                              gap: "16px",
                              alignItems: "center",
                              opacity: e.concluido ? 0.7 : 1,
                              transition: "all 0.2s ease",
                            }}
                          >
                            {/* Horário + Tipo */}
                            <div>
                              <p style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>
                                {e.time}
                              </p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start", marginTop: "4px" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 8px",
                                    borderRadius: "100px",
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    color,
                                    background: bgOpacity,
                                    border: `1px solid ${borderOpacity}`,
                                  }}
                                >
                                  {labelType}
                                </span>
                                {e.concluido && (
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "2px 8px",
                                      borderRadius: "100px",
                                      fontSize: "9px",
                                      fontWeight: 700,
                                      color: "#3ecf8e",
                                      background: "rgba(62,207,142,0.1)",
                                      border: "1px solid rgba(62,207,142,0.25)",
                                    }}
                                  >
                                    ✓ Concluído
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Cliente + Serviço */}
                            <div>
                              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
                                {e.customerName}
                              </p>
                              <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                                {e.customerPhone} · {e.passengerCount} pax
                              </p>
                              <p style={{ fontSize: "11px", color: "var(--text)", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                                📍 <span style={{ color: "var(--muted)" }}>{e.origin} → {e.dest}</span>
                              </p>
                              {e.hotel && (
                                <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                                  🏨 {e.hotel}
                                </p>
                              )}
                              {e.flightNumber && (
                                <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                                  ✈️ Voo: {e.flightNumber}
                                </p>
                              )}
                            </div>

                            {/* Veículo + Motorista */}
                            <div>
                              <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>
                                Veículo: <span style={{ color: "var(--text)" }}>{e.vehicleType === "sedan" ? "Sedan Premium" : "Spin 6L"}</span>
                              </p>
                              
                              <div
                                style={{
                                  marginTop: "8px",
                                  padding: "6px 10px",
                                  background: "rgba(255,255,255,0.02)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "8px",
                                }}
                              >
                                <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  🚗 Motorista
                                </p>
                                {e.driverName ? (
                                  <>
                                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)", marginTop: "2px" }}>
                                      {e.driverName}
                                    </p>
                                    <p style={{ fontSize: "10px", color: "var(--muted)" }}>
                                      {e.driverCar}
                                    </p>
                                  </>
                                ) : (
                                  <p style={{ fontSize: "11px", color: "#c9a84c", fontWeight: 600, marginTop: "2px" }}>
                                    ⚠️ Não designado
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Link Ações */}
                            <div>
                              <Link
                                href={`/admin/reservas/${e.bookingId}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "10px",
                                  border: "1px solid var(--border)",
                                  background: "var(--bg-card)",
                                  color: "var(--text)",
                                  textDecoration: "none",
                                  fontSize: "14px",
                                  transition: "all 0.15s",
                                }}
                                className="hover:border-[var(--gold)] hover:bg-[rgba(251,191,36,0.05)]"
                                title="Ver detalhes da reserva"
                              >
                                👁️
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
