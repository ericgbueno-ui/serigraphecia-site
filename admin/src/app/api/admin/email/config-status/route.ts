// GET /api/admin/email/config-status — verifica se Resend está configurado
import { NextResponse } from "next/server";
import { getIsAdmin } from "@/lib/server/adminAuth";

export async function GET() {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  return NextResponse.json({
    ready: Boolean(apiKey && fromEmail),
    missing: [
      ...(!apiKey ? ["RESEND_API_KEY"] : []),
      ...(!fromEmail ? ["RESEND_FROM_EMAIL"] : []),
    ],
  });
}
