import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { criarEventoZoho, editarEventoZoho } from '../src/lib/zoho-calendar';

const prisma = new PrismaClient();

async function syncBooking(id: string) {
  console.log(`Buscando reserva ${id}...`);
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { customer: true }
  });
  
  if (!booking) {
    console.error('⚠️ Reserva não encontrada no banco de dados!');
    return;
  }

  let cityTourDate = null;
  try {
    const optObj = JSON.parse(booking.optionalsJson || "{}");
    if (optObj.cityTour?.enabled && optObj.cityTour?.date) {
      cityTourDate = optObj.cityTour.date;
    }
  } catch {}

  const eventoData = {
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
  };

  console.log("Dados preparados para o Zoho. Enviando...");

  if (booking.zohoEventUid) {
    console.log(`Atualizando evento já existente no Zoho (UID: ${booking.zohoEventUid})...`);
    const result = await editarEventoZoho(booking.zohoEventUid, eventoData);
    console.log("✅ Resultado da edição:", result);
    if (result && typeof result === "string" && result !== booking.zohoEventUid) {
      await prisma.booking.update({ where: { id }, data: { zohoEventUid: result } });
      console.log(`✅ Novo UID salvo no banco de dados da Multi Trip: ${result}`);
    }
  } else {
    console.log("Criando NOVO evento no Zoho...");
    const uid = await criarEventoZoho(eventoData);
    if (uid && typeof uid === "string") {
      console.log(`✅ Novo evento criado com sucesso! UID: ${uid}`);
      await prisma.booking.update({ where: { id }, data: { zohoEventUid: uid } });
      console.log("✅ UID salvo no banco de dados da Multi Trip.");
    } else {
      console.error("⚠️ Falha ao criar evento (nenhum UID retornado).");
    }
  }
}

syncBooking('cmp23tyoc00022hhlfomu35j0')
  .catch(console.error)
  .finally(() => prisma.$disconnect());
