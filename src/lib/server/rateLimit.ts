import type { PrismaClient } from "@prisma/client";

/**
 * Rate limit de login baseado em banco de dados (funciona corretamente em
 * ambiente serverless/Vercel, onde memória em processo não é compartilhada
 * entre instâncias).
 *
 * Regra: no máximo MAX_ATTEMPTS tentativas com falha por IP nos últimos
 * WINDOW_MINUTES minutos. Login com sucesso não conta contra o limite.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function isLoginRateLimited(
  prisma: PrismaClient,
  ip: string
): Promise<boolean> {
  if (!ip) return false;
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  try {
    const failedCount = await prisma.loginAttempt.count({
      where: { ip, success: false, createdAt: { gte: since } },
    });
    return failedCount >= MAX_ATTEMPTS;
  } catch (err) {
    // Importante: se a tabela LoginAttempt ainda não existir no banco (ex:
    // antes da migration desta auditoria ser aplicada), o login NUNCA pode
    // quebrar por causa disso — apenas o rate limit fica temporariamente
    // inativo até a migration rodar.
    console.error("Rate limit indisponível (login segue liberado):", err);
    return false;
  }
}

export async function recordLoginAttempt(
  prisma: PrismaClient,
  params: { ip: string; email?: string | null; success: boolean; userId?: string | null }
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        ip: params.ip || "unknown",
        email: params.email || null,
        success: params.success,
        userId: params.userId || null,
      },
    });
  } catch (err) {
    // Nunca deixar o registro de auditoria derrubar o login.
    console.error("Erro ao registrar tentativa de login:", err);
  }
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export const RATE_LIMIT_WINDOW_MINUTES = WINDOW_MINUTES;
export const RATE_LIMIT_MAX_ATTEMPTS = MAX_ATTEMPTS;
