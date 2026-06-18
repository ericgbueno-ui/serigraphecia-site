/**
 * lead.ts — Motor de captura, scoring e log de leads
 *
 * Usado pelo webhook do WhatsApp e pelo tracking do site.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "./db";

// ─────────────────────────────────────────────
// CONSTANTES DE SCORE
// ─────────────────────────────────────────────

export const SCORE_MAP: Record<string, number> = {
  page_view: 10,
  whatsapp_click: 20,
  quote_request: 30,
  response: 40, // lead respondeu a Jolie
  checkout_start: 50,
  purchase: 100,
  no_response: 0,
};

/** Calcula o status a partir do score acumulado */
export function scoreToStatus(score: number): string {
  if (score >= 150) return "pronto";
  if (score >= 80) return "quente";
  if (score >= 30) return "interessado";
  return "frio";
}

// ─────────────────────────────────────────────
// BÔNUS DE PERFIL (não-cumulativos)
// Calculados a partir dos dados estáticos do lead
// ─────────────────────────────────────────────

const PAID_SOURCES = ["instagram_ads", "facebook_ads", "google_ads", "facebook", "instagram"];

export function calcProfileBonus(lead: {
  name?: string | null;
  email?: string | null;
  travelDate?: Date | string | null;
  valueCents?: number | null;
  passengers?: number | null;
  source?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
}): number {
  let bonus = 0;

  if (lead.name) bonus += 10;
  if (lead.email) bonus += 5;
  if (lead.valueCents && lead.valueCents > 0) bonus += 10;
  if (lead.passengers && lead.passengers > 1) bonus += 5;
  if (lead.utmSource || lead.utmCampaign) bonus += 10;

  if (lead.source && PAID_SOURCES.some((s) => lead.source!.toLowerCase().includes(s))) {
    bonus += 20;
  }

  if (lead.travelDate) {
    bonus += 15;
    const days = Math.ceil(
      (new Date(lead.travelDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (days >= 0 && days <= 14) bonus += 25; // urgência alta
    else if (days >= 0 && days <= 30) bonus += 15; // urgência média
  }

  return bonus;
}

// ─────────────────────────────────────────────
// RECÁLCULO COMPLETO DO SCORE
// Soma pontos de eventos + bônus de perfil
// ─────────────────────────────────────────────

export async function recalculateLeadScore(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { events: { select: { points: true } } },
  });
  if (!lead || lead.status === "convertido") return;

  const eventPoints = lead.events.reduce((s, e) => s + e.points, 0);
  const profileBonus = calcProfileBonus(lead);
  const totalScore = eventPoints + profileBonus;

  const newStatus = scoreToStatus(totalScore);

  const STATUS_RANK: Record<string, number> = {
    frio: 0, interessado: 1, quente: 2, pronto: 3, convertido: 4,
  };

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      score: totalScore,
      ...(STATUS_RANK[newStatus] > (STATUS_RANK[lead.status] ?? 0)
        ? { status: newStatus }
        : {}),
    },
  });
}

// ─────────────────────────────────────────────
// UPSERT DE LEAD
// ─────────────────────────────────────────────

export interface LeadInput {
  whatsapp: string;
  name?: string;
  email?: string;
  origin?: string;
  destination?: string;
  travelDate?: Date;
  passengers?: number;
  valueCents?: number;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Cria ou atualiza um lead pelo número do WhatsApp.
 * Nunca sobrescreve campos já preenchidos com valores vazios.
 */
export async function upsertLead(input: LeadInput) {
  const { whatsapp, ...rest } = input;

  // Remove campos undefined para não sobrescrever dados existentes
  const updateData = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

  return prisma.lead.upsert({
    where: { whatsapp },
    create: { whatsapp, ...updateData },
    update: updateData,
  });
}

// ─────────────────────────────────────────────
// REGISTRAR EVENTO E ATUALIZAR SCORE
// ─────────────────────────────────────────────

export async function trackLeadEvent(
  whatsapp: string,
  type: string,
  meta?: Record<string, unknown>
) {
  const points = SCORE_MAP[type] ?? 0;

  // Garante que o lead existe
  const lead = await prisma.lead.upsert({
    where: { whatsapp },
    create: { whatsapp, score: points },
    update: { score: { increment: points } },
  });

  // Salva o evento
  await prisma.leadEvent.create({
    data: {
      leadId: lead.id,
      type,
      points,
      meta: (meta ?? {}) as Prisma.InputJsonValue,
    },
  });

  // Recalcula status baseado no score atualizado
  const updatedScore = lead.score + points;
  const newStatus = scoreToStatus(updatedScore);

  // Só atualiza status se for "upgrade" (nunca regride)
  const STATUS_RANK: Record<string, number> = {
    frio: 0,
    interessado: 1,
    quente: 2,
    pronto: 3,
    convertido: 4,
  };

  if (STATUS_RANK[newStatus] > (STATUS_RANK[lead.status] ?? 0)) {
    await prisma.lead.update({
      where: { whatsapp },
      data: { status: newStatus },
    });
  }

  return { leadId: lead.id, points, newStatus };
}

// ─────────────────────────────────────────────
// SALVAR INTERAÇÃO COM A JOLIE
// ─────────────────────────────────────────────

export async function saveInteraction(opts: {
  whatsapp: string;
  role: "lead" | "jolie" | "human";
  content: string;
  aiEngine?: string;
}) {
  const { whatsapp, role, content, aiEngine } = opts;

  // Garante que o lead existe e toca updatedAt para ordenação por atividade recente
  const lead = await prisma.lead.upsert({
    where: { whatsapp },
    create: { whatsapp },
    update: { updatedAt: new Date() },
  });

  await prisma.interaction.create({
    data: {
      leadId: lead.id,
      role,
      content,
      aiEngine,
    },
  });

  // Toda resposta do lead conta como evento "response"
  if (role === "lead") {
    await trackLeadEvent(whatsapp, "response", { preview: content.slice(0, 100) });
  }
}

// ─────────────────────────────────────────────
// MARCAR COMO CONVERTIDO (pós-compra)
// ─────────────────────────────────────────────

export async function markLeadConverted(whatsapp: string, bookingId: string) {
  const phone = whatsapp.replace(/\D/g, "");
  if (!phone) return;

  await trackLeadEvent(phone, "purchase", { bookingId });

  await prisma.lead.update({
    where: { whatsapp: phone },
    data: { status: "convertido" },
  }).catch(() => {});
}

// ─────────────────────────────────────────────
// SYNC HISTÓRICO — marca leads existentes como convertidos
// baseado nas reservas confirmadas (não cria leads novos)
// ─────────────────────────────────────────────

export async function syncAllLeadConversions(): Promise<number> {
  const confirmedBookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED" },
    select: { id: true, customer: { select: { phone: true } } },
  });

  let synced = 0;
  for (const b of confirmedBookings) {
    const phone = b.customer?.phone?.replace(/\D/g, "");
    if (!phone) continue;

    const existing = await prisma.lead.findUnique({ where: { whatsapp: phone } });
    if (existing && existing.status !== "convertido") {
      await prisma.lead.update({
        where: { whatsapp: phone },
        data: { status: "convertido" },
      }).catch(() => {});
      synced++;
    }
  }

  return synced;
}
