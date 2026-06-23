import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import { gerarNumeroPedido } from "../../../lib/pedido";

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

  return redirect(`/admin/reservas/${id}`, 302);
};
