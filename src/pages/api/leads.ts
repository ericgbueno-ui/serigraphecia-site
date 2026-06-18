import type { APIRoute } from "astro";
import { z } from "zod";
import { prisma } from "../../lib/prisma";

export const prerender = false;

const leadSchema = z.object({
  name: z.string().trim().max(120).optional().default(""),
  whatsapp: z.string().trim().min(8).max(32),
  email: z.string().trim().email().optional().or(z.literal("")).default(""),
  model: z.string().trim().max(80).optional().default(""),
  color: z.string().trim().max(80).optional().default(""),
  quantity: z.union([z.string(), z.number()]).optional(),
  size: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
  pagePath: z.string().trim().max(200).optional().default("/"),
  source: z.string().trim().max(40).optional().default("site"),
  utmSource: z.string().trim().max(120).optional().default(""),
  utmMedium: z.string().trim().max(120).optional().default(""),
  utmCampaign: z.string().trim().max(120).optional().default(""),
});

function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length >= 12 && digits.length <= 13 && digits.startsWith("55")) {
    return digits;
  }

  if (digits.length >= 10 && digits.length <= 11) {
    return `55${digits}`;
  }

  if (digits.length > 13) {
    return digits.slice(-13);
  }

  return null;
}

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const input = parsed.data;
  const whatsapp = normalizeWhatsapp(input.whatsapp);

  if (!whatsapp) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_whatsapp" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const quantity = typeof input.quantity === "number"
    ? input.quantity
    : input.quantity
      ? Number(String(input.quantity).replace(/\D/g, ""))
      : undefined;

  const existingLead = await prisma.lead.findUnique({
    where: { whatsapp },
    select: { status: true },
  });
  const preserveConverted = existingLead?.status === "convertido";

  const lead = await prisma.lead.upsert({
    where: { whatsapp },
    create: {
      whatsapp,
      name: input.name || null,
      email: input.email || null,
      score: 30,
      status: "interessado",
      source: input.source || "site",
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
      ...(quantity && Number.isFinite(quantity) ? { passengers: quantity } : {}),
    },
    update: {
      name: input.name || undefined,
      email: input.email || undefined,
      score: { increment: 30 },
      ...(preserveConverted ? {} : { status: "interessado" }),
      source: input.source || undefined,
      utmSource: input.utmSource || undefined,
      utmMedium: input.utmMedium || undefined,
      utmCampaign: input.utmCampaign || undefined,
      ...(quantity && Number.isFinite(quantity) ? { passengers: quantity } : {}),
    },
  });

  const resumo = [
    `Site quote request`,
    input.name ? `Nome: ${input.name}` : null,
    input.model ? `Modelo: ${input.model}` : null,
    input.color ? `Cor: ${input.color}` : null,
    Number.isFinite(quantity ?? NaN) ? `Quantidade: ${quantity}` : null,
    input.size ? `Tamanho: ${input.size}` : null,
    input.message ? `Mensagem: ${input.message}` : null,
    input.pagePath ? `Pagina: ${input.pagePath}` : null,
  ].filter(Boolean).join(" | ");

  await prisma.interaction.create({
    data: {
      leadId: lead.id,
      role: "lead",
      content: resumo,
    },
  });

  await prisma.leadEvent.create({
    data: {
      leadId: lead.id,
      type: "quote_request",
      points: 30,
      meta: {
        pagePath: input.pagePath,
        model: input.model || null,
        color: input.color || null,
        quantity: Number.isFinite(quantity ?? NaN) ? quantity : null,
        size: input.size || null,
        message: input.message || null,
        source: input.source || "site",
      },
    },
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
