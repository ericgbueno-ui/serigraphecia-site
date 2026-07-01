import crypto from "crypto";
import type { APIRoute } from "astro";
import {
  createAdminToken,
  createUserToken,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_TTL,
} from "../../../lib/server/adminAuth";
import { verifyPassword } from "../../../lib/server/passwords";
import { isLoginRateLimited, recordLoginAttempt, getClientIp } from "../../../lib/server/rateLimit";
import { prisma } from "../../../lib/prisma";

export const prerender = false;

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Mantém tempo constante mesmo com tamanhos diferentes (hash cobre o comprimento).
  const hashA = crypto.createHash("sha256").update(bufA).digest();
  const hashB = crypto.createHash("sha256").update(bufB).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const ip = getClientIp(request);

  // Rate limit: no máximo 5 tentativas com falha por IP a cada 15 minutos.
  // (Fail-open automático se a tabela LoginAttempt ainda não existir no banco.)
  if (await isLoginRateLimited(prisma, ip)) {
    return redirect("/admin?error=rate_limit", 302);
  }

  const formData = await request.formData();
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  // ── Caminho novo: login individual por e-mail + senha ──────────────────
  if (email) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (user && user.active && verifyPassword(password, user.passwordHash)) {
        await recordLoginAttempt(prisma, { ip, email, success: true, userId: user.id });
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        const token = createUserToken({ sub: user.id, email: user.email, name: user.name, role: user.role });
        cookies.set(ADMIN_COOKIE_NAME, token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: ADMIN_COOKIE_TTL,
          path: "/",
        });
        return redirect("/admin/painel", 302);
      }

      await recordLoginAttempt(prisma, { ip, email, success: false });
      return redirect("/admin?error=1", 302);
    } catch (err) {
      // Se a tabela User ainda não existir (migration da Fase 1 ainda não
      // aplicada), não derrubar o login com erro 500 — cair para o caminho
      // legado abaixo, tratando como se e-mail não tivesse sido informado.
      console.error("Login por usuário indisponível, caindo para senha geral:", err);
    }
  }

  // ── Caminho legado: senha única compartilhada (em fase de descontinuação) ──
  // Mantido apenas para não travar o acesso da equipe antes de todos terem
  // uma conta individual criada (ver scripts/create-first-user.mjs).
  const secret = process.env.ADMIN_PASSWORD ?? "";

  if (password && secret && timingSafeStringEqual(password, secret)) {
    await recordLoginAttempt(prisma, { ip, email: null, success: true });
    cookies.set(ADMIN_COOKIE_NAME, createAdminToken(secret), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ADMIN_COOKIE_TTL,
      path: "/",
    });
    return redirect("/admin/painel", 302);
  }

  await recordLoginAttempt(prisma, { ip, email: null, success: false });
  return redirect("/admin?error=1", 302);
};
