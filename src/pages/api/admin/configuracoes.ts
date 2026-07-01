import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import { definirConfiguracao, CHAVE_GATILHO_BAIXA_ESTOQUE } from "../../../lib/server/configuracao";

export const prerender = false;

const VALORES_VALIDOS = ["criacao", "confirmacao", "producao"];

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const formData = await request.formData();
  const gatilho = formData.get("gatilhoBaixaEstoque")?.toString() || "criacao";

  if (VALORES_VALIDOS.includes(gatilho)) {
    await definirConfiguracao(
      prisma,
      CHAVE_GATILHO_BAIXA_ESTOQUE,
      gatilho,
      "Em que momento o estoque é baixado: criacao | confirmacao | producao"
    );
  }

  return redirect("/admin/configuracoes?ok=1", 302);
};
