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

  redirect("/admin/agendamentos");
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

  if (!booking) throw new Error("Agendamento não encontrada.");

  await prisma.booking.update({ where: { id }, data: { status } });

  if (status === "CONFIRMED") {
    // Marca lead como convertido se existir no CRM
    if (booking?.customer?.phone) {
      markLeadConverted(booking.customer.phone, id).catch(() => {});
    }

    const msg =
      `🔄 *STATUS ATUALIZADO → CONFIRMADO*\n\n` +
      `🔗 Agendamento: https://seudominio.com.br/admin/agendamentos/${id}`;
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
        partida: booking.origin ?? "Unidade Principal",
        destino: booking.dest ?? "sua região",
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

  redirect(`/admin/agendamentos/${id}`);
}

export async function updateBooking(id: string, formData: FormData) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  // Cliente
  const name = formData.get("name")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().replace(/\D/g, "") || "";
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const birthDateRaw = formData.get("birthDate")?.toString();
  const birthDate = birthDateRaw ? new Date(`${birthDateRaw}T12:00:00-03:00`) : null;

  // Atendimento
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

  // NoShow / Remarcação
  const noShowFlightTypeRaw = formData.get("noShowFlightType")?.toString() || "";
  const noShowFlightType = noShowFlightTypeRaw === "ida" || noShowFlightTypeRaw === "volta" ? noShowFlightTypeRaw : null;
  const noShowDateRaw = formData.get("noShowDate")?.toString();
  const noShowDate = noShowDateRaw ? new Date(`${noShowDateRaw}T12:00:00-03:00`) : null;
  const rescheduledDateRaw = formData.get("rescheduledDate")?.toString();
  const rescheduledDate = rescheduledDateRaw ? new Date(`${rescheduledDateRaw}T12:00:00-03:00`) : null;
  const rescheduledFlightTime = formData.get("rescheduledFlightTime")?.toString().trim() || null;
  const rescheduledFlightNumber = formData.get("rescheduledFlightNumber")?.toString().trim() || null;
  const noShowOutCancelled = formData.get("noShowOutCancelled") === "1";
  const outCancelledCents = Math.round(
    parseFloat(formData.get("outCancelledCents")?.toString().replace(",", ".") || "0") * 100
  ) || null;

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
  if (!booking) throw new Error("Agendamento não encontrada.");

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
      noShowFlightType,
      noShowDate,
      rescheduledDate,
      rescheduledFlightTime,
      rescheduledFlightNumber,
      noShowOutCancelled,
      outCancelledCents,
    },
  });

  // ── Notifica equipe e cliente sobre atualização ──────────────────────────
  notifyTeam(
    `🔄 *AGENDAMENTO ATUALIZADA (Admin)*\n\n` +
      `🔗 https://seudominio.com.br/admin/agendamentos/${id}\n` +
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
      `${primeiroNome}, sua agendamento foi atualizada! 🤎\n\n` +
        (idaDate
          ? `📅 Data: ${idaDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n`
          : "") +
        `Qualquer dúvida é só me chamar aqui. — Assistente | [NOME DO NEGÓCIO]`
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
    partida: booking.origin ?? "Unidade Principal",
    destino: booking.dest ?? "sua região",
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

  redirect(`/admin/agendamentos/${id}`);
}

export async function saveDriverInfo(id: string, formData: FormData) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  // Campos legados (mantidos para compatibilidade)
  const driverName = formData.get("driverName")?.toString().trim() || null;
  const driverCar = formData.get("driverCar")?.toString().trim() || null;
  const driverWhatsapp = formData.get("driverWhatsapp")?.toString().replace(/\D/g, "") || null;

  // Profissional Início
  const driverInName = formData.get("driverInName")?.toString().trim() || null;
  const driverInCar = formData.get("driverInCar")?.toString().trim() || null;
  const driverInWhatsapp = formData.get("driverInWhatsapp")?.toString().replace(/\D/g, "") || null;

  // Profissional Encerramento
  const driverOutName = formData.get("driverOutName")?.toString().trim() || null;
  const driverOutCar = formData.get("driverOutCar")?.toString().trim() || null;
  const driverOutWhatsapp =
    formData.get("driverOutWhatsapp")?.toString().replace(/\D/g, "") || null;

  // Profissional Serviço Adicional
  const driverCityTourName = formData.get("driverCityTourName")?.toString().trim() || null;
  const driverCityTourCar = formData.get("driverCityTourCar")?.toString().trim() || null;
  const driverCityTourWhatsapp =
    formData.get("driverCityTourWhatsapp")?.toString().replace(/\D/g, "") || null;

  // Valores pagos aos profissionais (em reais → centavos)
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
      // Início
      driverInName: driverInName ?? undefined,
      driverInCar: driverInCar ?? undefined,
      driverInWhatsapp: driverInWhatsapp ?? undefined,
      // Encerramento
      driverOutName: driverOutName ?? undefined,
      driverOutCar: driverOutCar ?? undefined,
      driverOutWhatsapp: driverOutWhatsapp ?? undefined,
      // Serviço Adicional
      driverCityTourName: driverCityTourName ?? undefined,
      driverCityTourCar: driverCityTourCar ?? undefined,
      driverCityTourWhatsapp: driverCityTourWhatsapp ?? undefined,
    },
  });

  // Pagamentos aos profissionais — guarda em optionalsJson até migration rodar
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
      console.error("[saveDriverInfo] Erro ao salvar pagamento profissional:", err);
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
      redirect(`/admin/agendamentos/${id}`);
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
    const origem = booking.origin || "Unidade Principal";

    // ── Notifica profissional IN ──────────────────────────────────────────────────
    if (driverInWhatsapp && driverInName && booking.tripType !== "volta") {
      sendWhatsAppTemplate(
        driverInWhatsapp,
        "negocio_profissional_in",
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
      ).catch((err) => console.error("[BOOKING] Falha notificar profissional IN:", err.message));
    }

    // ── Notifica profissional OUT ─────────────────────────────────────────────────
    if (driverOutWhatsapp && driverOutName && booking.tripType !== "ida") {
      const pickupTime = fmtPickup(booking.voltaFlightTime) || "—";
      sendWhatsAppTemplate(
        driverOutWhatsapp,
        "negocio_profissional_out",
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
      ).catch((err) => console.error("[BOOKING] Falha notificar profissional OUT:", err.message));
    }

    // ── Notifica profissional Serviço Adicional ───────────────────────────────────
    if (driverCityTourWhatsapp && driverCityTourName) {
      let cityTourDate = "—";
      try {
        const opt = JSON.parse(booking.optionalsJson || "{}");
        if (opt.cityTour?.date) cityTourDate = opt.cityTour.date;
      } catch {}

      const msgCity =
        `🏙️ *SERVIÇO ADICIONAL — [NOME DO NEGÓCIO]*\n\n` +
        `📅 Data: ${cityTourDate}\n` +
        `⏰ Horário: 09:00 às 17:00\n` +
        `\n🚗 Veículo: ${veiculo}\n` +
        `👥 Clientes: ${pax}\n` +
        (acessorios ? `🧒 Acessórios: ${acessorios}\n` : "") +
        `\n👤 Cliente: ${clienteNome}\n` +
        (clienteTel ? `📱 WhatsApp: +55 ${clienteTel}\n` : "") +
        `\n📍 Local: ${hotelDestino}\n` +
        `\nDúvidas: (51) 9 8687-6557`;

      sendWhatsApp(driverCityTourWhatsapp, msgCity).catch((err) =>
        console.error("[BOOKING] Falha notificar profissional Serviço Adicional:", err.message)
      );
    }

    // ── Notifica cliente sobre profissionais designados ───────────────────────────
    if (booking.customer?.phone) {
      const clienteNomeCurto = clienteNome.split(" ")[0];
      let msgCliente =
        `Olá, ${clienteNomeCurto}! 🤎 Aqui é a Assistente da [NOME DO NEGÓCIO].\n\n` +
        `Sua atendimento está confirmada e seus profissionais já estão designados:\n\n`;

      if (driverInName && booking.tripType !== "volta") {
        msgCliente +=
          `🛬 *Chegada (IN):*\n` +
          `🧑‍✈️ ${driverInName}\n` +
          `🚗 ${driverInCar ?? "—"}\n` +
          (driverInWhatsapp ? `📱 +55 ${driverInWhatsapp}\n` : "") +
          `📅 ${fmtDate(booking.idaDate)}\n` +
          (booking.idaFlightTime ? `⏰ Horário: ${booking.idaFlightTime}\n` : "") +
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
          `🏙️ *Serviço Adicional:*\n` +
          `🧑‍✈️ ${driverCityTourName}\n` +
          `🚗 ${driverCityTourCar ?? "—"}\n` +
          (driverCityTourWhatsapp ? `📱 +55 ${driverCityTourWhatsapp}\n` : "") +
          `\n`;
      }

      msgCliente += `Qualquer dúvida é só chamar aqui. Boa atendimento! ✈️`;

      sendWhatsApp(booking.customer.phone, msgCliente).catch(() => {});

      await prisma.booking.update({
        where: { id },
        data: { driverNotifiedAt: new Date() },
      });
    }
  }

  redirect(`/admin/agendamentos/${id}`);
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

  redirect(`/admin/agendamentos/${id}`);
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
  if (!booking) throw new Error("Agendamento não encontrada.");
  if (!booking.customer) throw new Error("Cliente associado à agendamento não encontrado.");

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

  redirect(`/admin/agendamentos/${id}`);
}

// ─── Marcar restante como pago ───────────────────────────────────────────────

export async function marcarRestantePago(id: string) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { remainderCents: true, depositCents: true, totalCents: true },
  });

  if (!booking) throw new Error("Agendamento não encontrada.");

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

  redirect(`/admin/agendamentos/${id}`);
}

// ─── Forçar sincronização com o Zoho Calendar ────────────────────────────────

export async function forceSyncZoho(id: string) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!booking) throw new Error("Agendamento não encontrada.");

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
      `/admin/agendamentos/${id}?error=zoho_sync_attempted&message=${encodeURIComponent("Agendamento sem data operacional para sincronizar.")}`
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
    partida: booking.origin || "Unidade Principal",
    destino: booking.dest || "sua região",
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
    redirect(`/admin/agendamentos/${id}`);
  }

  redirect(
    `/admin/agendamentos/${id}?error=zoho_sync_attempted&message=${encodeURIComponent(errorMessage)}`
  );
}

// ─── Marcar NoShow ────────────────────────────────────────────────────────────

export async function marcarNoShow(
  id: string,
  flightType: "ida" | "volta"
) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      customer: { select: { phone: true, name: true } },
    },
  });

  if (!booking) throw new Error("Agendamento não encontrada.");

  await prisma.booking.update({
    where: { id },
    data: {
      noShowFlightType: flightType,
      noShowDate: new Date(),
    },
  });

  // Notifica a equipe
  const msg =
    `🚨 *NOSHOW REGISTRADO*\n\n` +
    `📌 Cliente: ${booking.customer?.name}\n` +
    `📱 Telefone: ${booking.customer?.phone}\n` +
    `🕒 Ref: ${flightType === "ida" ? "Chegada (IN)" : "Retorno (OUT)"}\n` +
    `🔗 Agendamento: https://seudominio.com.br/admin/agendamentos/${id}`;
  notifyTeam(msg).catch(() => {});

  redirect(`/admin/agendamentos/${id}`);
}

// ─── Cancelar trecho OUT após NoShow IN ──────────────────────────────────────

export async function cancelarOutNoShow(id: string, outValueCents: number) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");
  if (typeof outValueCents !== "number" || isNaN(outValueCents) || outValueCents < 0)
    throw new Error("Valor inválido para o trecho OUT.");

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      totalCents: true,
      remainderCents: true,
      depositCents: true,
      customer: { select: { phone: true, name: true } },
    },
  });

  if (!booking) throw new Error("Agendamento não encontrada.");

  const newTotal = Math.max(0, booking.totalCents - outValueCents);
  let newRemainder = booking.remainderCents - outValueCents;
  let newDeposit = booking.depositCents;
  if (newRemainder < 0) {
    newDeposit = Math.max(0, newDeposit + newRemainder);
    newRemainder = 0;
  }

  await prisma.booking.update({
    where: { id },
    data: {
      noShowOutCancelled: true,
      outCancelledCents: outValueCents,
      totalCents: newTotal,
      remainderCents: newRemainder,
      depositCents: newDeposit,
    },
  });

  const msg =
    `❌ *ENCERRAMENTO CANCELADO*\n\n` +
    `📌 Cliente: ${booking.customer?.name}\n` +
    `💰 Valor subtraído: R$ ${(outValueCents / 100).toFixed(2).replace(".", ",")}\n` +
    `💰 Novo total: R$ ${(newTotal / 100).toFixed(2).replace(".", ",")}\n` +
    `🔗 Agendamento: https://seudominio.com.br/admin/agendamentos/${id}`;
  notifyTeam(msg).catch(() => {});

  redirect(`/admin/agendamentos/${id}`);
}

// ─── Remarcar agendamento ────────────────────────────────────────────────────────

export async function remarcarReserva(
  id: string,
  rescheduledDate: string,
  rescheduledFlightTime: string,
  rescheduledFlightNumber?: string,
  applySurcharge = true
) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      totalCents: true,
      remainderCents: true,
      customer: { select: { phone: true, name: true } },
      noShowFlightType: true,
    },
  });

  if (!booking) throw new Error("Agendamento não encontrada.");

  const newDate = new Date(`${rescheduledDate}T12:00:00-03:00`);

  // Acréscimo de 20% sobre o total contratado (conforme contrato — cláusula 6.7)
  const surchargeCents = applySurcharge ? Math.round(booking.totalCents * 0.2) : 0;
  const newTotal = booking.totalCents + surchargeCents;
  const newRemainder = booking.remainderCents + surchargeCents;

  await prisma.booking.update({
    where: { id },
    data: {
      rescheduledDate: newDate,
      rescheduledFlightTime: rescheduledFlightTime || null,
      rescheduledFlightNumber: rescheduledFlightNumber || null,
      ...(surchargeCents > 0 && { totalCents: newTotal, remainderCents: newRemainder }),
    },
  });

  // Notifica cliente
  const flightType = booking.noShowFlightType === "ida"
    ? "Chegada (IN)"
    : "Retorno (OUT)";

  const brlFmt = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;

  const surchargeInfo = surchargeCents > 0
    ? `\n\n⚠️ Acréscimo de 20% (no-show): ${brlFmt(surchargeCents)}\nNovo total: ${brlFmt(newTotal)}`
    : "";

  const msg =
    `✅ *Sua agendamento foi remarcada!*\n\n` +
    `Nova data: ${new Date(newDate).toLocaleDateString("pt-BR")}\n` +
    `Horário: ${rescheduledFlightTime || "A confirmar"}\n` +
    `Referência: ${rescheduledFlightNumber || "A confirmar"}` +
    surchargeInfo +
    `\n\nEntre em contato caso tenha dúvidas.`;

  sendWhatsApp(booking.customer?.phone || "", msg).catch(() => {});

  // Notifica a equipe
  const teamMsg =
    `✅ *AGENDAMENTO REMARCADA*\n\n` +
    `📌 Cliente: ${booking.customer?.name}\n` +
    `📱 Telefone: ${booking.customer?.phone}\n` +
    `🕒 Ref: ${flightType}\n` +
    `📅 Nova data: ${new Date(newDate).toLocaleDateString("pt-BR")}\n` +
    `🕐 Horário: ${rescheduledFlightTime || "A confirmar"}\n` +
    (surchargeCents > 0 ? `💰 Acréscimo 20% no-show: ${brlFmt(surchargeCents)} → Novo total: ${brlFmt(newTotal)}\n` : ``) +
    `🔗 Agendamento: https://seudominio.com.br/admin/agendamentos/${id}`;
  notifyTeam(teamMsg).catch(() => {});

  redirect(`/admin/agendamentos/${id}`);
}
