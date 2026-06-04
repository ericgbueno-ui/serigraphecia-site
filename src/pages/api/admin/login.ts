import type { APIRoute } from "astro";
import { createAdminToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_TTL } from "../../../lib/server/adminAuth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const password = formData.get("password")?.toString() ?? "";
  const secret = process.env.ADMIN_PASSWORD ?? "";

  if (password && password === secret) {
    cookies.set(ADMIN_COOKIE_NAME, createAdminToken(secret), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: ADMIN_COOKIE_TTL,
      path: "/",
    });
    return redirect("/admin/painel", 302);
  }

  return redirect("/admin?error=1", 302);
};
