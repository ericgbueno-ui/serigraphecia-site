// PATCH /api/admin/email/batch-jobs/[id] — pausa, retoma, cancela ou reagenda
export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { buildWarmupSchedule } from "../route";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json();
  const { status, action } = body as { status?: string; action?: string };

  if (action === "trigger-now") {
    // Dispara o próximo lote IMEDIATAMENTE (ignora o horário agendado)
    // Usa dynamic imports para evitar Edge Runtime crash
    const job = await prisma.emailBatchJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });

    const schedule = JSON.parse(job.scheduleJson) as Array<{
      sent: boolean; sendAt: string; batchSize: number;
      sentAt?: string; sentCount?: number; failedCount?: number;
    }>;

    const nextIdx = schedule.findIndex((e) => !e.sent);
    if (nextIdx === -1) return NextResponse.json({ error: "Todos os lotes já foram enviados." }, { status: 400 });

    const entry = schedule[nextIdx];
    const take = entry.batchSize;
    const offset = job.totalSent;

    // Busca contatos B2B
    const recipients = await prisma.b2bContact.findMany({
      where: { email: { not: null }, status: { not: "descartado" } },
      select: { email: true, name: true },
      skip: offset, take,
      orderBy: { createdAt: "asc" },
    });

    const valid = recipients.filter((r) => r.email);
    if (valid.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0, firstError: "Nenhum contato B2B com e-mail encontrado no offset " + offset });
    }

    // Dynamic imports — só carregam quando necessário, evita Edge Runtime
    const { sendMarketingEmail, buildEmailHtml } = await import("@/lib/resend");

    let sent = 0, failed = 0;
    let firstError: string | null = null;
    const baseUrl = "https://multitrip.com.br";

    for (const r of valid) {
      if (!r.email) continue;
      const firstName = r.name?.split(" ")[0];
      const e = Buffer.from(r.email.toLowerCase()).toString("base64url");
      const html = buildEmailHtml({
        title: job.subject,
        body: job.body,
        ctaText: job.ctaText ?? undefined,
        ctaUrl: job.ctaUrl ?? undefined,
        firstName,
        footerNote: "Você está recebendo este e-mail porque identificamos sua agência como parceira estratégica potencial da Multi Trip na Serra Gaúcha.",
        unsubscribeHref: `${baseUrl}/api/unsubscribe?e=${e}`,
        hideSignature: true,
      });
      try {
        const result = await sendMarketingEmail({ to: r.email, subject: job.subject, html });
        if (result.error) { failed++; if (!firstError) firstError = result.error.message; }
        else sent++;
      } catch (err: unknown) {
        failed++;
        if (!firstError) firstError = err instanceof Error ? err.message : String(err);
      }
    }

    const now = new Date();
    schedule[nextIdx] = { ...entry, sent: true, sentAt: now.toISOString(), sentCount: sent, failedCount: failed };

    await prisma.emailBatchJob.update({
      where: { id },
      data: { totalSent: { increment: sent }, scheduleJson: JSON.stringify(schedule) },
    });

    return NextResponse.json({ ok: true, sent, failed, total: valid.length, firstError, batch: nextIdx + 1 });
  }

  if (action === "schedule-today") {
    // Move os próximos 2 lotes pendentes para hoje nos horários pedidos
    const job = await prisma.emailBatchJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });

    const schedule = JSON.parse(job.scheduleJson) as Array<{ sent: boolean; sendAt: string; batchSize: number }>;
    const pending = schedule.map((e, i) => ({ ...e, i })).filter((e) => !e.sent);

    if (pending.length === 0) return NextResponse.json({ error: "Sem lotes pendentes." }, { status: 400 });

    // Lote 1 → hoje 11h30 BRT = 14h30 UTC
    const t1 = new Date();
    t1.setUTCHours(14, 30, 0, 0);
    schedule[pending[0].i].sendAt = t1.toISOString();

    // Lote 2 → hoje 16h BRT = 19h UTC
    if (pending.length >= 2) {
      const t2 = new Date();
      t2.setUTCHours(19, 0, 0, 0);
      schedule[pending[1].i].sendAt = t2.toISOString();
    }

    await prisma.emailBatchJob.update({
      where: { id },
      data: { scheduleJson: JSON.stringify(schedule) },
    });

    return NextResponse.json({
      ok: true,
      lote1: { idx: pending[0].i, sendAt: schedule[pending[0].i].sendAt, batchSize: pending[0].batchSize },
      lote2: pending.length >= 2 ? { idx: pending[1].i, sendAt: schedule[pending[1].i].sendAt, batchSize: pending[1].batchSize } : null,
    });
  }

  if (action === "reschedule") {
    const start = new Date();
    start.setUTCHours(14, 20, 0, 0);

    const sizes: number[] = [5, 5, 10, 10, 20, 20, 40, 40, 80, 80, 100, 90];
    const schedule = buildWarmupSchedule(start, sizes);

    const job = await prisma.emailBatchJob.update({
      where: { id },
      data: { status: "active", totalSent: 0, scheduleJson: JSON.stringify(schedule) },
    });
    return NextResponse.json({ job });
  }

  if (!status || !["active", "paused", "cancelled"].includes(status))
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });

  const job = await prisma.emailBatchJob.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ job });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await ctx.params;
  await prisma.emailBatchJob.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
