import type { APIRoute } from "astro";
import { createAdminToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_TTL } from "../../../lib/server/adminAuth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const password = formData.get("password")?.toString() ?? "";
  const secret = process.env.ADMIN_PASSWORD ?? "";

  if (secret && password) {
    try {
      const crypto = await import("crypto");
      const a = Buffer.from(password.padEnd(64, "\0"), "utf-8").subarray(0, 64);
      const b = Buffer.from(secret.padEnd(64, "\0"), "utf-8").subarray(0, 64);
      const match = crypto.timingSafeEqual(a, b) && password === secret;

      if (match) {
        cookies.set(ADMIN_COOKIE_NAME, createAdminToken(secret), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: ADMIN_COOKIE_TTL,
          path: "/",
        });
        return redirect("/admin/painel", 302);
      }
    } catch {
      // fall through to error redirect
    }
  }

  return redirect("/admin?error=1", 302);
};
