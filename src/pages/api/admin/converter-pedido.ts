import type { APIRoute } from "astro";
import { getIsAdmin, getCurrentUser, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import { gerarNumeroPedido } from "../../../lib/pedido";
import { gerarOrdemProducao } from "../../../lib/producao";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const formData = await request.formData();
  const id = formData.get("id")?.toString() || "";

  if (!id) return redirect("/admin/leads", 302);

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    select: { numeroPedido: true },
  });
  const numeroPedido = pedido?.numeroPedido ?? await gerarNumeroPedido(prisma);

  await prisma.pedido.update({
    where: { id },
    data: {
      status: "CONFIRMED",
      numeroPedido,
    },
  });

  // Fase 4 — auditoria 2026-07-01: ao aprovar/confirmar o pedido, gera
  // automaticamente a Ordem de Produção vinculada (nunca bloqueia a
  // confirmação caso algo dê errado aqui).
  await gerarOrdemProducao(prisma, id);

  return redirect(`/admin/reservas/${id}`, 302);
};
