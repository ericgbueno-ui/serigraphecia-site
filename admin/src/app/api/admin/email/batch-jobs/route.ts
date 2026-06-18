// GET  /api/admin/email/batch-jobs — lista jobs ativos
// POST /api/admin/email/batch-jobs — cria novo agendamento em lotes
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";

export type ScheduleEntry = {
  sendAt: string;   // ISO UTC
  batchSize: number;
  sent: boolean;
  sentAt?: string;
  sentCount?: number;
  failedCount?: number;
};

/**
 * Gera a grade de horários BRT com warmup:
 * - Dia 0 (hoje):  12h e 17h
 * - Dia 1+ :       8h30 e 14h
 */
export function buildWarmupSchedule(
  startDateBRT: Date,
  batches: number[],
): ScheduleEntry[] {
  const BRT_OFFSET = 3; // UTC-3

  // [hora, minuto] em BRT por dia
  const slotsDay0: [number, number][] = [[11, 0], [17, 0]];
  const slotsDefault: [number, number][] = [[8, 30], [14, 0]];

  const entries: ScheduleEntry[] = [];
  let day = 0;
  let slotIdx = 0;

  for (const size of batches) {
    const slots = day === 0 ? slotsDay0 : slotsDefault;
    const [h, m] = slots[slotIdx];

    const date = new Date(startDateBRT);
    date.setUTCDate(date.getUTCDate() + day);
    date.setUTCHours(h + BRT_OFFSET, m, 0, 0);
    entries.push({ sendAt: date.toISOString(), batchSize: size, sent: false });

    slotIdx++;
    if (slotIdx >= slots.length) {
      slotIdx = 0;
      day++;
    }
  }

  return entries;
}

export async function GET() {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const jobs = await prisma.emailBatchJob.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json();
  const { subject, body: emailBody, ctaText, ctaUrl, audience, totalTarget, startAt, batchSizes } = body;

  if (!subject || !emailBody || !totalTarget)
    return NextResponse.json({ error: "subject, body e totalTarget são obrigatórios." }, { status: 400 });

  // batchSizes customizável ou padrão warmup para 500 contatos
  const sizes: number[] = batchSizes ?? [5, 5, 10, 10, 20, 20, 40, 40, 80, 80, 100, 90];
  const start = startAt ? new Date(startAt) : new Date();

  const schedule = buildWarmupSchedule(start, sizes);

  const job = await prisma.emailBatchJob.create({
    data: {
      audience: audience ?? "b2b",
      subject,
      body: emailBody,
      ctaText: ctaText || null,
      ctaUrl: ctaUrl || null,
      status: "active",
      totalTarget,
      totalSent: 0,
      scheduleJson: JSON.stringify(schedule),
    },
  });

  return NextResponse.json({ job, schedule });
}
