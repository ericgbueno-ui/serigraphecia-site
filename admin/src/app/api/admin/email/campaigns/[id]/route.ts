// GET    /api/admin/email/campaigns/[id] — detalhes + destinatários
// DELETE /api/admin/email/campaigns/[id] — remove campanha (qualquer status)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await ctx.params;
  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: "Não encontrada." }, { status: 404 });

  const recipients = campaign.recipientsJson
    ? (JSON.parse(campaign.recipientsJson) as { email: string; name?: string; status: string }[])
    : [];

  return NextResponse.json({ campaign, recipients });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await ctx.params;

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: "Não encontrada." }, { status: 404 });

  await prisma.emailCampaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
