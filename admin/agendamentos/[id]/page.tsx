import { requireAdmin } from "@/lib/server/adminAuth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  deleteBooking,
  updateBookingStatus,
  saveDriverInfo,
  regenerateContract,
  marcarCorridaConcluida,
  marcarRestantePago,
  forceSyncZoho,
  marcarNoShow,
  remarcarReserva,
  cancelarOutNoShow,
} from "../actions";
import { DeleteButton } from "./DeleteButton";
import { ProfissionalForm } from "./ProfissionalForm";

export const dynamic = "force-dynamic";

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcHotelDepartureTime(flightTime: string | null | undefined): string {
  if (!flightTime) return "—";
  const match = flightTime.match(/^(\d{2}):(\d{2})/);
  if (!match) return flightTime;
  let h = parseInt(match[1], 10);
  const m = match[2];
  h -= 4;
  if (h < 0) h += 24;
  return `${h.toString().padStart(2, "0")}:${m}`;
}

function tripLabel(t: string) {
  if (t === "so_citytour") return "Somente Serviço Adicional";
  if (t === "ida_volta") return "Início + Encerramento";
  if (t === "volta") return "Encerramento";
  return "Início";
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

function statusBadge(s: string) {
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

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "24px",
};

const label: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "var(--muted)",
  marginBottom: "4px",
};

const value: React.CSSProperties = {
  fontSize: "14px",
  color: "var(--text)",
};

function Row({ l, v }: { l: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <p style={label}>{l}</p>
      <p style={value}>{v || "—"}</p>
    </div>
  );
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { error, message: zohoErrorMsg } = await searchParams;

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true, createdAt: true, updatedAt: true, publicToken: true,
      status: true, tripType: true, vehicleType: true, passengerCount: true,
      routeLabel: true, origin: true, dest: true,
      hotel: true, hotelAddress: true, pickupAddress: true,
      vehicleCount: true, secondVehicle: true,
      idaDate: true, idaFlightTime: true, idaFlightNumber: true,
      voltaDate: true, voltaFlightTime: true, voltaFlightNumber: true,
      totalCents: true, depositCents: true, remainderCents: true,
      optionalsJson: true, optionalsCents: true, payMethod: true,
      affiliateCode: true, commissionCents: true, commissionPaid: true,
      contractAcceptedAt: true, contractAcceptedVersion: true, contractPdfUrl: true,
      zohoEventUid: true, mpPreferenceId: true,
      driverName: true, driverCar: true, driverWhatsapp: true, driverNotifiedAt: true,
      driverInName: true, driverInCar: true, driverInWhatsapp: true,
      driverOutName: true, driverOutCar: true, driverOutWhatsapp: true,
      driverCityTourName: true, driverCityTourCar: true, driverCityTourWhatsapp: true,
      idaConcluida: true, voltaConcluida: true, cityTourConcluido: true,
      noShowFlightType: true, noShowDate: true,
      rescheduledDate: true, rescheduledFlightTime: true, rescheduledFlightNumber: true,
      noShowOutCancelled: true, outCancelledCents: true,
      internalNotes: true,
      customer: { select: { id: true, name: true, phone: true, email: true, cpf: true } },
      passengers: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  const activeDrivers = await prisma.driver.findMany({
    where: { status: "Aprovado" },
    select: { id: true, name: true, phone: true, carModel: true, carPlate: true }
  });

  if (!booking) notFound();

  const badge = statusBadge(booking.status);

  // Parse do optionalsJson — suporta formato antigo (flat) e novo (nested)
  let optJson: Record<string, unknown> = {};
  try {
    optJson = JSON.parse(booking.optionalsJson ?? "{}");
  } catch {}

  // Formato novo: { addons: {...}, childSeats: {...}, hasChildUnder10 }
  // Formato antigo: chaves flat de addons diretamente
  const addonsObj: Record<string, number> =
    optJson.addons && typeof optJson.addons === "object"
      ? (optJson.addons as Record<string, number>)
      : (optJson as Record<string, number>);

  const childSeatsObj: Record<string, number> =
    optJson.childSeats && typeof optJson.childSeats === "object"
      ? (optJson.childSeats as Record<string, number>)
      : {};

  const cityTour =
    optJson.cityTour && typeof optJson.cityTour === "object"
      ? (optJson.cityTour as { enabled?: boolean; date?: string; valueCents?: number })
      : null;

  // Suporta campo antigo (hasChildEquipment) e novo (hasChildUnder10)
  const hasChildEquipment =
    !!(optJson.hasChildUnder10 ?? optJson.hasChildEquipment) ||
    Object.values(childSeatsObj).some((q) => Number(q) > 0);

  // Pagamentos de profissionais — lidos do optionalsJson até migration rodar
  const driverInPaymentCents: number | null =
    typeof optJson._driverInPaymentCents === "number" ? optJson._driverInPaymentCents : null;
  const driverOutPaymentCents: number | null =
    typeof optJson._driverOutPaymentCents === "number" ? optJson._driverOutPaymentCents : null;
  const driverCityTourPaymentCents: number | null =
    typeof optJson._driverCityTourPaymentCents === "number" ? optJson._driverCityTourPaymentCents : null;

  const cashbackRedeemedCents: number =
    typeof optJson._cashbackRedeemedCents === "number" ? optJson._cashbackRedeemedCents : 0;

  const addonLabels: Record<string, string> = {
    romantica: "Serviço Especial",
    recepcao: "Recepção no local (identificação por nome)",
    hotel_porto_alegre: "Local alternativo",
    chaves: "Retirada/entrega de chaves",
    duas_hospedagens: "Duas hospedagens",
    equipamento_infantil: "Equipamento de segurança infantil",
  };

  const childSeatLabels: Record<string, string> = {
    bebe_conforto: "Bebê conforto",
    cadeirinha: "Cadeirinha",
    assento_elevacao: "Assento de elevação",
  };

  let childEquipmentStr = "Não";
  if (hasChildEquipment) {
    const seats = Object.entries(childSeatsObj)
      .filter(([_, qty]) => qty > 0)
      .map(([k, qty]) => `${qty}x ${childSeatLabels[k] ?? k}`)
      .join(", ");
    childEquipmentStr = seats ? `Sim (${seats})` : "Sim (Tipo não especificado)";
  }

  const deleteAction = deleteBooking.bind(null, id);
  const saveDriverAction = saveDriverInfo.bind(null, id);
  const regenerateContractAction = regenerateContract.bind(null, id);
  const marcarRestantePagoAction = marcarRestantePago.bind(null, id);
  const forceSyncZohoAction = forceSyncZoho.bind(null, id);

  const isIda = booking.tripType === "ida" || booking.tripType === "ida_volta";
  const isVolta = booking.tripType === "volta" || booking.tripType === "ida_volta";
  const hasZohoSchedule = !!booking.idaDate || !!booking.voltaDate || !!cityTour?.date;
  const canShowZohoSync =
    booking.status === "CONFIRMED" &&
    hasZohoSchedule &&
    error !== "zoho_sync_attempted";

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ maxWidth: "900px" }}>
        {/* Header */}
        {error === "zoho_sync_failed" && (
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              marginBottom: "24px",
              color: "#f87171",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <strong>Falha ao sincronizar com o Zoho Calendar.</strong>
            <br />
            {zohoErrorMsg ? (
              <span
                style={{
                  display: "block",
                  marginTop: "8px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  background: "rgba(0,0,0,0.2)",
                  padding: "8px",
                  borderRadius: "6px",
                }}
              >
                {zohoErrorMsg}
              </span>
            ) : (
              "Verifique se as variáveis de ambiente do Zoho (ZOHO_CLIENT_ID, etc) estão configuradas corretamente no Vercel ou se as credenciais expiraram."
            )}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/admin/agendamentos"
              style={{
                color: "var(--muted)",
                fontSize: "13px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              ← Contratos
            </Link>
            <span style={{ color: "var(--border)" }}>|</span>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
                Contrato de {booking.customer.name}
              </h1>
              <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                Criada em {formatDateTime(booking.createdAt)} · ID: {booking.id.slice(0, 8)}…
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                padding: "5px 12px",
                borderRadius: "100px",
                fontSize: "12px",
                fontWeight: 600,
                color: badge.color,
                background: badge.bg,
                border: `1px solid ${badge.border}`,
              }}
            >
              {badge.label}
            </span>

            {/* Zoho Sync */}
            {canShowZohoSync && (
              <form action={forceSyncZohoAction}>
                <button
                  type="submit"
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    color: "#60a5fa",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  title={booking.zohoEventUid ? "Atualiza o evento existente no Zoho Calendar" : "Cria o evento no Zoho Calendar"}
                >
                  🔄 {booking.zohoEventUid ? "Atualizar Zoho" : "Sincronizar Zoho"}
                </button>
              </form>
            )}

            {/* Edit */}
            <Link
              href={`/admin/agendamentos/${id}/editar`}
              style={{
                padding: "7px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                background: "var(--gold-dim)",
                border: "1px solid var(--gold-line)",
                color: "var(--gold)",
                textDecoration: "none",
              }}
            >
              ✏️ Editar
            </Link>

            {/* Delete */}
            <DeleteButton action={deleteAction} clientName={booking.customer.name} />
          </div>
        </div>

        {/* Status change */}
        <div
          style={{
            ...card,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <p style={{ fontSize: "12px", color: "var(--muted)", marginRight: "4px" }}>
            Alterar status:
          </p>
          {(["CONFIRMED", "PENDING", "CANCELLED"] as const).map((s) => {
            const b = statusBadge(s);
            const action = updateBookingStatus.bind(null, id, s);
            return (
              <form key={s} action={action} style={{ display: "inline" }}>
                <button
                  type="submit"
                  disabled={booking.status === s}
                  style={{
                    padding: "5px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: booking.status === s ? b.color : "var(--muted)",
                    background: booking.status === s ? b.bg : "transparent",
                    border: `1px solid ${booking.status === s ? b.border : "var(--border)"}`,
                    cursor: booking.status === s ? "default" : "pointer",
                    opacity: booking.status === s ? 1 : 0.6,
                  }}
                >
                  {b.label}
                </button>
              </form>
            );
          })}
        </div>

        {/* Corrida Concluída */}
        {(isIda || isVolta || cityTour?.enabled) && (
          <div
            style={{
              ...card,
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: "12px", color: "var(--muted)", marginRight: "4px" }}>
              Corrida concluída:
            </p>

            {isIda &&
              (() => {
                const toggleIdaAction = marcarCorridaConcluida.bind(
                  null,
                  id,
                  "ida",
                  !booking.idaConcluida
                );
                return (
                  <form action={toggleIdaAction} style={{ display: "inline" }}>
                    <button
                      type="submit"
                      style={{
                        padding: "5px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        color: booking.idaConcluida ? "#3ecf8e" : "var(--muted)",
                        background: booking.idaConcluida ? "rgba(62,207,142,0.1)" : "transparent",
                        border: `1px solid ${booking.idaConcluida ? "rgba(62,207,142,0.35)" : "var(--border)"}`,
                      }}
                    >
                      🛬{" "}
                      {booking.idaConcluida ? "✅ Chegada concluída" : "Marcar Chegada concluída"}
                    </button>
                  </form>
                );
              })()}

            {isVolta &&
              (() => {
                const toggleVoltaAction = marcarCorridaConcluida.bind(
                  null,
                  id,
                  "volta",
                  !booking.voltaConcluida
                );
                return (
                  <form action={toggleVoltaAction} style={{ display: "inline" }}>
                    <button
                      type="submit"
                      style={{
                        padding: "5px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        color: booking.voltaConcluida ? "#a78bfa" : "var(--muted)",
                        background: booking.voltaConcluida
                          ? "rgba(167,139,250,0.1)"
                          : "transparent",
                        border: `1px solid ${booking.voltaConcluida ? "rgba(167,139,250,0.35)" : "var(--border)"}`,
                      }}
                    >
                      🛫{" "}
                      {booking.voltaConcluida ? "✅ Retorno concluído" : "Marcar Retorno concluído"}
                    </button>
                  </form>
                );
              })()}

            {cityTour?.enabled &&
              (() => {
                const toggleCityTourAction = marcarCorridaConcluida.bind(
                  null,
                  id,
                  "cityTour",
                  !booking.cityTourConcluido
                );
                return (
                  <form action={toggleCityTourAction} style={{ display: "inline" }}>
                    <button
                      type="submit"
                      style={{
                        padding: "5px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        color: booking.cityTourConcluido ? "#fbbf24" : "var(--muted)",
                        background: booking.cityTourConcluido
                          ? "rgba(251,191,36,0.1)"
                          : "transparent",
                        border: `1px solid ${booking.cityTourConcluido ? "rgba(251,191,36,0.35)" : "var(--border)"}`,
                      }}
                    >
                      🗺️{" "}
                      {booking.cityTourConcluido
                        ? "✅ Serviço Adicional concluído"
                        : "Marcar Serviço Adicional concluído"}
                    </button>
                  </form>
                );
              })()}
          </div>
        )}

        {/* NoShow e Remarcar */}
        {booking.status === "CONFIRMED" && (
          <div style={{ ...card, marginBottom: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "12px", color: "var(--muted)" }}>🚨 NoShow</p>

            {/* ── Botões iniciais (antes de qualquer noshow) ── */}
            {!booking.noShowFlightType && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {isIda && (
                  <form action={marcarNoShow.bind(null, id, "ida")} style={{ display: "inline" }}>
                    <button type="submit" style={{ padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", cursor: "pointer" }}>
                      🛬 NoShow IN — Chegada não chegou
                    </button>
                  </form>
                )}
                {isVolta && (
                  <form action={marcarNoShow.bind(null, id, "volta")} style={{ display: "inline" }}>
                    <button type="submit" style={{ padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", cursor: "pointer" }}>
                      🛫 NoShow OUT — Cliente não estava no local/horário do retorno
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ── Após NoShow IN ── */}
            {booking.noShowFlightType === "ida" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Badge NoShow IN */}
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#f87171" }}>
                    🛬 NoShow IN registrado em {booking.noShowDate ? formatDate(booking.noShowDate) : "—"}
                  </p>
                </div>

                {/* Seção Reagendar Início */}
                <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
                    Reagendar Início
                  </p>
                  {booking.rescheduledDate ? (
                    <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(62,207,142,0.1)", border: "1px solid rgba(62,207,142,0.3)" }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#3ecf8e" }}>✅ Remarcado para {formatDate(booking.rescheduledDate)}</p>
                      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                        Horário: {booking.rescheduledFlightTime || "—"} · Referência: {booking.rescheduledFlightNumber || "—"}
                      </p>
                    </div>
                  ) : (
                    <form
                      action={async (fd: FormData) => {
                        "use server";
                        await remarcarReserva(
                          id,
                          fd.get("rescheduledDate")?.toString() || "",
                          fd.get("rescheduledFlightTime")?.toString() || "",
                          fd.get("rescheduledFlightNumber")?.toString(),
                          true
                        );
                      }}
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}
                    >
                      <div style={{ padding: "6px 10px", borderRadius: "6px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", width: "100%", fontSize: "11px", color: "#c9a84c" }}>
                        ⚠️ Acréscimo de 20% aplicado automaticamente — novo total: {brl(Math.round(booking.totalCents * 1.2))}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "140px" }}>
                        <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)" }}>Nova Data</label>
                        <input type="date" name="rescheduledDate" required style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: "12px" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 0.8, minWidth: "110px" }}>
                        <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)" }}>Horário</label>
                        <input type="time" name="rescheduledFlightTime" style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: "12px" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "130px" }}>
                        <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)" }}>Referência</label>
                        <input type="text" name="rescheduledFlightNumber" placeholder="Ex: G3 1234" style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: "12px" }} />
                      </div>
                      <button type="submit" style={{ padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "rgba(62,207,142,0.15)", border: "1px solid rgba(62,207,142,0.3)", color: "#3ecf8e", cursor: "pointer" }}>
                        Remarcar (+20%)
                      </button>
                    </form>
                  )}
                </div>

                {/* Seção Encerramento (só para ida_volta) */}
                {isVolta && (
                  <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
                      Encerramento
                    </p>
                    {booking.noShowOutCancelled ? (
                      <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "#f87171" }}>
                          ❌ Encerramento cancelado
                        </p>
                        {booking.outCancelledCents != null && (
                          <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                            Valor subtraído do total: {brl(booking.outCancelledCents)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <p style={{ fontSize: "12px", color: "var(--text)" }}>
                          ✅ Encerramento mantido — {booking.voltaDate ? formatDate(booking.voltaDate) : "data não definida"}
                        </p>
                        <form
                          action={async (fd: FormData) => {
                            "use server";
                            const rawValue = fd.get("outValue")?.toString() || "0";
                            const cents = Math.round(parseFloat(rawValue.replace(",", ".")) * 100);
                            if (!isNaN(cents) && cents >= 0) await cancelarOutNoShow(id, cents);
                          }}
                          style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)" }}>
                              Valor do trecho OUT (R$)
                            </label>
                            <input
                              type="number"
                              name="outValue"
                              step="0.01"
                              min="0"
                              placeholder="Ex: 249,90"
                              required
                              style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: "12px", width: "160px" }}
                            />
                          </div>
                          <button type="submit" style={{ padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", cursor: "pointer" }}>
                            Cancelar encerramento
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Após NoShow OUT ── */}
            {booking.noShowFlightType === "volta" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#f87171" }}>
                    🛫 NoShow OUT registrado em {booking.noShowDate ? formatDate(booking.noShowDate) : "—"}
                  </p>
                </div>

                {/* Reagendar OUT */}
                <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
                    Reagendar Encerramento
                  </p>
                  {booking.rescheduledDate ? (
                    <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(62,207,142,0.1)", border: "1px solid rgba(62,207,142,0.3)" }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#3ecf8e" }}>✅ Remarcado para {formatDate(booking.rescheduledDate)}</p>
                      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                        Horário: {booking.rescheduledFlightTime || "—"} · Referência: {booking.rescheduledFlightNumber || "—"}
                      </p>
                    </div>
                  ) : (
                    <form
                      action={async (fd: FormData) => {
                        "use server";
                        await remarcarReserva(
                          id,
                          fd.get("rescheduledDate")?.toString() || "",
                          fd.get("rescheduledFlightTime")?.toString() || "",
                          fd.get("rescheduledFlightNumber")?.toString(),
                          true
                        );
                      }}
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}
                    >
                      <div style={{ padding: "6px 10px", borderRadius: "6px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", width: "100%", fontSize: "11px", color: "#c9a84c" }}>
                        ⚠️ Acréscimo de 20% aplicado automaticamente — novo total: {brl(Math.round(booking.totalCents * 1.2))}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "140px" }}>
                        <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)" }}>Nova Data</label>
                        <input type="date" name="rescheduledDate" required style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: "12px" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 0.8, minWidth: "110px" }}>
                        <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)" }}>Horário</label>
                        <input type="time" name="rescheduledFlightTime" style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: "12px" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "130px" }}>
                        <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)" }}>Referência</label>
                        <input type="text" name="rescheduledFlightNumber" placeholder="Ex: G3 1234" style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: "12px" }} />
                      </div>
                      <button type="submit" style={{ padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "rgba(62,207,142,0.15)", border: "1px solid rgba(62,207,142,0.3)", color: "#3ecf8e", cursor: "pointer" }}>
                        Remarcar (+20%)
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Cliente */}
          <div style={card}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "16px",
                color: "var(--text)",
              }}
            >
              👤 Cliente
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Row l="Nome" v={booking.customer.name} />
              <Row
                l="WhatsApp"
                v={
                  <a
                    href={`https://wa.me/55${booking.customer.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#3ecf8e", textDecoration: "none" }}
                  >
                    {booking.customer.phone}
                  </a>
                }
              />
              <Row l="E-mail" v={booking.customer.email} />
              {booking.customer.cpf && (
                <Row
                  l="CPF do Contratante"
                  v={booking.customer.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                />
              )}
            </div>
          </div>

          {/* Observações Internas */}
          {booking.internalNotes && (
            <div style={{ ...card, borderColor: "rgba(201,168,76,0.25)", background: "rgba(201,168,76,0.05)" }}>
              <p style={{ ...label, color: "#c9a84c" }}>Observações Internas</p>
              <p style={{ fontSize: "13px", color: "var(--text)", whiteSpace: "pre-wrap", marginTop: "6px" }}>
                {booking.internalNotes}
              </p>
            </div>
          )}

          {/* Atendimento */}
          <div style={card}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "16px",
                color: "var(--text)",
              }}
            >
              ✈️ Atendimento
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Row l="Trajeto" v={tripLabel(booking.tripType)} />
              <Row
                l="Veículo"
                v={`${vehicleLabel(booking.vehicleType)} · ${booking.passengerCount} pax`}
              />
              <Row l="Rota" v={booking.routeLabel} />
              {booking.hotel && <Row l="Local do Atendimento" v={booking.hotel} />}
              {booking.hotelAddress && <Row l="Endereço" v={booking.hotelAddress} />}
              {booking.pickupAddress && (
                <Row l="Embarque Alternativo" v={booking.pickupAddress} />
              )}
              {(booking.vehicleCount ?? 1) > 1 && (
                <Row
                  l="Veículos"
                  v={`${booking.vehicleCount}x — 1º: ${vehicleLabel(booking.vehicleType)}${booking.secondVehicle ? ` · 2º: ${vehicleLabel(booking.secondVehicle)}` : ""}`}
                />
              )}
              {cityTour?.enabled && (
                <Row
                  l="Adicional"
                  v={`Serviço Adicional — ${cityTour.date ? new Date(cityTour.date + "T12:00:00").toLocaleDateString("pt-BR") : "Data a combinar"}`}
                />
              )}
            </div>
          </div>

          {/* Datas do agendamento */}
          <div style={card}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "16px",
                color: "var(--text)",
              }}
            >
              📅 Datas do Agendamento
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Row l="Data de Início" v={formatDate(booking.idaDate)} />
              {booking.idaFlightTime && <Row l="Horário de Início" v={booking.idaFlightTime} />}
              {booking.idaFlightNumber && <Row l="Profissional - Chegada" v={booking.idaFlightNumber} />}
              <Row l="Data de Encerramento" v={formatDate(booking.voltaDate)} />
              {booking.voltaFlightTime && (
                <Row l="Horário de Encerramento" v={booking.voltaFlightTime} />
              )}
              {booking.voltaFlightNumber && (
                <Row l="Profissional - Retorno" v={booking.voltaFlightNumber} />
              )}
            </div>
          </div>

          {/* Financeiro */}
          <div style={card}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "16px",
                color: "var(--text)",
              }}
            >
              💰 Financeiro
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {cashbackRedeemedCents > 0 ? (
                <>
                  <Row l="Valor Original" v={brl(booking.totalCents + cashbackRedeemedCents)} />
                  <Row
                    l="Cashback Aplicado"
                    v={<span style={{ color: "#f87171", fontWeight: 600 }}>-{brl(cashbackRedeemedCents)}</span>}
                  />
                  <Row
                    l="Total com Desconto"
                    v={
                      <span style={{ color: "#3ecf8e", fontWeight: 700 }}>
                        {brl(booking.totalCents)}
                      </span>
                    }
                  />
                </>
              ) : (
                <Row
                  l="Total"
                  v={
                    <span style={{ color: "#3ecf8e", fontWeight: 700 }}>
                      {brl(booking.totalCents)}
                    </span>
                  }
                />
              )}
              <Row l="Pago / Sinal" v={brl(booking.depositCents)} />
              <Row
                l="Restante"
                v={
                  booking.remainderCents > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "#c9a84c" }}>{brl(booking.remainderCents)}</span>
                      <form action={marcarRestantePagoAction}>
                        <button
                          type="submit"
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: 700,
                            background: "rgba(62,207,142,0.15)",
                            color: "#3ecf8e",
                            border: "1px solid rgba(62,207,142,0.3)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          Marcar como pago
                        </button>
                      </form>
                    </div>
                  ) : (
                    "—"
                  )
                }
              />
              <Row l="Forma de Pagto." v={booking.payMethod === "pix" ? "PIX" : booking.payMethod === "pix_50" ? "PIX 50% (Sinal)" : booking.payMethod === "cartao" ? "Cartão" : "Manual"} />
              {booking.optionalsCents > 0 && <Row l="Adicionais" v={brl(booking.optionalsCents)} />}
              {booking.affiliateCode && (
                <Row
                  l="Representante"
                  v={<span style={{ color: "var(--gold)" }}>{booking.affiliateCode}</span>}
                />
              )}
            </div>
          </div>

          {/* Clientes */}
          {booking.passengers.length > 0 && (
            <div style={{ ...card, gridColumn: "1 / -1" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  color: "var(--text)",
                }}
              >
                👥 Clientes
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "10px",
                }}
              >
                {booking.passengers.map((p: any, i: number) => (
                  <div
                    key={p.id}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                    }}
                  >
                    <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                      Pax {i + 1}
                    </p>
                    <p style={{ fontSize: "14px", fontWeight: 600 }}>{p.fullName}</p>
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                      {p.docType}: {p.docNumber}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adicionais contratados */}
          {(Object.entries(addonsObj).some(([, qty]) => qty > 0) ||
            hasChildEquipment ||
            cityTour?.enabled) && (
            <div style={{ ...card, gridColumn: "1 / -1" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  color: "var(--text)",
                }}
              >
                ➕ Adicionais
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Addons normais */}
                {Object.entries(addonsObj).map(([k, qty]) => {
                  if (!qty || qty === 0) return null;
                  const lbl = addonLabels[k] ?? k;
                  return (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "rgba(201,168,76,0.06)",
                        border: "1px solid rgba(201,168,76,0.15)",
                        borderRadius: "10px",
                        padding: "10px 14px",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "var(--text)" }}>{lbl}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--gold)" }}>
                        {k === "recepcao" ? "✅ Sim" : qty > 1 ? `× ${qty}` : "✅ Sim"}
                      </span>
                    </div>
                  );
                })}

                {/* Serviço Adicional */}
                {cityTour?.enabled && (
                  <div
                    style={{
                      background: "rgba(201,168,76,0.05)",
                      border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--gold)",
                        marginBottom: "8px",
                      }}
                    >
                      🗺️ Serviço Adicional
                    </p>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                      {cityTour.date && (
                        <div>
                          <p
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              color: "var(--muted)",
                              marginBottom: "3px",
                            }}
                          >
                            Data
                          </p>
                          <p style={{ fontSize: "13px", color: "var(--text)", fontWeight: 600 }}>
                            {new Date(`${cityTour.date}T12:00:00`).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      )}
                      {!!cityTour.valueCents && cityTour.valueCents > 0 && (
                        <div>
                          <p
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              color: "var(--muted)",
                              marginBottom: "3px",
                            }}
                          >
                            Valor
                          </p>
                          <p style={{ fontSize: "13px", color: "var(--gold)", fontWeight: 700 }}>
                            {brl(cityTour.valueCents)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Equipamento infantil */}
                {hasChildEquipment && (
                  <div
                    style={{
                      background: "rgba(62,207,142,0.05)",
                      border: "1px solid rgba(62,207,142,0.15)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text)",
                        marginBottom: "8px",
                      }}
                    >
                      🧒 Equipamento de segurança infantil
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {Object.entries(childSeatsObj).length > 0 ? (
                        Object.entries(childSeatsObj).map(([k, qty]) => {
                          if (!qty || qty === 0) return null;
                          return (
                            <div
                              key={k}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "13px",
                              }}
                            >
                              <span style={{ color: "var(--muted)" }}>
                                {childSeatLabels[k] ?? k}
                              </span>
                              <span style={{ fontWeight: 700, color: "#3ecf8e" }}>× {qty}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                          Tipo não especificado — confirmar com cliente
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pagamentos */}
          {booking.payments.length > 0 && (
            <div style={{ ...card, gridColumn: "1 / -1" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  color: "var(--text)",
                }}
              >
                🧾 Histórico de Pagamentos
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {booking.payments.map((pay: any) => (
                  <div
                    key={pay.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "10px 16px",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600 }}>{brl(pay.amountCents)}</p>
                      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                        {pay.method} · {formatDate(pay.paidAt ?? pay.createdAt)}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "100px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: pay.status === "approved" ? "#3ecf8e" : "#c9a84c",
                        background:
                          pay.status === "approved"
                            ? "rgba(62,207,142,0.1)"
                            : "rgba(201,168,76,0.1)",
                        border: `1px solid ${pay.status === "approved" ? "rgba(62,207,142,0.25)" : "rgba(201,168,76,0.3)"}`,
                      }}
                    >
                      {pay.status === "approved" ? "Aprovado" : pay.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contrato */}
          <div style={{ ...card, gridColumn: "1 / -1" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "4px",
                color: "var(--text)",
              }}
            >
              📄 Contrato
            </p>
            <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "16px" }}>
              Contrato Particular de Prestação de Serviços de Transporte Turístico
            </p>

            {booking.contractPdfUrl ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                {/* Info do aceite */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#3ecf8e" }}>
                      ✅ Contrato gerado
                    </span>
                    {booking.contractAcceptedAt && (
                      <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                        · Aceite em {formatDateTime(booking.contractAcceptedAt)}
                      </span>
                    )}
                  </div>
                  {booking.contractAcceptedVersion && (
                    <p style={{ fontSize: "10px", color: "var(--muted)" }}>
                      Versão: {booking.contractAcceptedVersion}
                    </p>
                  )}
                </div>

                {/* Botões */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <a
                    href={booking.contractPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "rgba(62,207,142,0.1)",
                      border: "1px solid rgba(62,207,142,0.3)",
                      color: "#3ecf8e",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    👁️ Visualizar PDF
                  </a>
                  <a
                    href={booking.contractPdfUrl}
                    download
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      color: "var(--muted)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    ⬇️ Baixar
                  </a>
                  <form action={regenerateContractAction} style={{ display: "inline" }}>
                    <button
                      type="submit"
                      style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "rgba(201,168,76,0.08)",
                        border: "1px solid rgba(201,168,76,0.25)",
                        color: "var(--gold)",
                        cursor: "pointer",
                      }}
                    >
                      🔄 Regenerar
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                  ⚠️ PDF do contrato ainda não gerado.
                </p>
                <form action={regenerateContractAction} style={{ display: "inline" }}>
                  <button
                    type="submit"
                    style={{
                      padding: "9px 20px",
                      borderRadius: "10px",
                      border: "none",
                      background: "var(--gold)",
                      color: "#05080d",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    📄 Gerar Contrato PDF
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Profissionais Designados (Componente Cliente com validações condicionais e estado de salvamento) */}
          <ProfissionalForm
            booking={booking}
            drivers={activeDrivers}
            childEquipmentStr={childEquipmentStr}
            driverInPaymentCents={driverInPaymentCents}
            driverOutPaymentCents={driverOutPaymentCents}
            driverCityTourPaymentCents={driverCityTourPaymentCents}
            isIda={isIda}
            isVolta={isVolta}
            cityTour={cityTour}
          />
        </div>
      </div>
    </div>
  );
}
