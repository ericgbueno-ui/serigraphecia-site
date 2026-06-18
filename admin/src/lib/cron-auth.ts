import { NextRequest, NextResponse } from "next/server";

/**
 * Verifica se a requisição veio de um cron autorizado.
 * Retorna NextResponse 401 se não autorizado, ou null se OK.
 *
 * Compatível com:
 * - Vercel Cron (injeta Authorization: Bearer <CRON_SECRET> automaticamente)
 * - cron-job.org (configurar o header manualmente no dashboard)
 */
export function verifyCronAuth(req: NextRequest | Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  const auth = (req as NextRequest).headers?.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
