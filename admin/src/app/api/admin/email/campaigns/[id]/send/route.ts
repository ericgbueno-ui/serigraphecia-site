// POST /api/admin/email/campaigns/[id]/send — dispara uma campanha
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { sendMarketingEmail, buildEmailHtml } from "@/lib/resend";
import { unsubscribeUrl } from "@/lib/unsubscribe";

export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: RouteContext) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await ctx.params;

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  if (campaign.status === "sent")
    return NextResponse.json({ error: "Esta campanha já foi enviada." }, { status: 409 });

  // ── Monta lista de destinatários ──────────────────────────────────────────
  type Recipient = { email: string; name?: string };
  const recipients: Recipient[] = [];

  if (campaign.audience === "b2b") {
    // Busca todos os contatos B2B com e-mail e nome cadastrados
    const b2b = await prisma.b2bContact.findMany({
      where: { email: { not: null }, status: { not: "descartado" } },
      select: { email: true, name: true },
    });
    for (const c of b2b) {
      if (c.email) recipients.push({ email: c.email, name: c.name });
    }
  } else if (campaign.audience === "manual") {
    const emails = (campaign.manualEmails ?? "")
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    for (const email of emails) recipients.push({ email });
  } else {
    if (campaign.audience === "clientes" || campaign.audience === "ambos") {
      const customers = await prisma.customer.findMany({
        select: { email: true, name: true },
        where: { email: { not: "" } },
      });
      for (const c of customers) {
        if (c.email) recipients.push({ email: c.email, name: c.name });
      }
    }
    if (campaign.audience === "leads" || campaign.audience === "ambos") {
      const leads = await prisma.lead.findMany({
        select: { email: true, name: true },
        where: { email: { not: null } },
      });
      for (const l of leads) {
        if (l.email) recipients.push({ email: l.email, name: l.name ?? undefined });
      }
    }
  }

  // Remove duplicatas por e-mail
  const unique = Array.from(
    new Map(recipients.map((r) => [r.email.toLowerCase(), r])).values()
  );

  if (unique.length === 0) {
    return NextResponse.json({ error: "Nenhum destinatário com e-mail válido encontrado." }, { status: 400 });
  }

  // Marca como "sending"
  await prisma.emailCampaign.update({
    where: { id },
    data: { status: "sending", recipientCount: unique.length },
  });

  // ── Disparo em lote (sequencial com pequeno delay para respeitar rate limits) ──
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const recipientLog: { email: string; name?: string; status: "sent" | "failed" }[] = [];

  for (const r of unique) {
    const firstName = r.name?.split(" ")[0];
    const html = buildEmailHtml({
      title: campaign.subject,
      body: campaign.body,
      ctaText: campaign.ctaText ?? undefined,
      footerNote: campaign.audience === "b2b"
        ? "Você está recebendo este e-mail porque identificamos sua agência como parceira estratégica potencial da Multi Trip na Serra Gaúcha."
        : undefined,
      unsubscribeHref: unsubscribeUrl(r.email),
      ctaUrl: campaign.ctaUrl ?? undefined,
      firstName,
      hideSignature: campaign.audience === "b2b",
    });

    try {
      const result = await sendMarketingEmail({
        to: r.email,
        subject: campaign.subject,
        html,
      });
      if (result.error) {
        failed++;
        errors.push(`${r.email}: ${result.error.message}`);
        recipientLog.push({ email: r.email, name: r.name, status: "failed" });
      } else {
        sent++;
        recipientLog.push({ email: r.email, name: r.name, status: "sent" });
      }
    } catch (err: unknown) {
      failed++;
      errors.push(`${r.email}: ${err instanceof Error ? err.message : String(err)}`);
      recipientLog.push({ email: r.email, name: r.name, status: "failed" });
    }
  }

  // Atualiza status final + salva log de destinatários
  await prisma.emailCampaign.update({
    where: { id },
    data: {
      status: failed === unique.length ? "error" : "sent",
      sentAt: new Date(),
      sentCount: sent,
      failedCount: failed,
      recipientsJson: JSON.stringify(recipientLog),
    },
  });

  return NextResponse.json({
    ok: true,
    total: unique.length,
    sent,
    failed,
    errors: errors.slice(0, 10),
  });
}
