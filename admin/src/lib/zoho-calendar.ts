/**
 * Integração com Zoho Calendar API
 * Suporta a criação de múltiplos eventos para a mesma reserva (Ida, Volta e City Tour).
 * Inclui auto-renovação de OAuth 2.0 (Refresh Token).
 */

const ZOHO_API_URL = "https://calendar.zoho.com/api/v1";

// Função auxiliar para pegar o Token
export async function getZohoToken(): Promise<string> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("⚠️ Faltam credenciais do Zoho no arquivo .env");
    return "";
  }

  try {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    });

    const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();
    if (data.access_token) return data.access_token;

    console.error("Erro ao renovar token Zoho:", data);
    return "";
  } catch (error) {
    console.error("Falha de rede ao buscar token Zoho:", error);
    return "";
  }
}

// Formatação de Data exigida pelo Zoho v1
function formatZohoDate(
  dateObj: Date | string | null,
  timeStr: string | null,
  addMinutes: number = 0
) {
  if (!dateObj) return null;
  const d = new Date(dateObj);

  // Extrai a data em UTC (datas salvas como noon BRT = 15:00 UTC, dia correto em ambos)
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  // Horário em BRT digitado pelo usuário (ex: "14:30"), padrão meio-dia
  let h = 12;
  let m = 0;
  if (timeStr) {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      h = parseInt(match[1], 10);
      m = parseInt(match[2], 10);
    }
  }

  // Converte BRT → UTC internamente (BRT = UTC-3, soma 3h) para aritmética correta
  const eventUTC = new Date(Date.UTC(year, month - 1, day, h + 3, m, 0));

  // Aplica offset em minutos (ex: -240 = 4h antes para pick-up da volta)
  eventUTC.setTime(eventUTC.getTime() + addMinutes * 60 * 1000);

  // Converte UTC → BRT (subtrai 3h) e formata usando métodos UTC
  const brt = new Date(eventUTC.getTime() - 3 * 60 * 60 * 1000);

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${brt.getUTCFullYear()}${pad(brt.getUTCMonth() + 1)}${pad(brt.getUTCDate())}T${pad(brt.getUTCHours())}${pad(brt.getUTCMinutes())}00`;
}

function formatCurrency(cents: number | null | undefined) {
  if (cents == null) return "N/A";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(dateObj: string | Date | null) {
  if (!dateObj) return "-";
  try {
    const d = new Date(dateObj);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
  } catch {
    return String(dateObj);
  }
}

function calcPickupTime(timeStr: string | null) {
  if (!timeStr) return "-";
  const m = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return timeStr;
  let h = parseInt(m[1], 10) - 4;
  if (h < 0) h += 24;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${m[2]}`;
}

function buildAcessorios(res: any) {
  if (!res.optionalsJson) return "Não";
  try {
    const opt = JSON.parse(res.optionalsJson);
    const seats = opt.childSeats || {};
    const parts = [];
    if (seats.bebe_conforto) parts.push(`${seats.bebe_conforto}x Bebê Conforto`);
    if (seats.cadeirinha) parts.push(`${seats.cadeirinha}x Cadeirinha`);
    if (seats.assento_elevacao) parts.push(`${seats.assento_elevacao}x Assento de elevação`);

    if (parts.length > 0) return `Sim (${parts.join(", ")})`;
    return "Não";
  } catch {
    return "Não";
  }
}

interface ZohoEventPayload {
  title: string;
  dateandtime: {
    timezone: string;
    start: string | null;
    end: string | null;
  };
  description: string;
  color: string;
  reminders: { action: string; minutes: string }[];
  etag?: string;
}

// Constrói o array de eventos baseado nos dados que o actions.ts envia
function buildEventPayloads(res: any): ZohoEventPayload[] {
  const events: ZohoEventPayload[] = [];
  const acessoriosStr = buildAcessorios(res);
  const commonHeader = `👤 Responsável: ${res.clienteName}
📱 WhatsApp: ${res.clientePhone}
👥 Passageiros: ${res.passengerCount || 1}
🧒 Acessórios Infantis: ${acessoriosStr}`;

  const hotelOrAddress = [res.hotel, res.hotelAddress].filter(Boolean).join(" - ") || "-";
  const origin = res.partida || "Aeroporto Salgado Filho (POA)";
  const isCaxias =
    origin.toLowerCase().includes("caxias") ||
    (res.destino && res.destino.toLowerCase().includes("caxias"));
  const prefixIn = isCaxias ? "Caxias In" : "In";
  const prefixOut = isCaxias ? "Caxias Out" : "Out";
  const paymentInfo = `\n\n🚙 Veículo: ${res.veiculo || "-"}
💰 Total: ${formatCurrency(res.totalCents)}
💳 Pagamento: ${res.payMethod || "-"}
#️⃣ Reserva: #${res.bookingId}`;

  // 1. EVENTO DE IDA
  if (res.idaDate) {
    const descIn = `${commonHeader}
📅 Data: ${formatDateBR(res.idaDate)}
🕒 Horário do Voo: ${res.idaFlightTime || "-"}
📍 Origem: ${origin}
📍 Destino: ${hotelOrAddress}
✈️ Voo In: ${res.idaFlightNumber || "-"}${paymentInfo}`;

    events.push({
      title: `${prefixIn} - ${res.clienteName} - ${res.veiculo} (${res.passengerCount} pax)`,
      dateandtime: {
        timezone: "America/Sao_Paulo",
        start: formatZohoDate(res.idaDate, res.idaFlightTime, 0),
        end: formatZohoDate(res.idaDate, res.idaFlightTime, 5), // Duração: 5 min
      },
      description: descIn,
      color: "#8cbf40",
      reminders: [
        { action: "popup", minutes: "1440" },
        { action: "popup", minutes: "120" },
      ],
    });
  }

  // 2. EVENTO DE VOLTA
  if (res.voltaDate) {
    const descOut = `${commonHeader}
📅 Data: ${formatDateBR(res.voltaDate)}
🕒 Horário de Saída (Pick-up): ${calcPickupTime(res.voltaFlightTime)}
🕒 Horário do Voo: ${res.voltaFlightTime || "-"}
📍 Origem: ${hotelOrAddress}
📍 Destino: ${origin}
✈️ Voo Out: ${res.voltaFlightNumber || "-"}${paymentInfo}`;

    events.push({
      title: `${prefixOut} - ${res.clienteName} - ${res.veiculo} (${res.passengerCount} pax)`,
      dateandtime: {
        timezone: "America/Sao_Paulo",
        start: formatZohoDate(res.voltaDate, res.voltaFlightTime, -240), // 4 horas antes do voo
        end: formatZohoDate(res.voltaDate, res.voltaFlightTime, -235),
      },
      description: descOut,
      color: "#f97316",
      reminders: [
        { action: "popup", minutes: "1440" },
        { action: "popup", minutes: "120" },
      ],
    });
  }

  // 3. EVENTO DE CITY TOUR
  if (res.cityTourDate) {
    const d = new Date(`${res.cityTourDate}T12:00:00-03:00`);
    const descCity = `${commonHeader}
📅 Data: ${formatDateBR(d)}
🕒 Horário: 09:00 às 17:00
📍 Origem: ${hotelOrAddress}
📍 Destino: Gramado e Canela${paymentInfo}`;

    events.push({
      title: `City Tour - ${res.clienteName} (${res.passengerCount} pax)`,
      dateandtime: {
        timezone: "America/Sao_Paulo",
        start: formatZohoDate(d, "09:00", 0),
        end: formatZohoDate(d, "17:00", 0),
      },
      description: descCity,
      color: "#eab308",
      reminders: [{ action: "popup", minutes: "1440" }],
    });
  }

  return events;
}

// --- Wrappers de compatibilidade para as chamadas do sistema ---

export async function criarEventoZoho(reservation: any) {
  try {
    const accessToken = await getZohoToken();
    const calendarId = process.env.ZOHO_CALENDAR_ID || process.env.ZOHO_CALENDAR_UID;
    if (!calendarId || !accessToken) return null;

    const payloads = buildEventPayloads(reservation);
    const uids = [];

    for (const evt of payloads) {
      const params = new URLSearchParams({ eventdata: JSON.stringify(evt) });
      const res = await fetch(`${ZOHO_API_URL}/calendars/${calendarId}/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) uids.push(data.events[0].uid);
      } else {
        const errTxt = await res.text();
        console.error("Erro da API do Zoho (POST):", res.status, errTxt);
      }
    }

    return uids.length > 0 ? uids.join(",") : null;
  } catch (error) {
    console.error("Erro em criarEventoZoho:", error);
    return null;
  }
}

export async function editarEventoZoho(arg1: any, arg2?: any) {
  try {
    const accessToken = await getZohoToken();
    const calendarId = process.env.ZOHO_CALENDAR_ID || process.env.ZOHO_CALENDAR_UID;
    if (!calendarId || !accessToken) return null;

    // Suporta tanto editarEventoZoho(reservation) quanto editarEventoZoho(uid, reservation)
    const uidList = typeof arg1 === "string" ? arg1 : "";
    const reservation = arg2 !== undefined ? arg2 : arg1;

    if (!uidList) return await criarEventoZoho(reservation);

    const payloads = buildEventPayloads(reservation);
    let uids = uidList.split(",");
    const newUids: string[] = [];

    for (let i = 0; i < payloads.length; i++) {
      const uid = uids[i];
      const evt = payloads[i];
      if (!evt) continue;

      if (!uid) {
        // Não tínhamos UID para este evento (ex: adicionou data de volta agora)
        const params = new URLSearchParams({ eventdata: JSON.stringify(evt) });
        const res = await fetch(`${ZOHO_API_URL}/calendars/${calendarId}/events`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.events && data.events.length > 0) newUids.push(data.events[0].uid);
        }
        continue;
      }

      // Buscar ETAG do evento existente
      const getRes = await fetch(`${ZOHO_API_URL}/calendars/${calendarId}/events/${uid}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const getData = await getRes.json();

      if (getData.events && getData.events[0] && getData.events[0].etag) {
        // Evento existe, fazer PUT com ETAG
        evt.etag = getData.events[0].etag;
        const params = new URLSearchParams({ eventdata: JSON.stringify(evt) });
        const res = await fetch(`${ZOHO_API_URL}/calendars/${calendarId}/events/${uid}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        if (!res.ok) {
          console.error("Erro API Zoho (PUT):", res.status, await res.text());
        } else {
          newUids.push(uid); // Mantém o mesmo UID
        }
      } else {
        // Evento não existe mais no Zoho (apagado manualmente ou erro), vamos recriar
        const params = new URLSearchParams({ eventdata: JSON.stringify(evt) });
        const res = await fetch(`${ZOHO_API_URL}/calendars/${calendarId}/events`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.events && data.events.length > 0) newUids.push(data.events[0].uid);
        }
      }
    }

    // Se sobrar algum UID (ex: apagou data de volta), tentamos excluir do Zoho
    for (let i = payloads.length; i < uids.length; i++) {
      if (uids[i]) await excluirEventoZoho(uids[i]).catch(() => {});
    }

    return newUids.length > 0 ? newUids.join(",") : null;
  } catch (error) {
    console.error("Erro em editarEventoZoho:", error);
    return null;
  }
}

export async function excluirEventoZoho(reservationId: string) {
  try {
    const accessToken = await getZohoToken();
    const calendarId = process.env.ZOHO_CALENDAR_ID || process.env.ZOHO_CALENDAR_UID;
    if (!calendarId || !accessToken) return null;

    const uids = reservationId.split(",");
    for (const uid of uids) {
      if (!uid) continue;
      await fetch(`${ZOHO_API_URL}/calendars/${calendarId}/events/${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
    return true;
  } catch (error) {
    console.error("Erro em excluirEventoZoho:", error);
    return null;
  }
}


// Função de sincronização com Zoho Calendar
export async function syncToZoho(
    calendarId: string,
    accessToken: string,
    reservation: any
  ): Promise<{ event_uid: string }> {
    try {
          // Criar payloads de eventos para Zoho
      const payloads: ZohoEventPayload[] = [];

      // Evento de IDA
      if (reservation.dataIda && reservation.horaSaida) {
              const eventIda = {
                        title: `Viagem: ${reservation.clienteName} - IDA`,
                        dateandtime: {
                                    timezone: "America/Sao_Paulo",
                                    start: formatZohoDate(reservation.dataIda, reservation.horaSaida),
                                    end: formatZohoDate(reservation.dataIda, reservation.horaSaida, 180),
                        },
                        description: `Passageiros: ${reservation.passengerCount}\nVeículo: ${reservation.vehicle || 'N/A'}\nOrigem: ${reservation.clienteAddress || 'N/A'}`,
                        color: "#ebab3b",
                        reminders: [{ action: "popup", minutes: "1440" }],
              };
              payloads.push(eventIda);
      }

      // Evento de VOLTA
      if (reservation.dataVolta && reservation.horaRetorno) {
              const eventVolta = {
                        title: `Viagem: ${reservation.clienteName} - VOLTA`,
                        dateandtime: {
                                    timezone: "America/Sao_Paulo",
                                    start: formatZohoDate(reservation.dataVolta, reservation.horaRetorno),
                                    end: formatZohoDate(reservation.dataVolta, reservation.horaRetorno, 180),
                        },
                        description: `Passageiros: ${reservation.passengerCount}\nVeículo: ${reservation.vehicle || 'N/A'}`,
                        color: "#5bd65b",
                        reminders: [{ action: "popup", minutes: "1440" }],
              };
              payloads.push(eventVolta);
      }

      // Evento de CITY TOUR (se houver)
      if (reservation.dataCityTourDate) {
              const eventCity = {
                        title: `City Tour: ${reservation.clienteName}`,
                        dateandtime: {
                                    timezone: "America/Sao_Paulo",
                                    start: formatZohoDate(reservation.dataCityTourDate, "09:00"),
                                    end: formatZohoDate(reservation.dataCityTourDate, "17:00"),
                        },
                        description: `City Tour - ${reservation.clienteName}`,
                        color: "#3366ff",
                        reminders: [{ action: "popup", minutes: "1440" }],
              };
              payloads.push(eventCity);
      }

      // Se não houver payloads, lançar erro
      if (payloads.length === 0) {
              throw new Error("Nenhum evento disponível para sincronizar");
      }

      // Criar o primeiro evento
      const response = await fetch(
              `${ZOHO_API_URL}/calendars/${calendarId}/events`,
        {
                  method: "POST",
                  headers: {
                              Authorization: `Bearer ${accessToken}`,
                              "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payloads[0]),
        }
            );

      if (!response.ok) {
              throw new Error(`Erro HTTP ${response.status} ao criar evento no Zoho`);
      }

      const data = await response.json();
          const eventUid = data.uid || data.event?.uid;

      if (!eventUid) {
              throw new Error("UID do evento não retornado pelo Zoho");
      }

      // Criar eventos adicionais se houver
      for (let i = 1; i < payloads.length; i++) {
              await fetch(`${ZOHO_API_URL}/calendars/${calendarId}/events`, {
                        method: "POST",
                        headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                    "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payloads[i]),
              }).catch(err => console.warn(`Aviso ao criar evento ${i + 1}:`, err));
      }

      return { event_uid: eventUid };
    } catch (error) {
          console.error("Erro em syncToZoho:", error);
          throw error;
    }
}
