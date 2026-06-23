"use server";

import { prisma } from "@/lib/db";
import {
  canonicalAtendimentoRoute,
  paxToTier,
  ADDONS,
  sanitizeAddonSelections,
  type CanonicalRoute,
  type AddonId,
} from "@/lib/pricing";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { notifyTeam } from "@/lib/notify";
import { sendWhatsAppTemplate } from "@/lib/meta-whatsapp";
import { criarEventoZoho } from "@/lib/zoho-calendar";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { markLeadConverted } from "@/lib/lead";

export async function createManualBooking(formData: FormData) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  // Customer data
  const name = formData.get("name")?.toString().trim() || "Cliente Manual";
  const whatsappRaw = formData.get("whatsapp")?.toString().trim() || "";
  const whatsapp = whatsappRaw.replace(/\D/g, "");
  const cpfRaw = formData.get("cpf")?.toString().trim() || "";
  const cpf = cpfRaw.replace(/\D/g, "") || null;
  const email =
    formData.get("email")?.toString().trim() || `cliente.${Date.now()}@seudominio.com.br`;

  // Booking basic info
  const tripType = (formData.get("tripType")?.toString() as any) || "ida_volta";
  const passengerCount = parseInt(formData.get("passengerCount")?.toString() || "2", 10);
  const vehicleType = paxToTier(passengerCount);
  const rawPayMethod = formData.get("payMethod")?.toString() || "pix_total"; // pix_total, pix_50, link

  const payMethod = rawPayMethod === "link" ? "cartao" : "pix";

  // Hotel/Address
  const hotel = formData.get("hotel")?.toString().trim() || "A combinar";
  const hotelAddress = formData.get("hotelAddress")?.toString().trim() || "";

  // Details
  const idaDateRaw = formData.get("idaDate")?.toString();
  const idaTime = formData.get("idaTime")?.toString() || null;
  const idaFlight = formData.get("idaFlight")?.toString() || null;

  const voltaDateRaw = formData.get("voltaDate")?.toString();
  const voltaTime = formData.get("voltaTime")?.toString() || null;
  const voltaFlight = formData.get("voltaFlight")?.toString() || null;

  // Options — parse optionalsJson no formato unificado { addons, childSeats, hasChildUnder10, cityTour }
  const addonsRaw = formData.get("addonsJson")?.toString() || "{}";
  let parsedOptionals: Record<string, unknown> = {};
  try {
    parsedOptionals = JSON.parse(addonsRaw);
  } catch {
    parsedOptionals = {};
  }

  // Suporta formato novo { addons, childSeats } e formato antigo plano
  const addonsSource = (
    "addons" in parsedOptionals ? parsedOptionals.addons : parsedOptionals
  ) as Record<string, unknown>;
  const childSeatsSource = (parsedOptionals.childSeats ?? {}) as Record<string, unknown>;
  const hasChildUnder10 =
    !!parsedOptionals.hasChildUnder10 || Object.values(childSeatsSource).some((q) => Number(q) > 0);

  // City Tour
  const cityTourRaw = parsedOptionals.cityTour as
    | { enabled?: boolean; date?: string; valueCents?: number }
    | null
    | undefined;
  const cityTour = cityTourRaw?.enabled
    ? { enabled: true, date: cityTourRaw.date ?? null, valueCents: cityTourRaw.valueCents ?? 0 }
    : null;
  const cityTourCents = cityTour?.valueCents ?? 0;

  const optionalsObj: Partial<Record<AddonId, number>> = sanitizeAddonSelections(addonsSource);
  const optionalsJson = JSON.stringify({
    addons: optionalsObj,
    childSeats: childSeatsSource,
    hasChildUnder10,
    cityTour,
  });

  // Calculate total addon cost in cents (free addons excluded)
  const optionalsCentsCalc =
    (Object.entries(optionalsObj) as [AddonId, number][]).reduce((sum, [id, qty]) => {
      const addon = ADDONS[id];
      if (!addon || addon.free) return sum;
      return sum + Math.round(addon.price * 100) * (qty ?? 0);
    }, 0) + cityTourCents;

  // Prices
  const totalRaw = formData.get("total")?.toString() || "0";
  // status: paid_pix | paid_cartao | paid_pix50 | pending (legado: paid)
  const status = formData.get("status")?.toString() || "pending";

  // New fields
  const internalNotes = formData.get("internalNotes")?.toString().trim() || null;
  const pickupAddress = formData.get("pickupAddress")?.toString().trim() || null;
  const vehicleCount = parseInt(formData.get("vehicleCount")?.toString() || "1", 10) || 1;
  const secondVehicle = vehicleCount > 1 ? (formData.get("secondVehicle")?.toString() || null) : null;

  // Affiliate attribution
  const affiliateCode = formData.get("affiliateCode")?.toString() || null;
  let commissionCents: number | null = null;
  if (affiliateCode) {
    const aff = await prisma.affiliate.findUnique({ where: { code: affiliateCode } });
    if (aff) {
      commissionCents = tripType === "ida_volta" ? aff.commIdaVolta : aff.commIda;
    }
  }

  // Parse total
  const totalCents =
    Math.round(parseFloat(totalRaw.replace(/[^0-9,.]/g, "").replace(",", ".")) * 100) || 0;

  const isPaid = status === "paid" || status.startsWith("paid_");
  const isPix50 = status === "paid_pix50" || (status === "paid" && rawPayMethod === "pix_50");
  const resolvedPayMethod =
    status === "paid_cartao" ? "cartao" : "pix";

  let depositCents = 0;
  let remainderCents = totalCents;

  if (isPaid) {
    if (isPix50) {
      depositCents = Math.round(totalCents / 2);
      remainderCents = totalCents - depositCents;
    } else {
      depositCents = totalCents;
      remainderCents = 0;
    }
  }

  // Find or create customer — tenta por WhatsApp, depois por CPF, depois gera placeholder
  let customer = whatsapp
    ? await prisma.customer.findFirst({ where: { phone: whatsapp } })
    : null;

  if (!customer && cpf) {
    customer = await prisma.customer.findFirst({ where: { cpf } });
  }

  if (!customer) {
    const phoneKey = whatsapp || `000${Date.now()}`;
    customer = await prisma.customer.create({
      data: { name, phone: phoneKey, email, cpf: cpf || undefined },
    });
  } else if (cpf && !customer.cpf) {
    // atualiza CPF se ainda não estava salvo
    await prisma.customer.update({ where: { id: customer.id }, data: { cpf } });
  }

  let routeLabel = "";
  let origin = "";
  let dest = "";

  if (tripType === "so_citytour") {
    routeLabel = "Somente City Tour";
    origin = "sua região";
    dest = "sua região";
  } else {
    const routeId: CanonicalRoute = "poa_gramado";
    const routeContext =
      tripType === "volta"
        ? canonicalAtendimentoRoute("volta", routeId)
        : tripType === "ida_volta"
          ? canonicalAtendimentoRoute("ida_volta", routeId)
          : canonicalAtendimentoRoute("ida", routeId);

    routeLabel = routeContext.routeLabel;
    origin = routeContext.origin;
    dest = routeContext.dest;
  }

  const cityTourDateRaw = cityTourRaw?.date;
  let idaDate = idaDateRaw ? new Date(`${idaDateRaw}T12:00:00-03:00`) : null;
  if (tripType === "so_citytour" && cityTourDateRaw) {
    idaDate = new Date(`${cityTourDateRaw}T12:00:00-03:00`);
  }
  const voltaDate = (voltaDateRaw && tripType !== "so_citytour") ? new Date(`${voltaDateRaw}T12:00:00-03:00`) : null;

  const booking = await prisma.booking.create({
    data: {
      routeLabel,
      origin,
      dest,
      tripType,
      vehicleType,
      passengerCount,
      hotel,
      hotelAddress: hotelAddress || null,
      idaDate: (tripType === "so_citytour") ? idaDate : (tripType !== "volta" ? idaDate : null),
      voltaDate: (tripType === "so_citytour") ? null : (tripType !== "ida" ? voltaDate : null),
      idaFlightTime: tripType !== "volta" && tripType !== "so_citytour" ? idaTime : null,
      idaFlightNumber: tripType !== "volta" && tripType !== "so_citytour" ? idaFlight : null,
      voltaFlightTime: tripType !== "ida" && tripType !== "so_citytour" ? voltaTime : null,
      voltaFlightNumber: tripType !== "ida" && tripType !== "so_citytour" ? voltaFlight : null,
      payMethod: resolvedPayMethod,
      totalCents,
      depositCents,
      remainderCents,
      publicToken: `adm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      optionalsJson,
      optionalsCents: optionalsCentsCalc,
      status: isPaid ? "CONFIRMED" : "PENDING",
      customerId: customer.id,
      affiliateCode,
      commissionCents,
      internalNotes,
      pickupAddress,
      vehicleCount,
      secondVehicle,
      passengers: {
        create: Array.from({ length: passengerCount }).map((_, i) => ({
          fullName: formData.get(`paxName_${i}`)?.toString() || "",
          docType: "CPF",
          docNumber: formData.get(`paxDoc_${i}`)?.toString() || "",
        })),
      },
    },
  });

  if (isPaid) {
    // Marca lead como convertido se existir no CRM
    if (whatsapp) {
      markLeadConverted(whatsapp, booking.id).catch(() => {});
    }

    // Generate standard payment record if paid
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amountCents: totalCents,
        method: "manual",
        providerId: `man_${Date.now()}`,
        status: "approved",
        paidAt: new Date(),
      },
    });
  }

  // Registra a URL do contrato (PDF gerado on-demand pela rota /api/contracts/[id])
  prisma.booking
    .update({ where: { id: booking.id }, data: { contractPdfUrl: `/api/contracts/${booking.id}` } })
    .catch(() => {});

  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
  const dataFormatada = fmtDate(idaDate);
  const voltaFormatada = fmtDate(voltaDate);
  const valorFormatado = (totalCents / 100).toFixed(2).replace(".", ",");

  const msgReserva =
    `📋 *NOVA AGENDAMENTO*\n\n` +
    `👤 ${name}\n` +
    `📱 ${whatsapp || "—"}\n` +
    `👥 ${passengerCount} pessoa${passengerCount !== 1 ? "s" : ""}\n` +
    `🚗 ${vehicleType}\n` +
    `🏨 ${hotel || "—"}\n` +
    (tripType === "ida_volta"
      ? `✈️ Chegada: ${dataFormatada}${idaTime ? ` às ${idaTime}` : ""}\n` +
        `🛫 Retorno: ${voltaFormatada}${voltaTime ? ` às ${voltaTime}` : ""}\n`
      : tripType === "ida"
        ? `✈️ Chegada: ${dataFormatada}${idaTime ? ` às ${idaTime}` : ""}\n`
        : `🛫 Retorno: ${voltaFormatada}${voltaTime ? ` às ${voltaTime}` : ""}\n`) +
    `💳 ${status === "paid_pix50" ? "PIX 50% (sinal)" : status === "paid_cartao" ? "Cartão integral" : status === "paid_pix" ? "PIX total" : rawPayMethod === "pix_50" ? "PIX 50% entrada" : rawPayMethod === "pix_total" ? "PIX total" : "Cartão"}\n` +
    `💰 R$ ${valorFormatado}\n` +
    `🔗 https://seudominio.com.br/admin/agendamentos/${booking.id}`;
  await notifyTeam(msgReserva).catch((err) =>
    console.error("[BOOKING] Falha notifyTeam nova-agendamento:", err.message)
  );

  let cityTourDate = null;
  try {
    const optObj = JSON.parse(optionalsJson || "{}");
    if (optObj.cityTour?.enabled && optObj.cityTour?.date) {
      cityTourDate = optObj.cityTour.date;
    }
  } catch {}

  // Cria evento no Zoho Calendar (só se tiver data confirmada)
  if (idaDate || voltaDate || cityTourDate) {
    const zohoUid = await criarEventoZoho({
      bookingId: booking.id,
      clienteName: name,
      clientePhone: whatsapp,
      veiculo: vehicleType,
      idaDate,
      idaFlightTime: idaTime || null,
      idaFlightNumber: idaFlight || null,
      voltaDate: voltaDate || null,
      voltaFlightTime: voltaTime || null,
      voltaFlightNumber: voltaFlight || null,
      cityTourDate,
      hotel,
      hotelAddress: hotelAddress || null,
      routeLabel,
      payMethod: resolvedPayMethod,
      depositCents,
      remainderCents,
      partida: hotel || "Aeroporto Salgado Filho (POA)",
      destino: "sua região",
      passengerCount,
      totalCents,
      optionalsJson,
      origem: "manual",
    }).catch(() => null);

    if (zohoUid && typeof zohoUid === "string") {
      await prisma.booking
        .update({
          where: { id: booking.id },
          data: { zohoEventUid: zohoUid },
        })
        .catch(() => {});
    }
  }

  // Notifica o cliente via template WhatsApp (primeiro contato = precisa de template aprovado)
  if (whatsapp) {
    const primeiroNome = name.split(" ")[0] || "Cliente";
    const isPaid = status === "paid";

    const datasResumo =
      tripType === "ida_volta"
        ? `Chegada: ${dataFormatada}${idaTime ? ` às ${idaTime}` : ""} | Retorno: ${voltaFormatada}${voltaTime ? ` às ${voltaTime}` : ""}`
        : tripType === "ida"
          ? `Chegada: ${dataFormatada}${idaTime ? ` às ${idaTime}` : ""}`
          : `Retorno: ${voltaFormatada}${voltaTime ? ` às ${voltaTime}` : ""}`;

    await sendWhatsAppTemplate(
      whatsapp,
      "negocio_reserva_cliente",
      "pt_BR",
      [{
        type: "body",
        parameters: [
          { type: "text", text: primeiroNome },
          { type: "text", text: String(passengerCount) },
          { type: "text", text: vehicleType },
          { type: "text", text: hotel || "—" },
          { type: "text", text: datasResumo },
          { type: "text", text: valorFormatado },
          { type: "text", text: isPaid ? "Pagamento confirmado ✅" : "Aguardando pagamento ⏳" },
        ],
      }]
    ).catch((err) =>
      console.error("[BOOKING] Falha template cliente nova-agendamento:", err.message)
    );
  }

  redirect("/admin");
}
