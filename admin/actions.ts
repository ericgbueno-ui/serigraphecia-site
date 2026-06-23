"use server";

import { prisma } from "@/lib/db";
import { canonicalAtendimentoRoute } from "@/lib/pricing";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { notifyTeam } from "@/lib/notify";
import { sendWhatsApp } from "@/lib/meta-whatsapp";
import { criarEventoZoho, editarEventoZoho, excluirEventoZoho } from "@/lib/zoho-calendar";
import { getIsAdmin } from "@/lib/server/adminAuth";

export async function deleteBooking(id: string) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  // Exclui evento do Zoho Calendar se existir
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { zohoEventUid: true },
  });
  if (booking?.zohoEventUid) {
    excluirEventoZoho(booking.zohoEventUid).catch(() => {});
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

  await prisma.booking.update({ where: { id }, data: { status } });

  if (status === "CONFIRMED") {
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
        partida: booking.origin ?? "Aeroporto Salgado Filho (POA)",
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
  const email = formData.get("email")?.toString().trim() || "";
  const birthDateRaw = formData.get("birthDate")?.toString();
  const birthDate = birthDateRaw ? new Date(`${birthDateRaw}T12:00:00-03:00`) : null;

  // Atendimento
  const hotel = formData.get("hotel")?.toString().trim() || null;
  const hotelAddress = formData.get("hotelAddress")?.toString().trim() || null;
  const vehicleType = formData.get("vehicleType")?.toString().trim() || "";
  const passengerCount = parseInt(formData.get("passengerCount")?.toString() || "1", 10);
  const tripType = formData.get("tripType")?.toString() || "ida_volta";
  const isOnlyCityTour = tripType === "so_citytour";

  const cityTourEnabled = isOnlyCityTour || formData.get("cityTourEnabled") === "1";
  const cityTourDate = formData.get("cityTourDate")?.toString() || "";
  const cityTourDest = formData.get("cityTourDest")?.toString().trim() || "sua região";
  const cityTourValueStr = formData.get("cityTourValue")?.toString() || "0";
  const cityTourValueCents = Math.round(parseFloat(cityTourValueStr) * 100) || 0;

  // Datas
  const idaDateRaw = formData.get("idaDate")?.toString();
  const idaFlightTime = formData.get("idaFlightTime")?.toString().trim() || null;
  const idaFlightNumber = formData.get("idaFlightNumber")?.toString().trim() || null;
  const voltaDateRaw = formData.get("voltaDate")?.toString();
  const voltaFlightTime = formData.get("voltaFlightTime")?.toString().trim() || null;
  const voltaFlightNumber = formData.get("voltaFlightNumber")?.toString().trim() || null;

  let idaDate = idaDateRaw ? new Date(`${idaDateRaw}T12:00:00-03:00`) : null;
  if (isOnlyCityTour && cityTourDate) {
    idaDate = new Date(`${cityTourDate}T12:00:00-03:00`);
  }
  const voltaDate = (voltaDateRaw && !isOnlyCityTour) ? new Date(`${voltaDateRaw}T12:00:00-03:00`) : null;

  // Financeiro
  const totalCents = Math.round(
    parseFloat(formData.get("totalCents")?.toString().replace(",", ".") || "0") * 100
  );
  const depositCents = Math.round(
    parseFloat(formData.get("depositCents")?.toString().replace(",", ".") || "0") * 100
  );
  const remainderCents = totalCents - depositCents;
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
  if (!booking) throw new Error("Agendamento não encontrada.");

  let existingOptionals: Record<string, unknown> = {};
  if (booking.optionalsJson) {
    try {
      existingOptionals = JSON.parse(booking.optionalsJson) || {};
    } catch {}
  }

  const cityTour = cityTourEnabled
    ? {
        enabled: true,
        date: cityTourDate,
        dest: cityTourDest,
        valueCents: cityTourValueCents,
      }
    : null;

  const optionalsJson = JSON.stringify({
    ...existingOptionals,
    addons: addonsRaw,
    childSeats: childSeatsRaw,
    hasChildUnder10,
    cityTour,
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

  let routeLabel = booking.routeLabel;
  let origin = booking.origin;
  let dest = booking.dest;

  if (tripType === "so_citytour") {
    routeLabel = "Somente City Tour";
    origin = "sua região";
    dest = "sua região";
  } else if (booking.routeLabel === "Somente City Tour") {
    const routeContext =
      tripType === "volta"
        ? canonicalAtendimentoRoute("volta", "poa_gramado")
        : tripType === "ida_volta"
          ? canonicalAtendimentoRoute("ida_volta", "poa_gramado")
          : canonicalAtendimentoRoute("ida", "poa_gramado");

    routeLabel = routeContext.routeLabel;
    origin = routeContext.origin;
    dest = routeContext.dest;
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
      routeLabel,
      origin,
      dest,
      idaDate: (tripType === "so_citytour") ? idaDate : (tripType !== "volta" ? idaDate : null),
      idaFlightTime: (tripType === "so_citytour") ? null : (tripType !== "volta" ? idaFlightTime : null),
      idaFlightNumber: (tripType === "so_citytour") ? null : (tripType !== "volta" ? idaFlightNumber : null),
      voltaDate: (tripType === "so_citytour") ? null : (tripType !== "ida" ? voltaDate : null),
      voltaFlightTime: (tripType === "so_citytour") ? null : (tripType !== "ida" ? voltaFlightTime : null),
      voltaFlightNumber: (tripType === "so_citytour") ? null : (tripType !== "ida" ? voltaFlightNumber : null),
      totalCents,
      depositCents,
      remainderCents,
      payMethod,
      optionalsJson,
    },
  });

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

  // Profissional Chegada IN
  const driverInName = formData.get("driverInName")?.toString().trim() || null;
  const driverInCar = formData.get("driverInCar")?.toString().trim() || null;
  const driverInWhatsapp = formData.get("driverInWhatsapp")?.toString().replace(/\D/g, "") || null;

  // Profissional Retorno OUT
  const driverOutName = formData.get("driverOutName")?.toString().trim() || null;
  const driverOutCar = formData.get("driverOutCar")?.toString().trim() || null;
  const driverOutWhatsapp =
    formData.get("driverOutWhatsapp")?.toString().replace(/\D/g, "") || null;

  // Profissional City Tour
  const driverCityTourName = formData.get("driverCityTourName")?.toString().trim() || null;
  const driverCityTourCar = formData.get("driverCityTourCar")?.toString().trim() || null;
  const driverCityTourWhatsapp =
    formData.get("driverCityTourWhatsapp")?.toString().replace(/\D/g, "") || null;

  const notify = formData.get("notify")?.toString() === "1";

  // ── Verificação de conflito de profissional ─────────────────────────────────────
  // Avisa se o mesmo número de WhatsApp está alocado em outro booking na mesma data (janela ±3h)
  const conflictWarnings: string[] = [];
  const currentBooking = await prisma.booking.findUnique({
    where: { id },
    select: { idaDate: true, voltaDate: true },
  });

  async function checkDriverConflict(whatsapp: string | null, leg: string, date: Date | null | undefined) {
    if (!whatsapp || !date) return;
    const window3h = 3 * 60 * 60 * 1000;
    const dateFrom = new Date(date.getTime() - window3h);
    const dateTo = new Date(date.getTime() + window3h);
    const conflicts = await prisma.booking.findMany({
      where: {
        id: { not: id },
        status: { not: "CANCELLED" },
        OR: [
          { driverInWhatsapp: whatsapp, idaDate: { gte: dateFrom, lte: dateTo } },
          { driverOutWhatsapp: whatsapp, voltaDate: { gte: dateFrom, lte: dateTo } },
          { driverCityTourWhatsapp: whatsapp, idaDate: { gte: dateFrom, lte: dateTo } },
          { driverWhatsapp: whatsapp, idaDate: { gte: dateFrom, lte: dateTo } },
        ],
      },
      select: { id: true },
      take: 1,
    });
    if (conflicts.length > 0) {
      conflictWarnings.push(`⚠️ CONFLITO (${leg}): profissional +${whatsapp} já alocado em outra agendamento próxima. Agendamento: ${conflicts[0].id}`);
    }
  }

  await Promise.all([
    checkDriverConflict(driverInWhatsapp, "IN", currentBooking?.idaDate),
    checkDriverConflict(driverOutWhatsapp, "OUT", currentBooking?.voltaDate),
    checkDriverConflict(driverCityTourWhatsapp, "CityTour", currentBooking?.idaDate),
  ]);

  if (conflictWarnings.length > 0) {
    const msg = conflictWarnings.join("\n") + `\nAgendamento atual: https://seudominio.com.br/admin/agendamentos/${id}`;
    notifyTeam(msg).catch(() => {});
  }

  await prisma.booking.update({
    where: { id },
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

  if (notify && (driverInName || driverOutName)) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        customer: { select: { name: true, phone: true } },
        tripType: true,
        idaDate: true,
        idaFlightTime: true,
        voltaDate: true,
        voltaFlightTime: true,
      },
    });

    if (booking?.customer?.phone) {
      const clienteName = booking.customer.name.split(" ")[0];

      const fmtDate = (d: Date | null | undefined) =>
        d
          ? new Date(d).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : null;

      let msg =
        `Olá, ${clienteName}! 🤎 Aqui é a Assistente da [NOME DO NEGÓCIO].\n\n` +
        `Sua atendimento está confirmada e seus profissionais já estão designados:\n\n`;

      if (driverInName && booking.tripType !== "volta") {
        const dataIn = fmtDate(booking.idaDate);
        msg +=
          `🛬 *Chegada (IN):*\n` +
          `🧑‍✈️ Profissional: ${driverInName}\n` +
          `🚗 Veículo: ${driverInCar ?? "—"}\n` +
          (driverInWhatsapp ? `📱 WhatsApp: +55 ${driverInWhatsapp}\n` : "") +
          (dataIn ? `📅 Data: ${dataIn}\n` : "") +
          (booking.idaFlightTime ? `⏰ Horário do voo: ${booking.idaFlightTime}\n` : "") +
          `\n`;
      }

      if (driverOutName && booking.tripType !== "ida") {
        const dataOut = fmtDate(booking.voltaDate);
        msg +=
          `🛫 *Retorno (OUT):*\n` +
          `🧑‍✈️ Profissional: ${driverOutName}\n` +
          `🚗 Veículo: ${driverOutCar ?? "—"}\n` +
          (driverOutWhatsapp ? `📱 WhatsApp: +55 ${driverOutWhatsapp}\n` : "") +
          (dataOut ? `📅 Data: ${dataOut}\n` : "") +
          (booking.voltaFlightTime ? `⏰ Horário do voo: ${booking.voltaFlightTime}\n` : "") +
          `\n`;
      }

      if (driverCityTourName) {
        msg +=
          `🏙️ *City Tour:*\n` +
          `🧑‍✈️ Profissional: ${driverCityTourName}\n` +
          `🚗 Veículo: ${driverCityTourCar ?? "—"}\n` +
          (driverCityTourWhatsapp ? `📱 WhatsApp: +55 ${driverCityTourWhatsapp}\n` : "") +
          `\n`;
      }

      msg += `Qualquer dúvida é só chamar aqui ou falar diretamente com seu profissional. Boa atendimento! ✈️`;

      sendWhatsApp(booking.customer.phone, msg).catch(() => {});

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
  if (!booking.customer) throw new Error("Cliente associado à agendamento não encontrado.");
  if (booking.zohoEventUid) redirect(`/admin/agendamentos/${id}`);

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

  try {
    const uid = await criarEventoZoho({
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
      destino: booking.dest || "sua região",
      passengerCount: booking.passengerCount,
      totalCents: booking.totalCents,
      optionalsJson: booking.optionalsJson,
      origem: booking.id.startsWith("wabk_")
        ? "whatsapp"
        : booking.id.startsWith("bk_")
          ? "site"
          : "manual",
    });
    if (uid) zohoUid = uid;
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
