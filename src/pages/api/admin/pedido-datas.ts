import type { APIRoute } from "astro";
import { getIsAdmin, getCurrentUser, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import { registrarDiferencas } from "../../../lib/server/audit";

export const prerender = false;

// Campos de data editáveis nesta rota — cada alteração vira um registro em
// HistoricoAlteracao (Fase 2 da auditoria de 2026-07-01).
const CAMPOS_DATA = [
  "dataPedido",
  "dataPrevistaProducao",
  "dataPrevistaConclusao",
  "dataPrevistaEntrega",
  "dataEntregaReal",
] as const;

function parseDateInput(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T12:00:00-03:00`);
  return isNaN(d.getTime()) ? null : d;
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const currentUser = getCurrentUser(cookieVal); // null em sessão legada (senha geral)
  const formData = await request.formData();
  const pedidoId = formData.get("pedidoId")?.toString() || "";
  if (!pedidoId) return redirect("/admin/reservas", 302);

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido) return redirect("/admin/reservas", 302);

  const motivo = formData.get("motivo")?.toString().trim() || undefined;

  const antes: Record<string, unknown> = {};
  const depois: Record<string, unknown> = {};
  const updateData: Record<string, unknown> = {};

  for (const campo of CAMPOS_DATA) {
    const raw = formData.get(campo)?.toString() ?? null;
    if (raw === null) continue; // campo não enviado neste form = não mexer
    const novaData = raw === "" ? null : parseDateInput(raw);
    const valorAtual = (pedido as Record<string, unknown>)[campo] as Date | null;

    const antesISO = valorAtual ? new Date(valorAtual).toISOString() : null;
    const novoISO = novaData ? novaData.toISOString() : null;
    if (antesISO === novoISO) continue;

    antes[campo] = antesISO;
    depois[campo] = novoISO;
    updateData[campo] = novaData;
  }

  // Cancelamento é tratado à parte por exigir motivo obrigatório e nunca
  // remover o pedido — apenas marca a data/hora, o usuário e o motivo.
  const cancelar = formData.get("cancelar")?.toString() === "1";
  if (cancelar && !pedido.dataCancelamento) {
    updateData.dataCancelamento = new Date();
    updateData.motivoCancelamento = motivo || "Não informado";
    updateData.canceladoPorUserId = currentUser?.sub ?? null;
    updateData.status = "CANCELLED";

    antes.dataCancelamento = null;
    depois.dataCancelamento = (updateData.dataCancelamento as Date).toISOString();
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.pedido.update({ where: { id: pedidoId }, data: updateData });
    await registrarDiferencas(prisma, {
      entidade: "Pedido",
      entidadeId: pedidoId,
      antes,
      depois,
      userId: currentUser?.sub ?? null,
      motivo,
    });
  }

  return redirect(`/admin/reservas/${pedidoId}`, 302);
};
