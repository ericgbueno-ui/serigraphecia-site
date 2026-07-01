import type { APIRoute } from "astro";
import { getIsAdmin, getCurrentUser, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import { avancarEtapa, ETAPAS_PRODUCAO, type EtapaProducao } from "../../../lib/producao";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const currentUser = getCurrentUser(cookieVal);
  const formData = await request.formData();
  const ordemId = formData.get("ordemId")?.toString() || "";
  const etapa = formData.get("etapa")?.toString() as EtapaProducao;
  const observacoes = formData.get("observacoes")?.toString() || undefined;

  if (ordemId && ETAPAS_PRODUCAO.includes(etapa)) {
    await avancarEtapa(prisma, ordemId, etapa, {
      responsavelId: currentUser?.sub ?? null,
      observacoes,
    });
  }

  return redirect("/admin/producao", 302);
};
