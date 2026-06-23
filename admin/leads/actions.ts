"use server";

import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { revalidatePath } from "next/cache";
import { recalculateLeadScore } from "@/lib/lead";

export async function deleteLead(id: string) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  await prisma.interaction.deleteMany({ where: { leadId: id } });
  await prisma.leadEvent.deleteMany({ where: { leadId: id } });
  await prisma.lead.delete({ where: { id } });

  revalidatePath("/admin/leads");
}

export async function updateLeadStatus(id: string, status: string) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  const validStatuses = ["frio", "interessado", "quente", "pronto", "convertido"];
  if (!validStatuses.includes(status)) {
    throw new Error("Status inválido.");
  }

  await prisma.lead.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/leads");
}

export async function updateLeadDetails(
  id: string,
  data: {
    name?: string | null;
    email?: string | null;
    whatsapp?: string;
    origin?: string | null;
    destination?: string | null;
    travelDate?: string | null;
    passengers?: number | null;
    valueCents?: number | null;
    source?: string;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
  }
) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  // Limpa o número de whatsapp se enviado
  let whatsappNormalized = data.whatsapp ? data.whatsapp.replace(/\D/g, "") : undefined;

  // Processa a data da atendimento
  let travelDateParsed: Date | null = null;
  if (data.travelDate) {
    travelDateParsed = new Date(data.travelDate);
  }

  await prisma.lead.update({
    where: { id },
    data: {
      name: data.name ?? null,
      email: data.email ?? null,
      whatsapp: whatsappNormalized,
      origin: data.origin ?? null,
      destination: data.destination ?? null,
      travelDate: travelDateParsed,
      passengers: data.passengers ? Math.max(1, data.passengers) : null,
      valueCents: data.valueCents ? Math.max(0, data.valueCents) : null,
      source: data.source ?? "whatsapp",
      utmSource: data.utmSource ?? null,
      utmMedium: data.utmMedium ?? null,
      utmCampaign: data.utmCampaign ?? null,
    },
  });

  // Recalcula score após atualização de perfil
  await recalculateLeadScore(id).catch(() => {});

  revalidatePath("/admin/leads");
}

export async function createLead(data: {
  whatsapp: string;
  name?: string;
  email?: string;
  origin?: string;
  destination?: string;
  travelDate?: string;
  passengers?: number;
  valueCents?: number;
  source?: string;
}) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");

  // Valida e limpa WhatsApp
  const whatsappClean = data.whatsapp.replace(/\D/g, "");
  if (!whatsappClean || whatsappClean.length < 8) {
    throw new Error("Número de WhatsApp inválido.");
  }

  // Verifica se o lead já existe
  const existing = await prisma.lead.findUnique({
    where: { whatsapp: whatsappClean },
  });

  if (existing) {
    throw new Error("Já existe um lead cadastrado com este número de WhatsApp!");
  }

  // Processa data
  let travelDateParsed: Date | null = null;
  if (data.travelDate) {
    travelDateParsed = new Date(data.travelDate);
  }

  const newLead = await prisma.lead.create({
    data: {
      whatsapp: whatsappClean,
      name: data.name || null,
      email: data.email || null,
      origin: data.origin || null,
      destination: data.destination || null,
      travelDate: travelDateParsed,
      passengers: data.passengers ? Math.max(1, data.passengers) : null,
      valueCents: data.valueCents ? Math.max(0, data.valueCents) : null,
      source: data.source || "whatsapp_equipe",
      status: "frio",
      score: 0,
    },
  });

  // Score inicial baseado nos dados fornecidos
  await recalculateLeadScore(newLead.id).catch(() => {});

  revalidatePath("/admin/leads");
  return newLead;
}
