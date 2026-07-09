import type { APIRoute } from "astro";
import { getIsAdmin, getCurrentUser, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import { registrarHistorico } from "../../../lib/server/audit";

export const prerender = false;

/**
 * Desativa (ativo:false) as faixas de TabelaPreco de uma combinação
 * modelo+tamanho+gramatura específica — usado pela auditoria de gramaturas
 * para remover entradas redundantes (ex: gramatura em formato de intervalo
 * "0,04-0,06" quando já existe uma faixa com gramatura específica "0,06"
 * para o mesmo tamanho). Nunca apaga de verdade, só desativa — reversível.
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const currentUser = getCurrentUser(cookieVal);
  const formData = await request.formData();
  const modeloId = formData.get("modeloId")?.toString() || null;
  const tipoPrefixo = formData.get("tipoPrefixo")?.toString() || null;
  const tamanho = formData.get("tamanho")?.toString() || "";
  const gramatura = formData.get("gramatura")?.toString() || "";

  if (tamanho && gramatura) {
    const where = modeloId
      ? { modeloId, tamanho, gramatura, ativo: true }
      : { tipo: tipoPrefixo ?? undefined, tamanho, gramatura, ativo: true };

    const faixas = await prisma.tabelaPreco.findMany({ where });

    for (const f of faixas) {
      await prisma.tabelaPreco.update({
        where: { id: f.id },
        data: { ativo: false },
      });
      await registrarHistorico(prisma, {
        entidade: "TabelaPreco",
        entidadeId: f.id,
        campo: "ativo",
        valorAnterior: "true",
        valorNovo: "false",
        userId: currentUser?.sub ?? null,
        motivo: `Auditoria de gramaturas: desativada gramatura redundante "${gramatura}" (tamanho ${tamanho})`,
      });
    }
  }

  return redirect("/admin/auditoria-gramaturas", 302);
};
