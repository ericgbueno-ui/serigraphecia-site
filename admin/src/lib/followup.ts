/**
 * followup.ts — Mensagens de follow-up pós-compra
 *
 * Fluxo baseado em datas reais de viagem (idaDate / voltaDate):
 *
 *   D-1 de idaDate   → lembrete chegada IN
 *   D-1 de voltaDate → lembrete partida OUT
 *   D+2 de voltaDate → como foi? (NPS)
 *   D+5 de voltaDate → pedido de avaliação Google
 *   D+14 de voltaDate → saudade + próximo destino + agência
 *
 * Reativação (para leads não convertidos):
 *   30 / 60 / 90 dias
 */

import { prisma } from "./db";
import { notifyCliente } from "./notify";
import { saveInteraction } from "./lead";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Verifica se `date` está dentro de uma janela de 23h em relação a
 * hoje + `offsetDays`. Aceita negativos (passado) e positivos (futuro).
 * Ex: inWindow(voltaDate, -1) = voltaDate é amanhã
 *     inWindow(voltaDate, 2)  = voltaDate foi há 2 dias
 */
function inWindow(date: Date, offsetDays: number, windowHours = 23) {
  const target = daysFromNow(offsetDays);
  const diff = Math.abs(date.getTime() - target.getTime());
  return diff <= windowHours * 60 * 60 * 1000;
}

// ─────────────────────────────────────────────
// Mensagens
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Mensagens da sequência
// ─────────────────────────────────────────────

function msgPreIN(name: string, dest: string) {
  const n = name?.split(" ")[0] || "Olá";
  return (
    `${n}, sua viagem para a Serra Gaúcha é amanhã! 🤎\n\n` +
    `Tudo confirmado: veículo, motorista e recepção prontos para você em ${dest}.\n\n` +
    `Alguma dúvida de última hora? Estou aqui.\n— Jolie | Multi Trip`
  );
}

function msgPreOUT(name: string) {
  const n = name?.split(" ")[0] || "Olá";
  return (
    `${n}, sua partida é amanhã! 🏔️\n\n` +
    `Espero que estes dias na Serra Gaúcha tenham sido memoráveis — foi um prazer cuidar da sua chegada.\n\n` +
    `O transfer de retorno já está confirmado. Alguma dúvida de última hora?\n— Jolie | Multi Trip`
  );
}

function msgPostTrip(name: string) {
  const n = name?.split(" ")[0] || "Olá";
  return (
    `${n}, como foi a experiência na Serra Gaúcha? 🌿\n\n` +
    `Fico feliz em saber que chegou bem. Me conta — foi tudo como esperado?\n\n` +
    `Qualquer feedback é muito bem-vindo. 🤎\n— Jolie | Multi Trip`
  );
}

function msgGoogleReview(name: string) {
  const n = name?.split(" ")[0] || "Olá";
  return (
    `${n}, sua opinião faz toda a diferença para nós! 🌟\n\n` +
    `Se a experiência com a Multi Trip foi positiva, deixar uma avaliação no Google leva menos de 1 minuto e ajuda outras famílias a encontrarem um serviço confiável.\n\n` +
    `👉 maps.app.goo.gl/hrZoMjKwuAuKEDDQ9\n\n` +
    `Obrigada de coração! 🤎\n— Jolie | Multi Trip`
  );
}

function msgInstagram(name: string) {
  const n = name?.split(" ")[0] || "Olá";
  return (
    `${n}, já faz duas semanas desde sua viagem para a Serra Gaúcha! 🏔️\n\n` +
    `Se você tirou fotos lindas por lá (e tenho certeza que sim!), adoraria ver. ` +
    `Nos marque nas suas fotos — @multitrip.receptivo — ou deixa um comentário nos nossos posts. ` +
    `É uma forma linda de guardar essa memória e inspirar outras famílias. 🤎\n\n` +
    `📸 instagram.com/multitrip.receptivo\n\n` +
    `— Jolie | Multi Trip`
  );
}

function msgProximoDestino(name: string) {
  const n = name?.split(" ")[0] || "Olá";
  return (
    `${n}, tudo bem por aí? 🤎\n\n` +
    `Estava pensando em você! Já faz um tempinho desde a Serra Gaúcha — ` +
    `e bateu aquela vontade de saber: qual destino te faz brilhar os olhos agora?\n\n` +
    `Pode ser praia, montanha, Europa, Nordeste… me conta o que está sonhando ` +
    `e a gente começa a planejar juntos, sem pressa.\n\n` +
    `A Multi Trip cuida de tudo: passagens, hotel, roteiro e experiências. ` +
    `Você só precisa aproveitar. ✈️\n\n` +
    `— Jolie | Multi Trip`
  );
}

function msgReactivation(name: string, days: number) {
  const firstName = name?.split(" ")[0] || "Cliente";
  const msgs: Record<number, string> = {
    30:
      `${firstName}, faz um mês que você demonstrou interesse na Multi Trip! 🗓️\n\n` +
      `Se a viagem para a Serra Gaúcha ainda está nos seus planos, ` +
      `adoraria te ajudar a organizar tudo. Temos datas disponíveis e consigo te passar ` +
      `um orçamento em minutos.\n\n— Jolie | Multi Trip`,
    60:
      `Oi ${firstName}! Passando para dizer que a Serra Gaúcha está linda nessa época 🍂\n\n` +
      `Se você quiser planejar uma visita a Gramado ou Canela, me chame — ` +
      `cuido do transfer com exclusividade e atenção real.\n\n— Jolie | Multi Trip`,
    90:
      `${firstName}, a primavera na Serra Gaúcha é mágica 🌸\n\n` +
      `Se der vontade de viver essa experiência, é só me falar. ` +
      `Garanto um transfer com todo o conforto que você merece.\n\n— Jolie | Multi Trip`,
  };
  return msgs[days] ?? msgs[30];
}

// ─────────────────────────────────────────────
// Follow-up pós-compra
// ─────────────────────────────────────────────

export async function runPostPurchaseFollowups() {
  const logs: string[] = [];

  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED" },
    select: {
      id: true,
      tripType: true,
      idaDate: true,
      voltaDate: true,
      dest: true,
      affiliateCode: true,
      customer: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  for (const b of bookings) {
    const phone = b.customer?.phone;
    const name  = b.customer?.name ?? "Cliente";
    const dest  = b.dest ?? "Gramado";

    if (!phone) continue;

    // Data de referência pós-viagem:
    // voltaDate se existir, senão idaDate (viagens somente ida)
    const endDate = b.voltaDate ?? b.idaDate;

    async function send(msg: string, engine: string, tag: string) {
      try {
        await notifyCliente(phone!, msg);
        await saveInteraction({ whatsapp: phone!, role: "jolie", content: msg, aiEngine: engine });
        logs.push(`✅ ${tag} → ${phone}`);
      } catch (e: any) {
        logs.push(`❌ ${tag} → ${phone}: ${e.message}`);
      }
    }

    // D-1 antes do IN (chegada)
    if (b.idaDate && inWindow(b.idaDate, -1)) {
      await send(msgPreIN(name, dest), "followup_pre_in", "pre-IN");
    }

    // D-1 antes do OUT (partida) — só se houver volta
    if (b.voltaDate && inWindow(b.voltaDate, -1)) {
      await send(msgPreOUT(name), "followup_pre_out", "pre-OUT");
    }

    // D+2 após fim da viagem → como foi?
    if (endDate && inWindow(endDate, 2)) {
      await send(msgPostTrip(name), "followup_post_trip", "post-trip");
    }

    // D+5 após fim da viagem → avaliação Google
    if (endDate && inWindow(endDate, 5)) {
      await send(msgGoogleReview(name), "followup_google", "google-review");
    }

    // D+14 → Instagram engagement
    if (endDate && inWindow(endDate, 14)) {
      await send(msgInstagram(name), "followup_instagram", "instagram");
    }

    // D+35 → próximo destino + planejamento + agência
    // ⚠️ Nunca enviar para clientes de afiliado (agência parceira já cuida deles)
    if (endDate && inWindow(endDate, 35) && !b.affiliateCode) {
      await send(msgProximoDestino(name), "followup_proximo_destino", "proximo-destino");
    }
  }

  return logs;
}

// ─────────────────────────────────────────────
// Reativação de leads frios
// ─────────────────────────────────────────────

export async function runReactivationFollowups() {
  const logs: string[] = [];
  const targetDays = [30, 60, 90];

  for (const days of targetDays) {
    const leads = await prisma.lead.findMany({
      where: {
        status: { in: ["frio", "interessado"] },
        createdAt: {
          gte: daysFromNow(-(days + 1)),
          lte: daysFromNow(-(days - 1)),
        },
      },
    });

    for (const lead of leads) {
      if (!lead.whatsapp) continue;
      try {
        const msg = msgReactivation(lead.name ?? "Cliente", days);
        await notifyCliente(lead.whatsapp, msg);
        await saveInteraction({
          whatsapp: lead.whatsapp,
          role: "jolie",
          content: msg,
          aiEngine: `reactivation_d${days}`,
        });
        logs.push(`✅ reativação d+${days} → ${lead.whatsapp}`);
      } catch (e: any) {
        logs.push(`❌ reativação d+${days} → ${lead.whatsapp}: ${e.message}`);
      }
    }
  }

  return logs;
}
