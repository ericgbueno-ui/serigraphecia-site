import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import crypto from "crypto";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const formData = await request.formData();
  const name       = formData.get("name")?.toString().trim() || "";
  const whatsapp   = formData.get("whatsapp")?.toString().replace(/\D/g, "") || "";
  const email      = formData.get("email")?.toString().trim() || "";
  const code       = formData.get("code")?.toString().trim().toUpperCase() || "";
  const password   = formData.get("password")?.toString() || "";
  const pctRaw     = formData.get("comissaoPct")?.toString().replace(",", ".") || "0";
  const comissaoPct = parseFloat(pctRaw);

  if (!name || !whatsapp || !email || !code || !password) {
    return redirect("/admin/representantes/novo?error=campos", 302);
  }

  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

  try {
    await prisma.affiliate.create({
      data: {
        name,
        whatsapp,
        email,
        code,
        password: hashedPassword,
        type: "representante",
        commIda: 0,
        commIdaVolta: 0,
        comissaoPct,
        active: true,
      },
    });
    return redirect("/admin/afiliados", 302);
  } catch (err) {
    console.error("Erro ao criar representante:", err);
    return redirect("/admin/representantes/novo?error=1", 302);
  }
};
