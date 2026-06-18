// GET  /api/admin/email/campaigns       — lista todas
// POST /api/admin/email/campaigns       — cria nova (draft)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";

export async function GET() {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const campaigns = await prisma.emailCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json();
  const { title, subject, body: emailBody, ctaText, ctaUrl, audience, manualEmails } = body;

  if (!title || !subject || !emailBody || !audience)
    return NextResponse.json({ error: "Campos obrigatórios: title, subject, body, audience." }, { status: 400 });

  const campaign = await prisma.emailCampaign.create({
    data: {
      title,
      subject,
      body: emailBody,
      ctaText: ctaText || null,
      ctaUrl: ctaUrl || null,
      audience,
      manualEmails: manualEmails || null,
      status: "draft",
    },
  });

  return NextResponse.json({ campaign });
}
