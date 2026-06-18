/**
 * GET /api/cron/birthday
 *
 * Roda todos os dias às 09h (BRT) via Vercel Cron.
 * Busca clientes cujo dia+mês de birthDate = hoje,
 * e envia mensagem de aniversário via Meta WhatsApp API.
 *
 * Proteção: header Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsAppTemplate } from "@/lib/meta-whatsapp";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  // ── Data de hoje (horário de Brasília) ────────────────────────────────────
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const todayMonth = now.getMonth() + 1; // 1–12
  const todayDay = now.getDate(); // 1–31

  console.log(`[birthday-cron] 🎂 Rodando para ${todayDay}/${todayMonth}`);

  // ── Busca clientes aniversariantes ────────────────────────────────────────
  // Filtramos em JS (PostgreSQL não tem EXTRACT fácil no Prisma sem raw query)
  const customers = await prisma.customer.findMany({
    where: { birthDate: { not: null } },
    select: { id: true, name: true, phone: true, birthDate: true },
  });

  const aniversariantes = customers.filter((c) => {
    if (!c.birthDate) return false;
    const bd = new Date(c.birthDate);
    return bd.getMonth() + 1 === todayMonth && bd.getDate() === todayDay;
  });

  console.log(`[birthday-cron] ${aniversariantes.length} aniversariante(s) hoje`);

  if (!aniversariantes.length) {
    return NextResponse.json({ message: "Nenhum aniversariante hoje.", sent: 0 });
  }

  // ── Envio ─────────────────────────────────────────────────────────────────
  let sent = 0;
  let failed = 0;

  for (const cliente of aniversariantes) {
    const firstName = cliente.name.split(" ")[0];
    const phone = cliente.phone.replace(/\D/g, "");

    try {
      await sendWhatsAppTemplate(phone, "multitrip_feliz_aniversario", "pt_BR", [
        {
          type: "body",
          parameters: [{ type: "text", text: firstName }],
        },
      ]);

      sent++;
      console.log(`[birthday-cron] 🎉 Enviado para ${firstName} (${phone})`);

      // Delay entre envios
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      failed++;
      console.error(`[birthday-cron] ❌ Falha para ${phone}:`, err);
    }
  }

  return NextResponse.json({
    message: `Aniversários processados: ${sent} enviados, ${failed} falhas.`,
    sent,
    failed,
    total: aniversariantes.length,
  });
}
