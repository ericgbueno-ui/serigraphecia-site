import { requireAdmin } from "@/lib/server/adminAuth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateBooking } from "../../actions";
import { ADDONS, CHILD_SEAT_LABELS, type AddonId, type ChildSeatId } from "@/lib/pricing";
import { SubmitButton } from "./SubmitButton";
import { FinanceiroSection } from "./FinanceiroSection";

export const dynamic = "force-dynamic";

function toInputDate(d: Date | null | undefined) {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "9px 12px",
  fontSize: "13px",
  color: "var(--text)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--muted)",
  marginBottom: "6px",
  display: "block",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  color: "#000000",
};

const sectionCard: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "16px",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default async function EditarReservaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true, status: true, tripType: true, vehicleType: true, passengerCount: true,
      routeLabel: true, origin: true, dest: true,
      hotel: true, hotelAddress: true,
      idaDate: true, idaFlightTime: true, idaFlightNumber: true,
      voltaDate: true, voltaFlightTime: true, voltaFlightNumber: true,
      totalCents: true, depositCents: true, remainderCents: true,
      optionalsJson: true, payMethod: true, affiliateCode: true,
      contractAcceptedAt: true, contractAcceptedVersion: true, zohoEventUid: true,
      customer: true,
      passengers: true,
    },
  });

  if (!booking) notFound();

  const action = updateBooking.bind(null, id);

  // Parseia optionalsJson para pré-popular campos
  let currentAddons: Record<string, number> = {};
  let currentChildSeats: Record<string, number> = {};
  let currentCityTour: { enabled?: boolean; date?: string; valueCents?: number; dest?: string } | null = null;
  let currentCashbackRedeemed = 0;
  try {
    const optJson = booking.optionalsJson ? JSON.parse(booking.optionalsJson as string) : {};
    const raw = typeof optJson === "object" && optJson !== null ? optJson : {};
    // Suporta formato novo { addons, childSeats } e formato antigo flat
    if ("addons" in raw) {
      currentAddons = ((raw as Record<string, unknown>).addons as Record<string, number>) ?? {};
      currentChildSeats =
        ((raw as Record<string, unknown>).childSeats as Record<string, number>) ?? {};
    } else {
      currentAddons = raw as Record<string, number>;
    }

    if ("cityTour" in raw && raw.cityTour) {
      currentCityTour = raw.cityTour as { enabled?: boolean; date?: string; valueCents?: number; dest?: string };
    }

    if ("_cashbackRedeemedCents" in raw) {
      currentCashbackRedeemed = Number(raw._cashbackRedeemedCents) || 0;
    }
  } catch {
    /* sem adicionais */
  }

  const addonIds: AddonId[] = [
    "romantica",
    "recepcao",
    "hotel_porto_alegre",
    "chaves",
    "duas_hospedagens",
  ];
  const childSeatIds: ChildSeatId[] = ["bebe_conforto", "cadeirinha", "assento_elevacao"];

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
          <Link
            href={`/admin/reservas/${id}`}
            style={{ color: "var(--muted)", fontSize: "13px", textDecoration: "none" }}
          >
            ← Voltar
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Editar Reserva</h1>
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
              {booking.customer.name} · #{id.slice(0, 8)}…
            </p>
          </div>
        </div>

        <form action={action}>
          {/* Cliente */}
          <div style={sectionCard}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "18px" }}>👤 Cliente</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Field label="Nome completo">
                <input name="name" defaultValue={booking.customer.name} style={inputStyle} />
              </Field>
              <Field label="WhatsApp">
                <input name="phone" defaultValue={booking.customer.phone} style={inputStyle} />
              </Field>
              <Field label="E-mail">
                <input
                  name="email"
                  type="email"
                  defaultValue={booking.customer.email}
                  style={inputStyle}
                />
              </Field>
              <Field label="Data de nascimento 🎂">
                <input
                  name="birthDate"
                  type="date"
                  defaultValue={toInputDate(booking.customer.birthDate)}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>

          {/* Viagem */}
          <div style={sectionCard}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "18px" }}>🚗 Viagem</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Field label="Tipo de viagem">
                <select name="tripType" defaultValue={booking.tripType} style={selectStyle}>
                  <option value="ida_volta">Chegada In + Retorno Out</option>
                  <option value="ida">Somente Chegada In</option>
                  <option value="volta">Somente Retorno Out</option>
                  <option value="so_citytour">Só City Tour</option>
                </select>
              </Field>
              <Field label="Veículo">
                <select name="vehicleType" defaultValue={booking.vehicleType} style={selectStyle}>
                  <option value="Sedan Premium">Sedan Premium</option>
                  <option value="Spin 6 lugares">Spin 6 Lugares</option>
                  <option value="Sedan Executivo">Sedan Executivo</option>
                  <option value="SUV">SUV</option>
                  <option value="SUV Elétrico">SUV Elétrico</option>
                </select>
              </Field>
              <Field label="Nº de passageiros">
                <input
                  name="passengerCount"
                  type="number"
                  min="1"
                  max="12"
                  defaultValue={booking.passengerCount}
                  style={inputStyle}
                />
              </Field>
              <Field label="Hotel / Destino na Serra">
                <input
                  name="hotel"
                  defaultValue={booking.hotel ?? ""}
                  style={inputStyle}
                  placeholder="Ex: Hotel Ritta Höppner"
                />
              </Field>
              <Field label="Endereço / Operação">
                <input
                  name="hotelAddress"
                  defaultValue={booking.hotelAddress ?? ""}
                  style={inputStyle}
                  placeholder="Endereço completo ou observação"
                />
              </Field>
            </div>
          </div>

          {/* Chegada In */}
          <div style={sectionCard}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "18px" }}>
              ✈️ Chegada In (Aeroporto → Serra)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <Field label="Data de chegada">
                <input
                  name="idaDate"
                  type="date"
                  defaultValue={toInputDate(booking.idaDate)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Horário do voo (chegada)">
                <input
                  name="idaFlightTime"
                  type="time"
                  defaultValue={booking.idaFlightTime ?? ""}
                  style={inputStyle}
                />
              </Field>
              <Field label="Nº do voo">
                <input
                  name="idaFlightNumber"
                  defaultValue={booking.idaFlightNumber ?? ""}
                  style={inputStyle}
                  placeholder="Ex: G3 1234"
                />
              </Field>
            </div>
          </div>

          {/* Retorno Out */}
          <div style={sectionCard}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "18px" }}>
              ↩️ Retorno Out (Serra → Aeroporto)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <Field label="Data do retorno">
                <input
                  name="voltaDate"
                  type="date"
                  defaultValue={toInputDate(booking.voltaDate)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Horário do voo (saída)">
                <input
                  name="voltaFlightTime"
                  type="time"
                  defaultValue={booking.voltaFlightTime ?? ""}
                  style={inputStyle}
                />
              </Field>
              <Field label="Nº do voo">
                <input
                  name="voltaFlightNumber"
                  defaultValue={booking.voltaFlightNumber ?? ""}
                  style={inputStyle}
                  placeholder="Ex: LA 4567"
                />
              </Field>
            </div>
          </div>

          {/* Financeiro */}
          <div style={sectionCard}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "18px" }}>💰 Financeiro</p>
            <FinanceiroSection
              totalCents={booking.totalCents}
              depositCents={booking.depositCents}
              cashbackRedeemedCents={currentCashbackRedeemed}
              remainderCents={booking.remainderCents}
              payMethod={booking.payMethod}
            />
          </div>

          {/* Adicionais */}
          <div style={sectionCard}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "18px" }}>➕ Adicionais</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {addonIds.map((addonId) => (
                <label
                  key={addonId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  <input
                    type="checkbox"
                    name={`addon_${addonId}`}
                    value="1"
                    defaultChecked={
                      !!(currentAddons[addonId] && Number(currentAddons[addonId]) > 0)
                    }
                    style={{ width: "16px", height: "16px", accentColor: "var(--gold)" }}
                  />
                  <span>
                    {ADDONS[addonId].label}
                    {ADDONS[addonId].free ? (
                      <span style={{ color: "var(--muted)", fontSize: "11px" }}> (gratuito)</span>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: "11px" }}>
                        {" "}
                        +R${ADDONS[addonId].price.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Cadeirinhas */}
          <div style={sectionCard}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "18px" }}>
              👶 Equipamento Infantil
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              {childSeatIds.map((seatId) => (
                <Field key={seatId} label={CHILD_SEAT_LABELS[seatId]}>
                  <input
                    name={`child_${seatId}`}
                    type="number"
                    min="0"
                    max="6"
                    defaultValue={Number(currentChildSeats[seatId] ?? 0)}
                    style={inputStyle}
                  />
                </Field>
              ))}
            </div>
            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "10px" }}>
              Obrigatório por lei (CONTRAN 819/2021) para crianças menores de 10 anos ou abaixo de
              1,45m. Fornecido gratuitamente pela Multi Trip.
            </p>
          </div>

          {/* City Tour */}
          <div style={sectionCard}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "18px" }}>🗺️ City Tour</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "13px",
                  gridColumn: "span 2",
                }}
              >
                <input
                  type="checkbox"
                  name="cityTourEnabled"
                  value="1"
                  defaultChecked={!!currentCityTour?.enabled}
                  style={{ width: "16px", height: "16px", accentColor: "var(--gold)" }}
                />
                <span>Ativar City Tour nesta reserva</span>
              </label>
              <Field label="Destino do City Tour">
                <input
                  name="cityTourDest"
                  type="text"
                  defaultValue={currentCityTour?.dest ?? "Gramado e Canela"}
                  style={inputStyle}
                />
              </Field>
              <Field label="Data do City Tour">
                <input
                  name="cityTourDate"
                  type="date"
                  defaultValue={currentCityTour?.date ?? ""}
                  style={inputStyle}
                />
              </Field>
              <Field label="Valor Cobrado (R$)">
                <input
                  name="cityTourValue"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={
                    currentCityTour?.valueCents ? (currentCityTour.valueCents / 100).toFixed(2) : ""
                  }
                  style={inputStyle}
                  placeholder="0.00"
                />
              </Field>
            </div>
          </div>

          {/* Botões */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "8px",
            }}
          >
            <Link
              href={`/admin/reservas/${id}`}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--muted)",
                textDecoration: "none",
              }}
            >
              Cancelar
            </Link>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
