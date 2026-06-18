/**
 * GET /api/cron/email-batch
 *
 * Executa lotes agendados de e-mail (warmup B2B).
 * Roda a cada 30 min via Vercel Cron.
 * Proteção: Authorization: Bearer CRON_SECRET
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMarketingEmail, buildEmailHtml } from "@/lib/resend";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import type { ScheduleEntry } from "@/app/api/admin/email/batch-jobs/route";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const now = new Date();

  // Busca jobs ativos
  const jobs = await prisma.emailBatchJob.findMany({
    where: { status: "active" },
  });

  if (jobs.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: "Nenhum job ativo." });
  }

  const results: object[] = [];

  for (const job of jobs) {
    const schedule: ScheduleEntry[] = JSON.parse(job.scheduleJson);

    // Próxima entrada não enviada cujo horário já passou
    const nextIdx = schedule.findIndex((e) => !e.sent && new Date(e.sendAt) <= now);

    if (nextIdx === -1) {
      // Nenhum lote pendente agora — verificar se job terminou
      if (schedule.every((e) => e.sent)) {
        await prisma.emailBatchJob.update({ where: { id: job.id }, data: { status: "completed" } });
        results.push({ id: job.id, action: "completed" });
      }
      continue;
    }

    const entry = schedule[nextIdx];
    const offset = job.totalSent;
    const take = entry.batchSize;

    // Busca destinatários com offset
    type Recipient = { email: string | null; name: string | null };
    let recipients: Recipient[] = [];

    if (job.audience === "b2b") {
      recipients = await prisma.b2bContact.findMany({
        where: { email: { not: null }, status: { not: "descartado" } },
        select: { email: true, name: true },
        skip: offset,
        take,
        orderBy: { createdAt: "asc" },
      });
    } else if (job.audience === "clientes") {
      recipients = await prisma.customer.findMany({
        where: { email: { not: "" } },
        select: { email: true, name: true },
        skip: offset,
        take,
      });
    } else if (job.audience === "leads") {
      const leads = await prisma.lead.findMany({
        where: { email: { not: null } },
        select: { email: true, name: true },
        skip: offset,
        take,
        orderBy: { createdAt: "asc" },
      });
      recipients = leads;
    }

    const valid = recipients.filter((r) => r.email);

    if (valid.length === 0) {
      // Sem mais destinatários — job concluído
      schedule[nextIdx] = { ...entry, sent: true, sentAt: now.toISOString(), sentCount: 0, failedCount: 0 };
      await prisma.emailBatchJob.update({
        where: { id: job.id },
        data: { status: "completed", scheduleJson: JSON.stringify(schedule) },
      });
      results.push({ id: job.id, action: "completed_no_more_recipients" });
      continue;
    }

    let sent = 0;
    let failed = 0;

    for (const r of valid) {
      if (!r.email) continue;
      const firstName = r.name?.split(" ")[0];
      const html = buildEmailHtml({
        title: job.subject,
        body: job.body,
        ctaText: job.ctaText ?? undefined,
        ctaUrl: job.ctaUrl ?? undefined,
        firstName,
        footerNote: "Você está recebendo este e-mail porque identificamos sua agência como parceira estratégica potencial da Multi Trip na Serra Gaúcha.",
        unsubscribeHref: unsubscribeUrl(r.email),
        hideSignature: true,
      });

      try {
        const result = await sendMarketingEmail({ to: r.email, subject: job.subject, html });
        if (result.error) failed++;
        else sent++;
      } catch {
        failed++;
      }
    }

    // Atualiza entrada do schedule
    schedule[nextIdx] = {
      ...entry,
      sent: true,
      sentAt: now.toISOString(),
      sentCount: sent,
      failedCount: failed,
    };

    await prisma.emailBatchJob.update({
      where: { id: job.id },
      data: {
        totalSent: { increment: sent },
        scheduleJson: JSON.stringify(schedule),
      },
    });

    console.log(`[email-batch] Job ${job.id} lote ${nextIdx + 1}: ${sent} enviados, ${failed} falhas`);
    results.push({ id: job.id, batch: nextIdx + 1, sent, failed, total: valid.length });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
