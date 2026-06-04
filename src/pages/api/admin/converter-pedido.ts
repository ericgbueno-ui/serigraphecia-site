import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const formData = await request.formData();
  const id = formData.get("id")?.toString() || "";

  if (!id) return redirect("/admin/leads", 302);

  const count = await prisma.booking.count();
  const numeroPedido = `SG-${String(count).padStart(4, "0")}`;

  await prisma.booking.update({
    where: { id },
    data: { status: "CONFIRMED", numeroPedido },
  });

  return redirect(`/admin/reservas/${id}`, 302);
};
