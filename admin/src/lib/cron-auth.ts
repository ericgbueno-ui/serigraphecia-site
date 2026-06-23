import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Compara duas strings em tempo constante, evitando timing attacks.
 * Faz fallback seguro (false) quando os tamanhos diferem, sem expor
 * o tamanho do segredo através do tempo de execução de forma útil
 * (a checagem de tamanho não depende do conteúdo do segredo).
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf-8");
  const bBuf = Buffer.from(b, "utf-8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

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

  if (!secret || !auth || !timingSafeStringEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
