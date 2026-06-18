// POST /api/admin/email/preview — renderiza preview sem salvar campanha
import { NextRequest, NextResponse } from "next/server";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { buildEmailHtml } from "@/lib/resend";
import { unsubscribeUrl } from "@/lib/unsubscribe";

export async function POST(req: NextRequest) {
  if (!(await getIsAdmin()))
    return new NextResponse("Acesso negado.", { status: 403 });

  const { subject, body, ctaText, ctaUrl, audience } = await req.json();

  const html = buildEmailHtml({
    title: subject || "Prévia do E-mail",
    body: body || "(corpo vazio)",
    ctaText: ctaText || undefined,
    ctaUrl: ctaUrl || undefined,
    firstName: "Parceiro",
    footerNote: audience === "b2b"
      ? "Você está recebendo este e-mail porque identificamos sua agência como parceira estratégica potencial da Multi Trip na Serra Gaúcha."
      : undefined,
    unsubscribeHref: unsubscribeUrl("atendimento@multitrip.com.br"),
    hideSignature: audience === "b2b",
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
