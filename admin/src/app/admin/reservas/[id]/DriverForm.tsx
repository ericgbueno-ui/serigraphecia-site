"use client";

import { useState, useTransition } from "react";
import { saveDriverInfo } from "../actions";

interface Props {
  booking: any;
  drivers?: any[];
  childEquipmentStr: string;
  driverInPaymentCents: number | null;
  driverOutPaymentCents: number | null;
  driverCityTourPaymentCents: number | null;
  isIda: boolean;
  isVolta: boolean;
  cityTour: any;
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

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
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
    timeZone: "America/Sao_Paulo",
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
  if (t === "so_citytour") return "Somente City Tour";
  if (t === "ida_volta") return "Chegada In + Retorno Out";
  if (t === "volta") return "Retorno Out";
  return "Chegada In";
}

export function DriverForm({
  booking,
  drivers,
  childEquipmentStr,
  driverInPaymentCents,
  driverOutPaymentCents,
  driverCityTourPaymentCents,
  isIda,
  isVolta,
  cityTour,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const [inName, setInName] = useState(booking.driverInName ?? "");
  const [inCar, setInCar] = useState(booking.driverInCar ?? "");
  const [inPhone, setInPhone] = useState(booking.driverInWhatsapp ?? "");

  const [outName, setOutName] = useState(booking.driverOutName ?? "");
  const [outCar, setOutCar] = useState(booking.driverOutCar ?? "");
  const [outPhone, setOutPhone] = useState(booking.driverOutWhatsapp ?? "");

  const [ctName, setCtName] = useState(booking.driverCityTourName ?? "");
  const [ctCar, setCtCar] = useState(booking.driverCityTourCar ?? "");
  const [ctPhone, setCtPhone] = useState(booking.driverCityTourWhatsapp ?? "");

  const [inPaymentStr, setInPaymentStr] = useState(
    driverInPaymentCents ? (driverInPaymentCents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [outPaymentStr, setOutPaymentStr] = useState(
    driverOutPaymentCents ? (driverOutPaymentCents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [ctPaymentStr, setCtPaymentStr] = useState(
    driverCityTourPaymentCents ? (driverCityTourPaymentCents / 100).toFixed(2).replace(".", ",") : ""
  );

  function handleSelectDriver(type: "IN" | "OUT" | "CT", val: string) {
    if (!val || !drivers) return;
    const d = drivers.find((x) => x.id === val);
    if (!d) return;

    const carStr = `${d.carModel} · ${d.carPlate}`;
    if (type === "IN") {
      setInName(d.name);
      setInCar(carStr);
      setInPhone(d.phone);
    } else if (type === "OUT") {
      setOutName(d.name);
      setOutCar(carStr);
      setOutPhone(d.phone);
    } else {
      setCtName(d.name);
      setCtCar(carStr);
      setCtPhone(d.phone);
    }
  }

  function handlePaymentBlur(val: string, setter: (v: string) => void) {
    if (!val.trim()) {
      setter("");
      return;
    }
    const clean = val.replace(/\s/g, "").replace(",", ".");
    const parsed = parseFloat(clean);
    if (!isNaN(parsed) && parsed >= 0) {
      setter(parsed.toFixed(2).replace(".", ","));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    // ── Chegada IN Validação ────────────────────────────────────────────────
    if (isIda) {
      const driverInName = formData.get("driverInName")?.toString().trim() || "";
      const driverInCar = formData.get("driverInCar")?.toString().trim() || "";
      const driverInWhatsapp = formData.get("driverInWhatsapp")?.toString().replace(/\D/g, "") || "";
      const driverInPayment = formData.get("driverInPayment")?.toString().trim() || "";

      if (driverInName) {
        const missing: string[] = [];
        if (!driverInCar) missing.push("Veículo (modelo / placa)");
        if (!driverInWhatsapp) missing.push("WhatsApp do Motorista");
        
        const payVal = parseFloat(driverInPayment.replace(",", "."));
        if (!driverInPayment || isNaN(payVal) || payVal <= 0) {
          missing.push("Valor pago ao motorista (deve ser maior que R$ 0,00)");
        }

        if (missing.length > 0) {
          alert(`⚠️ Trecho de CHEGADA (IN):\nPara designar o motorista "${driverInName}", você também precisa preencher:\n\n- ${missing.join("\n- ")}`);
          return;
        }
      }
    }

    // ── Retorno OUT Validação ───────────────────────────────────────────────
    if (isVolta) {
      const driverOutName = formData.get("driverOutName")?.toString().trim() || "";
      const driverOutCar = formData.get("driverOutCar")?.toString().trim() || "";
      const driverOutWhatsapp = formData.get("driverOutWhatsapp")?.toString().replace(/\D/g, "") || "";
      const driverOutPayment = formData.get("driverOutPayment")?.toString().trim() || "";

      if (driverOutName) {
        const missing: string[] = [];
        if (!driverOutCar) missing.push("Veículo (modelo / placa)");
        if (!driverOutWhatsapp) missing.push("WhatsApp do Motorista");
        
        const payVal = parseFloat(driverOutPayment.replace(",", "."));
        if (!driverOutPayment || isNaN(payVal) || payVal <= 0) {
          missing.push("Valor pago ao motorista (deve ser maior que R$ 0,00)");
        }

        if (missing.length > 0) {
          alert(`⚠️ Trecho de RETORNO (OUT):\nPara designar o motorista "${driverOutName}", você também precisa preencher:\n\n- ${missing.join("\n- ")}`);
          return;
        }
      }
    }

    // ── City Tour Validação ──────────────────────────────────────────────────
    if (cityTour?.enabled) {
      const driverCityTourName = formData.get("driverCityTourName")?.toString().trim() || "";
      const driverCityTourCar = formData.get("driverCityTourCar")?.toString().trim() || "";
      const driverCityTourWhatsapp = formData.get("driverCityTourWhatsapp")?.toString().replace(/\D/g, "") || "";
      const driverCityTourPayment = formData.get("driverCityTourPayment")?.toString().trim() || "";

      if (driverCityTourName) {
        const missing: string[] = [];
        if (!driverCityTourCar) missing.push("Veículo (modelo / placa)");
        if (!driverCityTourWhatsapp) missing.push("WhatsApp do Motorista");
        
        const payVal = parseFloat(driverCityTourPayment.replace(",", "."));
        if (!driverCityTourPayment || isNaN(payVal) || payVal <= 0) {
          missing.push("Valor pago ao motorista (deve ser maior que R$ 0,00)");
        }

        if (missing.length > 0) {
          alert(`⚠️ Trecho de CITY TOUR:\nPara designar o motorista "${driverCityTourName}", você também precisa preencher:\n\n- ${missing.join("\n- ")}`);
          return;
        }
      }
    }

    // Chamada do Server Action
    startTransition(async () => {
      try {
        await saveDriverInfo(booking.id, formData);
      } catch (err) {
        console.error("[DriverForm] Erro ao salvar motoristas:", err);
      }
    });
  }

  return (
    <div style={{ ...card, gridColumn: "1 / -1" }}>
      <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px", color: "var(--text)" }}>
        🧑‍✈️ ✈️ Motoristas Designados
      </p>
      <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "20px" }}>
        {tripLabel(booking.tripType)}
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* ── Chegada IN ── */}
          {isIda && (
            <div
              style={{
                background: "rgba(62,207,142,0.04)",
                border: "1px solid rgba(62,207,142,0.2)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#3ecf8e", marginBottom: "12px", letterSpacing: "0.05em" }}>
                🛬 MOTORISTA CHEGADA (IN)
              </p>

              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "8px",
                  border: "1px dashed rgba(62,207,142,0.3)",
                }}
              >
                <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "8px", fontWeight: 600 }}>
                  Voucher para o motorista (Copie e cole):
                </p>
                <textarea
                  readOnly
                  style={{
                    width: "100%",
                    height: "130px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text)",
                    fontSize: "12px",
                    resize: "none",
                    outline: "none",
                    fontFamily: "monospace",
                  }}
                  value={`*VOUCHER DE CHEGADA (IN)*\n👤 Responsável: ${booking.customer?.name || ""}\n📱 WhatsApp: ${booking.customer?.phone || ""}\n👥 Passageiros: ${booking.passengerCount || 1}\n🧒 Acessórios Infantis: ${childEquipmentStr}\n📅 Data: ${formatDate(booking.idaDate)}\n🕒 Horário do Voo: ${booking.idaFlightTime || "—"}\n📍 Destino: ${booking.hotel || "A combinar"}${booking.hotelAddress ? ` - ${booking.hotelAddress}` : ""}`}
                />
              </div>

              {/* Dados salvos */}
              {booking.driverInName && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                    marginBottom: "14px",
                    padding: "10px 12px",
                    background: "rgba(62,207,142,0.06)",
                    borderRadius: "10px",
                  }}
                >
                  <div>
                    <p style={label}>Motorista</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{booking.driverInName}</p>
                  </div>
                  <div>
                    <p style={label}>Veículo</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{booking.driverInCar || "—"}</p>
                  </div>
                  <div>
                    <p style={label}>WhatsApp</p>
                    <a
                      href={`https://wa.me/55${booking.driverInWhatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "13px", color: "#3ecf8e", fontWeight: 600, textDecoration: "none" }}
                    >
                      {booking.driverInWhatsapp || "—"}
                    </a>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div style={{ gridColumn: "1 / -1", marginBottom: "4px" }}>
                  <label style={label}>Selecione um Motorista da Frota (Opcional)</label>
                  <select
                    onChange={(e) => handleSelectDriver("IN", e.target.value)}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
                      borderRadius: "10px", padding: "9px 12px", fontSize: "13px", color: "var(--text)", outline: "none"
                    }}
                  >
                    <option value="">-- Escolher motorista aprovado --</option>
                    {drivers?.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.carModel})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>Nome do Motorista</label>
                  <input
                    name="driverInName"
                    value={inName}
                    onChange={e => setInName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={label}>Veículo (modelo / placa)</label>
                  <input
                    name="driverInCar"
                    value={inCar}
                    onChange={e => setInCar(e.target.value)}
                    placeholder="Ex: Spin Prata · ABC-1234"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={label}>WhatsApp do Motorista</label>
                  <input
                    name="driverInWhatsapp"
                    value={inPhone}
                    onChange={e => setInPhone(e.target.value)}
                    placeholder="51999999999"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Valor pago */}
              <div style={{ marginTop: "12px" }}>
                <label style={{ ...label, color: "#f87171" }}>💸 Valor pago ao motorista</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(248,113,113,0.06)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    width: "180px",
                  }}>
                    <span style={{ padding: "9px 10px 9px 12px", fontSize: "13px", color: "#f87171", fontWeight: 600, flexShrink: 0 }}>R$</span>
                    <input
                      name="driverInPayment"
                      type="text"
                      value={inPaymentStr}
                      onChange={(e) => setInPaymentStr(e.target.value)}
                      onBlur={(e) => handlePaymentBlur(e.target.value, setInPaymentStr)}
                      placeholder="0,00"
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        padding: "9px 12px 9px 0",
                        fontSize: "13px",
                        color: "var(--text)",
                        outline: "none",
                        width: "100%",
                      }}
                    />
                  </div>
                  {driverInPaymentCents ? (
                    <p style={{ fontSize: "12px", color: "#f87171" }}>✓ {brl(driverInPaymentCents)}</p>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* ── Retorno OUT ── */}
          {isVolta && (
            <div
              style={{
                background: "rgba(201,168,76,0.04)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--gold)", marginBottom: "12px", letterSpacing: "0.05em" }}>
                🛫 MOTORISTA RETORNO (OUT)
              </p>

              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "8px",
                  border: "1px dashed rgba(201,168,76,0.3)",
                }}
              >
                <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "8px", fontWeight: 600 }}>
                  Voucher para o motorista (Copie e cole):
                </p>
                <textarea
                  readOnly
                  style={{
                    width: "100%",
                    height: "130px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text)",
                    fontSize: "12px",
                    resize: "none",
                    outline: "none",
                    fontFamily: "monospace",
                  }}
                  value={`*VOUCHER DE RETORNO (OUT)*\n👤 Responsável: ${booking.customer?.name || ""}\n📱 WhatsApp: ${booking.customer?.phone || ""}\n👥 Passageiros: ${booking.passengerCount || 1}\n🧒 Acessórios Infantis: ${childEquipmentStr}\n📅 Data: ${formatDate(booking.voltaDate)}\n🕒 Saída do Hotel/Pousada: ${calcHotelDepartureTime(booking.voltaFlightTime)}\n📍 Origem: ${booking.hotel || "A combinar"}${booking.hotelAddress ? ` - ${booking.hotelAddress}` : ""}`}
                />
              </div>

              {/* Dados salvos */}
              {booking.driverOutName && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                    marginBottom: "14px",
                    padding: "10px 12px",
                    background: "rgba(201,168,76,0.06)",
                    borderRadius: "10px",
                  }}
                >
                  <div>
                    <p style={label}>Motorista</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{booking.driverOutName}</p>
                  </div>
                  <div>
                    <p style={label}>Veículo</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{booking.driverOutCar || "—"}</p>
                  </div>
                  <div>
                    <p style={label}>WhatsApp</p>
                    <a
                      href={`https://wa.me/55${booking.driverOutWhatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "13px", color: "#3ecf8e", fontWeight: 600, textDecoration: "none" }}
                    >
                      {booking.driverOutWhatsapp || "—"}
                    </a>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div style={{ gridColumn: "1 / -1", marginBottom: "4px" }}>
                  <label style={label}>Selecione um Motorista da Frota (Opcional)</label>
                  <select
                    onChange={(e) => handleSelectDriver("OUT", e.target.value)}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
                      borderRadius: "10px", padding: "9px 12px", fontSize: "13px", color: "var(--text)", outline: "none"
                    }}
                  >
                    <option value="">-- Escolher motorista aprovado --</option>
                    {drivers?.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.carModel})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>Nome do Motorista</label>
                  <input
                    name="driverOutName"
                    value={outName}
                    onChange={e => setOutName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={label}>Veículo (modelo / placa)</label>
                  <input
                    name="driverOutCar"
                    value={outCar}
                    onChange={e => setOutCar(e.target.value)}
                    placeholder="Ex: Spin Prata · ABC-1234"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={label}>WhatsApp do Motorista</label>
                  <input
                    name="driverOutWhatsapp"
                    value={outPhone}
                    onChange={e => setOutPhone(e.target.value)}
                    placeholder="51999999999"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Valor pago */}
              <div style={{ marginTop: "12px" }}>
                <label style={{ ...label, color: "#f87171" }}>💸 Valor pago ao motorista</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    background: "rgba(248,113,113,0.06)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: "10px", overflow: "hidden", width: "180px",
                  }}>
                    <span style={{ padding: "9px 10px 9px 12px", fontSize: "13px", color: "#f87171", fontWeight: 600, flexShrink: 0 }}>R$</span>
                    <input
                      name="driverOutPayment"
                      type="text"
                      value={outPaymentStr}
                      onChange={(e) => setOutPaymentStr(e.target.value)}
                      onBlur={(e) => handlePaymentBlur(e.target.value, setOutPaymentStr)}
                      placeholder="0,00"
                      style={{ flex: 1, background: "transparent", border: "none", padding: "9px 12px 9px 0", fontSize: "13px", color: "var(--text)", outline: "none", width: "100%" }}
                    />
                  </div>
                  {driverOutPaymentCents ? (
                    <p style={{ fontSize: "12px", color: "#f87171" }}>✓ {brl(driverOutPaymentCents)}</p>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* ── City Tour ── */}
          {cityTour?.enabled && (
            <div
              style={{
                background: "rgba(167,139,250,0.04)",
                border: "1px solid rgba(167,139,250,0.2)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#a78bfa", marginBottom: "12px", letterSpacing: "0.05em" }}>
                🏙️ MOTORISTA CITY TOUR
              </p>

              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "8px",
                  border: "1px dashed rgba(167,139,250,0.3)",
                }}
              >
                <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "8px", fontWeight: 600 }}>
                  Voucher para o motorista (Copie e cole):
                </p>
                <textarea
                  readOnly
                  style={{
                    width: "100%",
                    height: "130px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text)",
                    fontSize: "12px",
                    resize: "none",
                    outline: "none",
                    fontFamily: "monospace",
                  }}
                  value={`*VOUCHER CITY TOUR*\n👤 Responsável: ${booking.customer?.name || ""}\n📱 WhatsApp: ${booking.customer?.phone || ""}\n👥 Passageiros: ${booking.passengerCount || 1}\n🧒 Acessórios Infantis: ${childEquipmentStr}\n📅 Data: ${cityTour.date ? new Date(cityTour.date + "T12:00:00").toLocaleDateString("pt-BR") : "A combinar"}\n📍 Origem: ${booking.hotel || "A combinar"}${booking.hotelAddress ? ` - ${booking.hotelAddress}` : ""}`}
                />
              </div>

              {/* Dados salvos */}
              {booking.driverCityTourName && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                    marginBottom: "14px",
                    padding: "10px 12px",
                    background: "rgba(167,139,250,0.06)",
                    borderRadius: "10px",
                  }}
                >
                  <div>
                    <p style={label}>Motorista</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{booking.driverCityTourName}</p>
                  </div>
                  <div>
                    <p style={label}>Veículo</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{booking.driverCityTourCar || "—"}</p>
                  </div>
                  <div>
                    <p style={label}>WhatsApp</p>
                    <a
                      href={`https://wa.me/55${booking.driverCityTourWhatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "13px", color: "#3ecf8e", fontWeight: 600, textDecoration: "none" }}
                    >
                      {booking.driverCityTourWhatsapp || "—"}
                    </a>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div style={{ gridColumn: "1 / -1", marginBottom: "4px" }}>
                  <label style={label}>Selecione um Motorista da Frota (Opcional)</label>
                  <select
                    onChange={(e) => handleSelectDriver("CT", e.target.value)}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
                      borderRadius: "10px", padding: "9px 12px", fontSize: "13px", color: "var(--text)", outline: "none"
                    }}
                  >
                    <option value="">-- Escolher motorista aprovado --</option>
                    {drivers?.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.carModel})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>Nome do Motorista</label>
                  <input
                    name="driverCityTourName"
                    value={ctName}
                    onChange={e => setCtName(e.target.value)}
                    placeholder="Ex: Pedro Santos"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={label}>Veículo (modelo / placa)</label>
                  <input
                    name="driverCityTourCar"
                    value={ctCar}
                    onChange={e => setCtCar(e.target.value)}
                    placeholder="Ex: SUV Black · DEF-5678"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={label}>WhatsApp do Motorista</label>
                  <input
                    name="driverCityTourWhatsapp"
                    value={ctPhone}
                    onChange={e => setCtPhone(e.target.value)}
                    placeholder="51999999999"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "9px 12px",
                      fontSize: "13px",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Valor pago */}
              <div style={{ marginTop: "12px" }}>
                <label style={{ ...label, color: "#f87171" }}>💸 Valor pago ao motorista</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    background: "rgba(248,113,113,0.06)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: "10px", overflow: "hidden", width: "180px",
                  }}>
                    <span style={{ padding: "9px 10px 9px 12px", fontSize: "13px", color: "#f87171", fontWeight: 600, flexShrink: 0 }}>R$</span>
                    <input
                      name="driverCityTourPayment"
                      type="text"
                      value={ctPaymentStr}
                      onChange={(e) => setCtPaymentStr(e.target.value)}
                      onBlur={(e) => handlePaymentBlur(e.target.value, setCtPaymentStr)}
                      placeholder="0,00"
                      style={{ flex: 1, background: "transparent", border: "none", padding: "9px 12px 9px 0", fontSize: "13px", color: "var(--text)", outline: "none", width: "100%" }}
                    />
                  </div>
                  {driverCityTourPaymentCents ? (
                    <p style={{ fontSize: "12px", color: "#f87171" }}>✓ {brl(driverCityTourPaymentCents)}</p>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do formulário */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "var(--muted)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="notify"
                value="1"
                defaultChecked={!booking.driverNotifiedAt}
              />
              Enviar WhatsApp para o cliente com os dados do motorista
            </label>
            {booking.driverNotifiedAt && (
              <p style={{ fontSize: "11px", color: "var(--muted)", paddingLeft: "22px" }}>
                ✅ Cliente notificado em {formatDateTime(booking.driverNotifiedAt)}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              border: "none",
              background: isPending ? "rgba(255,255,255,0.06)" : "var(--gold)",
              color: isPending ? "var(--muted)" : "#05080d",
              fontSize: "13px",
              fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.6 : 1,
              transition: "all 0.15s ease",
            }}
          >
            {isPending ? "⏳ Salvando..." : "💾 Salvar motoristas"}
          </button>
        </div>
      </form>
    </div>
  );
}
