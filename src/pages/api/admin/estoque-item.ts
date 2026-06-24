import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const formData = await request.formData();
  const tipo = formData.get("tipo")?.toString().trim() || "";
  const tamanho = formData.get("tamanho")?.toString().trim() || null;
  const gramatura = formData.get("gramatura")?.toString().trim() || null;
  const cor = formData.get("cor")?.toString().trim() || null;
  const quantidade = parseFloat(formData.get("quantidade")?.toString() || "0");
  const minimo = parseFloat(formData.get("minimo")?.toString() || "0");

  if (!tipo || isNaN(quantidade)) {
    return redirect("/admin/estoque/novo?error=1", 302);
  }

  const partesNome = [tipo, tamanho, gramatura ? `${gramatura}g` : null, cor].filter(Boolean);

  try {
    await prisma.estoque.create({
      data: {
        produto: partesNome.join(" "),
        tipo,
        tamanho,
        gramatura,
        cor,
        quantidade,
        unidade: "un",
        minimo: isNaN(minimo) ? 0 : minimo,
      },
    });
    return redirect("/admin/estoque", 302);
  } catch (err) {
    console.error("Erro ao criar item de estoque:", err);
    return redirect("/admin/estoque/novo?error=1", 302);
  }
};
