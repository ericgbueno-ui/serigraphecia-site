// GET /api/admin/email/campaigns/[id]/preview — retorna HTML renderizado da campanha
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { buildEmailHtml } from "@/lib/resend";
import { unsubscribeUrl } from "@/lib/unsubscribe";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await getIsAdmin()))
    return new NextResponse("Acesso negado.", { status: 403 });

  const { id } = await ctx.params;
  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return new NextResponse("Não encontrada.", { status: 404 });

  const html = buildEmailHtml({
    title: campaign.subject,
    body: campaign.body,
    ctaText: campaign.ctaText ?? undefined,
    ctaUrl: campaign.ctaUrl ?? undefined,
    firstName: "Parceiro",
    footerNote: campaign.audience === "b2b"
      ? "Você está recebendo este e-mail porque identificamos sua agência como parceira estratégica potencial da Multi Trip na Serra Gaúcha."
      : undefined,
    unsubscribeHref: unsubscribeUrl("atendimento@multitrip.com.br"),
    hideSignature: campaign.audience === "b2b",
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
