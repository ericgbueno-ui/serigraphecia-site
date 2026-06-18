"use server";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { notifyTeam, notifyCliente } from "@/lib/notify";
import { sendWhatsApp, sendWhatsAppTemplate } from "@/lib/meta-whatsapp";
import { criarEventoZoho, editarEventoZoho, excluirEventoZoho } from "@/lib/zoho-calendar";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { markLeadConverted } from "@/lib/lead";

export async function deleteBooking(id: string) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  // Exclui evento do Zoho Calendar se existir
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { zohoEventUid: true },
  });
  if (booking?.zohoEventUid) {
    await excluirEventoZoho(booking.zohoEventUid).catch((err) =>
      console.error("[BOOKING] Falha ao excluir evento Zoho:", err.message)
    );
  }

  // Delete dependents first (passengers, payments)
  await prisma.passenger.deleteMany({ where: { bookingId: id } });
  await prisma.payment.deleteMany({ where: { bookingId: id } });
  await prisma.booking.delete({ where: { id } });

  redirect("/admin/reservas");
}

export async function updateBookingStatus(
  id: string,
  status: "CONFIRMED" | "PENDING" | "CANCELLED"
) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      zohoEventUid: true,
      routeLabel: true,
      vehicleType: true,
      hotel: true,
      hotelAddress: true,
      idaDate: true,
      voltaDate: true,
      idaFlightTime: true,
      idaFlightNumber: true,
      voltaFlightTime: true,
      voltaFlightNumber: true,
      payMethod: true,
      totalCents: true,
      depositCents: true,
      remainderCents: true,
      passengerCount: true,
      origin: true,
      dest: true,
      optionalsJson: true,
      customer: { select: { name: true, phone: true } },
    },
  });

  await prisma.booking.update({ where: { id }, data: { status } });

  if (status === "CONFIRMED") {
    // Marca lead como convertido se existir no CRM
    if (booking?.customer?.phone) {
      markLeadConverted(booking.customer.phone, id).catch(() => {});
    }

    const msg =
      `🔄 *STATUS ATUALIZADO → CONFIRMADO*\n\n` +
      `🔗 Reserva: https://multitrip.com.br/admin/reservas/${id}`;
    notifyTeam(msg).catch(() => {});

    // Se não tem evento no Zoho ainda, cria agora
    if (booking && !booking.zohoEventUid) {
      let cityTourDate = null;
      try {
        const optObj = JSON.parse(booking.optionalsJson || "{}");
        if (optObj.cityTour?.enabled && optObj.cityTour?.date) {
          cityTourDate = optObj.cityTour.date;
        }
      } catch {}

      criarEventoZoho({
        bookingId: id,
        clienteName: booking.customer?.name ?? "Cliente",
        clientePhone: booking.customer?.phone ?? "",
        veiculo: booking.vehicleType ?? "Não informado",
        idaDate: booking.idaDate,
        idaFlightTime: booking.idaFlightTime,
        idaFlightNumber: booking.idaFlightNumber,
        voltaDate: booking.voltaDate,
        voltaFlightTime: booking.voltaFlightTime,
        voltaFlightNumber: booking.voltaFlightNumber,
        cityTourDate,
        hotel: booking.hotel,
        hotelAddress: booking.hotelAddress,
        routeLabel: booking.routeLabel,
        payMethod: booking.payMethod,
        depositCents: booking.depositCents,
        remainderCents: booking.remainderCents,
        partida: booking.origin ?? "Aeroporto Salgado Filho (POA)",
        destino: booking.dest ?? "Gramado/Canela",
        passengerCount: booking.passengerCount ?? 1,
        totalCents: booking.totalCents ?? 0,
        optionalsJson: booking.optionalsJson,
        origem: "manual",
      })
        .then((uid) => {
          if (uid && typeof uid === "string") {
            prisma.booking.update({ where: { id }, data: { zohoEventUid: uid } }).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }

  if (status === "CANCELLED" && booking?.zohoEventUid) {
    excluirEventoZoho(booking.zohoEventUid).catch(() => {});
    await prisma.booking.update({ where: { id }, data: { zohoEventUid: null } });
  }

  redirect(`/admin/reservas/${id}`);
}

export async function updateBooking(id: string, formData: FormData) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  // Cliente
  const name = formData.get("name")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().replace(/\D/g, "") || "";
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const birthDateRaw = formData.get("birthDate")?.toString();
  const birthDate = birthDateRaw ? new Date(`${birthDateRaw}T12:00:00-03:00`) : null;

  // Viagem
  const hotel = formData.get("hotel")?.toString().trim() || null;
  const hotelAddress = formData.get("hotelAddress")?.toString().trim() || null;
  const vehicleType = formData.get("vehicleType")?.toString().trim() || "";
  const passengerCount = parseInt(formData.get("passengerCount")?.toString() || "1", 10);
  const tripType = formData.get("tripType")?.toString() || "ida_volta";

  // Datas
  const idaDateRaw = formData.get("idaDate")?.toString();
  const idaFlightTime = formData.get("idaFlightTime")?.toString().trim() || null;
  const idaFlightNumber = formData.get("idaFlightNumber")?.toString().trim() || null;
  const voltaDateRaw = formData.get("voltaDate")?.toString();
  const voltaFlightTime = formData.get("voltaFlightTime")?.toString().trim() || null;
  const voltaFlightNumber = formData.get("voltaFlightNumber")?.toString().trim() || null;

  const idaDate = idaDateRaw ? new Date(`${idaDateRaw}T12:00:00-03:00`) : null;
  const voltaDate = voltaDateRaw ? new Date(`${voltaDateRaw}T12:00:00-03:00`) : null;

  // Financeiro
  const totalCents = Math.round(
    parseFloat(formData.get("totalCents")?.toString().replace(",", ".") || "0") * 100
  );
  const depositCents = Math.round(
    parseFloat(formData.get("depositCents")?.toString().replace(",", ".") || "0") * 100
  );
  const remainderCents = totalCents - depositCents;
  const cashbackRedeemedCents = Math.round(
    parseFloat(formData.get("cashbackRedeemed")?.toString().replace(",", ".") || "0") * 100
  ) || 0;
  const payMethod = formData.get("payMethod")?.toString() || "pix";

  // Adicionais e cadeirinhas
  const addonsRaw: Record<string, number> = {};
  for (const addonKey of [
    "romantica",
    "recepcao",
    "hotel_porto_alegre",
    "chaves",
    "duas_hospedagens",
  ]) {
    const val = formData.get(`addon_${addonKey}`)?.toString();
    if (val === "1") addonsRaw[addonKey] = 1;
  }
  const childSeatsRaw: Record<string, number> = {};
  for (const seatKey of ["bebe_conforto", "cadeirinha", "assento_elevacao"]) {
    const qty = parseInt(formData.get(`child_${seatKey}`)?.toString() || "0", 10);
    if (qty > 0) childSeatsRaw[seatKey] = qty;
  }
  const hasChildUnder10 = Object.values(childSeatsRaw).some((q) => q > 0);
  // Atualiza cliente e preserva optionalsJson existentes
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      customerId: true,
      zohoEventUid: true,
      routeLabel: true,
      origin: true,
      dest: true,
      optionalsJson: true,
    },
  });
  if (!booking) throw new Error("Reserva não encontrada.");

  let existingOptionals: Record<string, unknown> = {};
  if (booking.optionalsJson) {
    try {
      existingOptionals = JSON.parse(booking.optionalsJson) || {};
    } catch {}
  }

  const cityTourEnabled = formData.get("cityTourEnabled") === "1";
  const cityTourDate = formData.get("cityTourDate")?.toString() || "";
  const cityTourValueStr = formData.get("cityTourValue")?.toString() || "0";
  const cityTourValueCents = Math.round(parseFloat(cityTourValueStr) * 100) || 0;

  const cityTour = cityTourEnabled
    ? {
        enabled: true,
        date: cityTourDate,
        valueCents: cityTourValueCents,
      }
    : null;

  const optionalsJson = JSON.stringify({
    ...existingOptionals,
    addons: addonsRaw,
    childSeats: childSeatsRaw,
    hasChildUnder10,
    cityTour,
    _cashbackRedeemedCents: cashbackRedeemedCents,
  });

  const hotelAddressVal = hotelAddress || null;

  if (name || phone || email || birthDate) {
    await prisma.customer.update({
      where: { id: booking.customerId },
      data: {
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        ...(birthDate ? { birthDate } : {}),
      },
    });
  }

  // Atualiza booking
  await prisma.booking.update({
    where: { id },
    data: {
      hotel: hotel || undefined,
      hotelAddress: hotelAddressVal,
      vehicleType,
      passengerCount,
      tripType,
      idaDate: tripType !== "volta" ? idaDate : null,
      idaFlightTime: tripType !== "volta" ? idaFlightTime : null,
      idaFlightNumber: tripType !== "volta" ? idaFlightNumber : null,
      voltaDate: tripType !== "ida" ? voltaDate : null,
      voltaFlightTime: tripType !== "ida" ? voltaFlightTime : null,
      voltaFlightNumber: tripType !== "ida" ? voltaFlightNumber : null,
      totalCents,
      depositCents,
      remainderCents,
      payMethod,
      optionalsJson,
    },
  });

  // ── Notifica equipe e cliente sobre atualização ──────────────────────────
  notifyTeam(
    `🔄 *RESERVA ATUALIZADA (Admin)*\n\n` +
      `🔗 https://multitrip.com.br/admin/reservas/${id}\n` +
      (idaDate
        ? `📅 Data IDA: ${idaDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n`
        : "") +
      (voltaDate
        ? `↩️ Data VOLTA: ${voltaDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n`
        : "")
  ).catch((err) => console.error("[BOOKING] Falha notifyTeam updateBooking:", err.message));

  if (phone) {
    const primeiroNome = (name || "Cliente").split(" ")[0];
    notifyCliente(
      phone,
      `${primeiroNome}, sua reserva foi atualizada! 🤎\n\n` +
        (idaDate
          ? `📅 Data: ${idaDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n`
          : "") +
        `Qualquer dúvida é só me chamar aqui. — Jolie | Multi Trip`
    ).catch((err) => console.error("[BOOKING] Falha notifyCliente updateBooking:", err.message));
  }

  // ── saveDriverInfo adicionado abaixo ──

  // Sincroniza Zoho Calendar
  const eventoData = {
    bookingId: id,
    clienteName: name,
    clientePhone: phone,
    veiculo: vehicleType,
    idaDate,
    idaFlightTime,
    idaFlightNumber,
    voltaDate,
    voltaFlightTime,
    voltaFlightNumber,
    cityTourDate,
    hotel,
    hotelAddress,
    routeLabel: booking.routeLabel,
    payMethod,
    depositCents,
    remainderCents,
    partida: booking.origin ?? "Aeroporto Salgado Filho (POA)",
    destino: booking.dest ?? "Gramado/Canela",
    passengerCount,
    totalCents,
    optionalsJson: booking.optionalsJson,
    origem: "manual" as const,
  };

  if (booking.zohoEventUid) {
    // Atualiza evento existente
    editarEventoZoho(booking.zohoEventUid, eventoData)
      .then((newUid) => {
        if (newUid && typeof newUid === "string" && newUid !== booking.zohoEventUid) {
          prisma.booking.update({ where: { id }, data: { zohoEventUid: newUid } }).catch(() => {});
        }
      })
      .catch(() => {});
  } else if (idaDate || voltaDate || cityTourDate) {
    // Cria evento se ainda não existe e temos data
    criarEventoZoho(eventoData)
      .then((uid) => {
        if (uid && typeof uid === "string")
          prisma.booking.update({ where: { id }, data: { zohoEventUid: uid } }).catch(() => {});
      })
      .catch(() => {});
  }

  redirect(`/admin/reservas/${id}`);
}

export async function saveDriverInfo(id: string, formData: FormData) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  // Campos legados (mantidos para compatibilidade)
  const driverName = formData.get("driverName")?.toString().trim() || null;
  const driverCar = formData.get("driverCar")?.toString().trim() || null;
  const driverWhatsapp = formData.get("driverWhatsapp")?.toString().replace(/\D/g, "") || null;

  // Motorista Chegada IN
  const driverInName = formData.get("driverInName")?.toString().trim() || null;
  const driverInCar = formData.get("driverInCar")?.toString().trim() || null;
  const driverInWhatsapp = formData.get("driverInWhatsapp")?.toString().replace(/\D/g, "") || null;

  // Motorista Retorno OUT
  const driverOutName = formData.get("driverOutName")?.toString().trim() || null;
  const driverOutCar = formData.get("driverOutCar")?.toString().trim() || null;
  const driverOutWhatsapp =
    formData.get("driverOutWhatsapp")?.toString().replace(/\D/g, "") || null;

  // Motorista City Tour
  const driverCityTourName = formData.get("driverCityTourName")?.toString().trim() || null;
  const driverCityTourCar = formData.get("driverCityTourCar")?.toString().trim() || null;
  const driverCityTourWhatsapp =
    formData.get("driverCityTourWhatsapp")?.toString().replace(/\D/g, "") || null;

  // Valores pagos aos motoristas (em reais → centavos)
  const parsePayment = (key: string) => {
    const raw = formData.get(key)?.toString().replace(",", ".").trim();
    if (!raw || raw === "") return null;
    const val = Math.round(parseFloat(raw) * 100);
    return isNaN(val) ? null : val;
  };
  const driverInPaymentCents = parsePayment("driverInPayment");
  const driverOutPaymentCents = parsePayment("driverOutPayment");
  const driverCityTourPaymentCents = parsePayment("driverCityTourPayment");

  const notify = formData.get("notify")?.toString() === "1";

  await prisma.booking.update({
    where: { id },
    // select: { id: true } evita que o Prisma busque as novas colunas
    // que ainda não existem no banco (driverInPaymentCents, etc.)
    select: { id: true },
    data: {
      // Legado
      driverName: driverName ?? undefined,
      driverCar: driverCar ?? undefined,
      driverWhatsapp: driverWhatsapp ?? undefined,
      // Chegada IN
      driverInName: driverInName ?? undefined,
      driverInCar: driverInCar ?? undefined,
      driverInWhatsapp: driverInWhatsapp ?? undefined,
      // Retorno OUT
      driverOutName: driverOutName ?? undefined,
      driverOutCar: driverOutCar ?? undefined,
      driverOutWhatsapp: driverOutWhatsapp ?? undefined,
      // City Tour
      driverCityTourName: driverCityTourName ?? undefined,
      driverCityTourCar: driverCityTourCar ?? undefined,
      driverCityTourWhatsapp: driverCityTourWhatsapp ?? undefined,
    },
  });

  // Pagamentos aos motoristas — guarda em optionalsJson até migration rodar
  // Após npx prisma db push, migrar para as colunas dedicadas
  if (driverInPaymentCents !== null || driverOutPaymentCents !== null || driverCityTourPaymentCents !== null) {
    try {
      const current = await prisma.booking.findUnique({
        where: { id },
        select: { id: true, optionalsJson: true },
      });
      let opts: Record<string, unknown> = {};
      try { opts = JSON.parse(current?.optionalsJson ?? "{}"); } catch {}
      if (driverInPaymentCents !== null) opts._driverInPaymentCents = driverInPaymentCents;
      if (driverOutPaymentCents !== null) opts._driverOutPaymentCents = driverOutPaymentCents;
      if (driverCityTourPaymentCents !== null) opts._driverCityTourPaymentCents = driverCityTourPaymentCents;
      await prisma.booking.update({
        where: { id },
        select: { id: true },
        data: { optionalsJson: JSON.stringify(opts) },
      });
    } catch (err) {
      console.error("[saveDriverInfo] Erro ao salvar pagamento motorista:", err);
    }
  }

  if (notify && (driverInName || driverOutName || driverCityTourName)) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        customer: { select: { name: true, phone: true } },
        tripType: true,
        vehicleType: true,
        passengerCount: true,
        hotel: true,
        hotelAddress: true,
        origin: true,
        dest: true,
        idaDate: true,
        idaFlightTime: true,
        idaFlightNumber: true,
        voltaDate: true,
        voltaFlightTime: true,
        voltaFlightNumber: true,
        optionalsJson: true,
      },
    });

    if (!booking) {
      redirect(`/admin/reservas/${id}`);
      return;
    }

    const fmtDate = (d: Date | null | undefined) =>
      d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";

    const fmtPickup = (time: string | null) => {
      if (!time) return null;
      const m = time.match(/^(\d{1,2}):(\d{2})/);
      if (!m) return null;
      let h = parseInt(m[1], 10) - 4;
      if (h < 0) h += 24;
      return `${String(h).padStart(2, "0")}:${m[2]}`;
    };

    const acessorios = (() => {
      try {
        const opt = JSON.parse(booking.optionalsJson || "{}");
        const s = opt.childSeats || {};
        const parts: string[] = [];
        if (s.bebe_conforto) parts.push(`${s.bebe_conforto}x Bebê Conforto`);
        if (s.cadeirinha) parts.push(`${s.cadeirinha}x Cadeirinha`);
        if (s.assento_elevacao) parts.push(`${s.assento_elevacao}x Assento de elevação`);
        return parts.length ? parts.join(", ") : null;
      } catch { return null; }
    })();

    const clienteNome = booking.customer?.name || "—";
    const clienteTel = booking.customer?.phone || "";
    const hotelDestino = [booking.hotel, booking.hotelAddress].filter(Boolean).join(" — ") || "—";
    const veiculo = booking.vehicleType || "—";
    const pax = booking.passengerCount ?? 1;
    const origem = booking.origin || "Aeroporto Salgado Filho (POA)";

    // ── Notifica motorista IN ──────────────────────────────────────────────────
    if (driverInWhatsapp && driverInName && booking.tripType !== "volta") {
      sendWhatsAppTemplate(
        driverInWhatsapp,
        "multitrip_motorista_in",
        "pt_BR",
        [{
          type: "body",
          parameters: [
            { type: "text", text: fmtDate(booking.idaDate) },
            { type: "text", text: booking.idaFlightTime || "—" },
            { type: "text", text: booking.idaFlightNumber || "—" },
            { type: "text", text: veiculo },
            { type: "text", text: String(pax) },
            { type: "text", text: clienteNome },
            { type: "text", text: clienteTel ? `+55 ${clienteTel}` : "—" },
            { type: "text", text: origem },
            { type: "text", text: hotelDestino },
          ],
        }]
      ).catch((err) => console.error("[BOOKING] Falha notificar motorista IN:", err.message));
    }

    // ── Notifica motorista OUT ─────────────────────────────────────────────────
    if (driverOutWhatsapp && driverOutName && booking.tripType !== "ida") {
      const pickupTime = fmtPickup(booking.voltaFlightTime) || "—";
      sendWhatsAppTemplate(
        driverOutWhatsapp,
        "multitrip_motorista_out",
        "pt_BR",
        [{
          type: "body",
          parameters: [
            { type: "text", text: fmtDate(booking.voltaDate) },
            { type: "text", text: pickupTime },
            { type: "text", text: booking.voltaFlightTime || "—" },
            { type: "text", text: booking.voltaFlightNumber || "—" },
            { type: "text", text: veiculo },
            { type: "text", text: String(pax) },
            { type: "text", text: clienteNome },
            { type: "text", text: clienteTel ? `+55 ${clienteTel}` : "—" },
            { type: "text", text: hotelDestino },
            { type: "text", text: origem },
          ],
        }]
      ).catch((err) => console.error("[BOOKING] Falha notificar motorista OUT:", err.message));
    }

    // ── Notifica motorista City Tour ───────────────────────────────────────────
    if (driverCityTourWhatsapp && driverCityTourName) {
      let cityTourDate = "—";
      try {
        const opt = JSON.parse(booking.optionalsJson || "{}");
        if (opt.cityTour?.date) cityTourDate = opt.cityTour.date;
      } catch {}

      const msgCity =
        `🏙️ *CITY TOUR — Multi Trip*\n\n` +
        `📅 Data: ${cityTourDate}\n` +
        `⏰ Horário: 09:00 às 17:00\n` +
        `\n🚗 Veículo: ${veiculo}\n` +
        `👥 Passageiros: ${pax}\n` +
        (acessorios ? `🧒 Acessórios: ${acessorios}\n` : "") +
        `\n👤 Cliente: ${clienteNome}\n` +
        (clienteTel ? `📱 WhatsApp: +55 ${clienteTel}\n` : "") +
        `\n📍 Local: ${hotelDestino}\n` +
        `\nDúvidas: (51) 9 8687-6557`;

      sendWhatsApp(driverCityTourWhatsapp, msgCity).catch((err) =>
        console.error("[BOOKING] Falha notificar motorista City Tour:", err.message)
      );
    }

    // ── Notifica cliente sobre motoristas designados ───────────────────────────
    if (booking.customer?.phone) {
      const clienteNomeCurto = clienteNome.split(" ")[0];
      let msgCliente =
        `Olá, ${clienteNomeCurto}! 🤎 Aqui é a Jolie da Multi Trip.\n\n` +
        `Sua viagem está confirmada e seus motoristas já estão designados:\n\n`;

      if (driverInName && booking.tripType !== "volta") {
        msgCliente +=
          `🛬 *Chegada (IN):*\n` +
          `🧑‍✈️ ${driverInName}\n` +
          `🚗 ${driverInCar ?? "—"}\n` +
          (driverInWhatsapp ? `📱 +55 ${driverInWhatsapp}\n` : "") +
          `📅 ${fmtDate(booking.idaDate)}\n` +
          (booking.idaFlightTime ? `⏰ Voo: ${booking.idaFlightTime}\n` : "") +
          `\n`;
      }

      if (driverOutName && booking.tripType !== "ida") {
        const pickupTime = fmtPickup(booking.voltaFlightTime);
        msgCliente +=
          `🛫 *Retorno (OUT):*\n` +
          `🧑‍✈️ ${driverOutName}\n` +
          `🚗 ${driverOutCar ?? "—"}\n` +
          (driverOutWhatsapp ? `📱 +55 ${driverOutWhatsapp}\n` : "") +
          `📅 ${fmtDate(booking.voltaDate)}\n` +
          (pickupTime ? `⏰ Pick-up: ${pickupTime}\n` : "") +
          `\n`;
      }

      if (driverCityTourName) {
        msgCliente +=
          `🏙️ *City Tour:*\n` +
          `🧑‍✈️ ${driverCityTourName}\n` +
          `🚗 ${driverCityTourCar ?? "—"}\n` +
          (driverCityTourWhatsapp ? `📱 +55 ${driverCityTourWhatsapp}\n` : "") +
          `\n`;
      }

      msgCliente += `Qualquer dúvida é só chamar aqui. Boa viagem! ✈️`;

      sendWhatsApp(booking.customer.phone, msgCliente).catch(() => {});

      await prisma.booking.update({
        where: { id },
        data: { driverNotifiedAt: new Date() },
      });
    }
  }

  redirect(`/admin/reservas/${id}`);
}

// ─── Marcar corrida como concluída ───────────────────────────────────────────

export async function marcarCorridaConcluida(
  id: string,
  leg: "ida" | "volta" | "cityTour",
  concluida: boolean
) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  const data: any = {};
  if (leg === "ida") data.idaConcluida = concluida;
  else if (leg === "volta") data.voltaConcluida = concluida;
  else if (leg === "cityTour") data.cityTourConcluido = concluida;

  await prisma.booking.update({
    where: { id },
    data,
  });

  redirect(`/admin/reservas/${id}`);
}

// ─── Regenerar / Gerar contrato manualmente ───────────────────────────────────

export async function regenerateContract(id: string) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      passengers: true,
    },
  });
  if (!booking) throw new Error("Reserva não encontrada.");

  // Em serverless (Vercel), o PDF é gerado on-demand pela rota /api/contracts/[id]
  // Apenas registramos a URL no banco para indicar que o contrato está disponível
  const contractPdfUrl = `/api/contracts/${id}`;

  await prisma.booking.update({
    where: { id },
    data: {
      contractPdfUrl,
      contractAcceptedAt: booking.contractAcceptedAt ?? new Date(),
      contractAcceptedVersion: booking.contractAcceptedVersion ?? "07/05/2026",
    },
  });

  redirect(`/admin/reservas/${id}`);
}

// ─── Marcar restante como pago ───────────────────────────────────────────────

export async function marcarRestantePago(id: string) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { remainderCents: true, depositCents: true, totalCents: true },
  });

  if (!booking) throw new Error("Reserva não encontrada.");

  if (booking.remainderCents > 0) {
    // Registra o pagamento do restante
    await prisma.payment.create({
      data: {
        bookingId: id,
        amountCents: booking.remainderCents,
        method: "manual (restante)",
        providerId: `man_rest_${Date.now()}`,
        status: "approved",
        paidAt: new Date(),
      },
    });

    // Zera o remainder e atualiza o deposit (só pra constar como tudo pago)
    await prisma.booking.update({
      where: { id },
      data: {
        remainderCents: 0,
        depositCents: booking.totalCents, // Tudo foi pago
      },
    });
  }

  redirect(`/admin/reservas/${id}`);
}

// ─── Forçar sincronização com o Zoho Calendar ────────────────────────────────

export async function forceSyncZoho(id: string) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!booking) throw new Error("Reserva nao encontrada.");

  let errorMessage = "";
  let zohoUid = "";
  let cityTourDate = null;
  try {
    const optObj = JSON.parse(booking.optionalsJson || "{}");
    if (optObj.cityTour?.enabled && optObj.cityTour?.date) {
      cityTourDate = optObj.cityTour.date;
    }
  } catch {}

  if (!booking.idaDate && !booking.voltaDate && !cityTourDate) {
    redirect(
      `/admin/reservas/${id}?error=zoho_sync_attempted&message=${encodeURIComponent("Reserva sem data operacional para sincronizar.")}`
    );
  }

  const eventoData = {
    bookingId: booking.id,
    clienteName: booking.customer?.name || "Sem nome",
    clientePhone: booking.customer?.phone || "-",
    veiculo: booking.vehicleType,
    idaDate: booking.idaDate,
    idaFlightTime: booking.idaFlightTime,
    idaFlightNumber: booking.idaFlightNumber,
    voltaDate: booking.voltaDate,
    voltaFlightTime: booking.voltaFlightTime,
    voltaFlightNumber: booking.voltaFlightNumber,
    cityTourDate,
    hotel: booking.hotel,
    hotelAddress: booking.hotelAddress,
    routeLabel: booking.routeLabel,
    payMethod: booking.payMethod,
    depositCents: booking.depositCents,
    remainderCents: booking.remainderCents,
    partida: booking.origin || "Aeroporto Salgado Filho (POA)",
    destino: booking.dest || "Gramado/Canela",
    passengerCount: booking.passengerCount,
    totalCents: booking.totalCents,
    optionalsJson: booking.optionalsJson,
    origem: booking.id.startsWith("wabk_")
      ? "whatsapp"
      : booking.id.startsWith("bk_")
        ? "site"
        : "manual",
  } as const;

  try {
    if (booking.zohoEventUid) {
      // Já existe evento → atualiza
      const newUid = await editarEventoZoho(booking.zohoEventUid, eventoData);
      zohoUid = (newUid && typeof newUid === "string") ? newUid : booking.zohoEventUid;
    } else {
      // Não existe → cria
      const uid = await criarEventoZoho(eventoData);
      if (uid) zohoUid = uid;
    }
  } catch (err: any) {
    errorMessage = err.message || "Erro desconhecido";
  }

  if (zohoUid) {
    await prisma.booking.update({
      where: { id },
      data: { zohoEventUid: zohoUid },
    });
    redirect(`/admin/reservas/${id}`);
  }

  redirect(
    `/admin/reservas/${id}?error=zoho_sync_attempted&message=${encodeURIComponent(errorMessage)}`
  );
}
