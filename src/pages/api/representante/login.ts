import type { APIRoute } from "astro";
import { prisma } from "../../../lib/prisma";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const code     = formData.get("code")?.toString().trim().toUpperCase() || "";
  const password = formData.get("password")?.toString() || "";

  if (!code || !password) return redirect("/representante?error=1", 302);

  const rep = await prisma.affiliate.findUnique({ where: { code } });
  if (!rep || !rep.active) return redirect("/representante?error=1", 302);

  const hashed = crypto.createHash("sha256").update(password).digest("hex");
  if (hashed !== rep.password) return redirect("/representante?error=1", 302);

  const secret = process.env.JWT_SECRET || "fallback_secret";
  const token  = jwt.sign({ id: rep.id, code: rep.code }, secret, { expiresIn: "8h" });

  cookies.set("rep_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return redirect("/representante/painel", 302);
};
