// POST /api/admin/marketing/send
// Envia WhatsApp em massa para clientes, leads ou lista manual.
// Suporta texto livre (sessão aberta) e templates aprovados pela Meta.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { sendWhatsApp, sendWhatsAppTemplate } from "@/lib/meta-whatsapp";
import { getIsAdmin } from "@/lib/server/adminAuth";

export async function POST(req: NextRequest) {
  if (!(await getIsAdmin())) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json();
  const { audience, phones, message, useTemplate, templateName } = body as {
    audience: "clientes" | "leads" | "ambos" | "manual";
    phones?: string[];
    message: string;
    useTemplate?: boolean;
    templateName?: string;
  };

  if (!useTemplate && !message?.trim()) {
    return NextResponse.json({ error: "Mensagem não pode ser vazia." }, { status: 400 });
  }
  if (useTemplate && !templateName?.trim()) {
    return NextResponse.json({ error: "Nome do template não informado." }, { status: 400 });
  }

  // ── Monta lista de destinatários ──────────────────────────────────────────

  let numbers: string[] = [];

  if (audience === "manual") {
    if (!phones?.length) {
      return NextResponse.json({ error: "Nenhum número informado." }, { status: 400 });
    }
    numbers = phones.map((p) => p.replace(/\D/g, "")).filter((p) => p.length >= 10);
  } else {
    const set = new Set<string>();

    if (audience === "clientes" || audience === "ambos") {
      const customers = await prisma.customer.findMany({ select: { phone: true, name: true } });
      customers.forEach((c) => {
        const n = c.phone.replace(/\D/g, "");
        if (n.length >= 10) set.add(n);
      });
    }

    if (audience === "leads" || audience === "ambos") {
      const leads = await prisma.lead.findMany({ select: { whatsapp: true, name: true } });
      leads.forEach((l) => {
        const n = l.whatsapp.replace(/\D/g, "");
        if (n.length >= 10) set.add(n);
      });
    }

    numbers = Array.from(set);
  }

  if (!numbers.length) {
    return NextResponse.json({ error: "Nenhum número válido encontrado." }, { status: 400 });
  }

  // ── Envio ─────────────────────────────────────────────────────────────────

  let sent = 0;
  let failed = 0;
  const errorDetails: { num: string; msg: string }[] = [];
  let firstError: string | null = null;

  for (const num of numbers) {
    try {
      if (useTemplate && templateName) {
        await sendWhatsAppTemplate(num, templateName, "pt_BR", undefined);
      } else {
        await sendWhatsApp(num, message);
      }
      sent++;
      await new Promise((r) => setTimeout(r, 200));
    } catch (err: any) {
      failed++;
      const msg = err?.message ?? "Erro desconhecido";
      errorDetails.push({ num, msg });
      if (!firstError) firstError = msg;
      console.error(`[marketing/send] Falha para ${num}: ${msg}`);
    }
  }

  return NextResponse.json({
    total: numbers.length,
    sent,
    failed,
    firstError,
    errors: errorDetails.slice(0, 10),
  });
}
