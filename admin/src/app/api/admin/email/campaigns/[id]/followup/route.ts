// POST /api/admin/email/campaigns/[id]/followup
// Dispara um e-mail de follow-up para os destinatários que receberam a campanha original.
// Usado pelo botão manual no painel e pelo cron semanal.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { sendMarketingEmail, buildEmailHtml } from "@/lib/resend";
import { unsubscribeUrl } from "@/lib/unsubscribe";

export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

// Corpo do follow-up — curto, humano, sem exagero comercial
function buildFollowupBody(originalTitle: string): { subject: string; body: string } {
  return {
    subject: "Retorno — Rita e Eric | Multi Trip",
    body: `Na semana passada te enviei um e-mail sobre como a Multi Trip pode ser a extensão da sua marca na Serra Gaúcha.

Sei que a agenda está sempre cheia. Por isso vou ser breve: você teve a chance de ler?

Se fizer sentido para você, posso reservar 15 minutos esta semana. Quero te mostrar como trabalhamos e como podemos cuidar dos seus clientes com o mesmo padrão que você entrega nos roteiros.

É só responder este e-mail ou me chamar no WhatsApp.

Um abraço,
Rita e Eric — Multi Trip`,
  };
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  // Autenticação — aceita admin ou cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isAdmin = await getIsAdmin().catch(() => false);
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isAdmin && !isCron) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });

  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  if (campaign.status !== "sent") return NextResponse.json({ error: "Campanha ainda não foi enviada." }, { status: 409 });
  if (!campaign.recipientsJson) return NextResponse.json({ error: "Sem lista de destinatários registrada." }, { status: 400 });

  type Recipient = { email: string; name?: string; status: string };
  const originalRecipients: Recipient[] = JSON.parse(campaign.recipientsJson);
  // Só re-envia para quem recebeu com sucesso
  const targets = originalRecipients.filter((r) => r.status === "sent");

  if (targets.length === 0) {
    return NextResponse.json({ error: "Nenhum destinatário elegível para follow-up." }, { status: 400 });
  }

  const { subject, body } = buildFollowupBody(campaign.title);

  let sent = 0;
  let failed = 0;
  const log: { email: string; name?: string; status: "sent" | "failed" }[] = [];

  for (const r of targets) {
    const firstName = r.name?.split(" ")[0];
    const html = buildEmailHtml({
      title: subject,
      body,
      ctaText: "Falar com Rita e Eric",
      ctaUrl: "https://wa.me/5551989129376",
      firstName,
      footerNote: "Você está recebendo este e-mail porque identificamos sua agência como parceira estratégica potencial da Multi Trip na Serra Gaúcha.",
      unsubscribeHref: unsubscribeUrl(r.email),
      hideSignature: false,
    });

    try {
      const result = await sendMarketingEmail({ to: r.email, subject, html });
      if (result.error) {
        failed++;
        log.push({ email: r.email, name: r.name, status: "failed" });
      } else {
        sent++;
        log.push({ email: r.email, name: r.name, status: "sent" });
      }
    } catch {
      failed++;
      log.push({ email: r.email, name: r.name, status: "failed" });
    }
  }

  await prisma.emailCampaign.update({
    where: { id },
    data: {
      followupSentAt: new Date(),
      followupCount: { increment: 1 },
      followupSubject: subject,
      followupRecipientsJson: JSON.stringify(log),
    },
  });

  return NextResponse.json({ ok: true, sent, failed, total: targets.length });
}
