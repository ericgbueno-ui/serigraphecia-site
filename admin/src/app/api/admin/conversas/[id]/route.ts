import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getIsAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const [lead, interactions, booking] = await Promise.all([
    prisma.lead.findUnique({ where: { id } }),
    prisma.interaction.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.booking.findFirst({
      where: { customer: { phone: { not: "" } } },
      select: { id: true, status: true, idaDate: true, customer: { select: { phone: true } } },
      orderBy: { createdAt: "desc" },
    }).then(() => null), // placeholder — buscamos abaixo com phone correto
  ]);

  const leadBooking = lead?.whatsapp
    ? await prisma.booking.findFirst({
        where: { customer: { phone: lead.whatsapp } },
        select: { id: true, status: true, idaDate: true },
        orderBy: { createdAt: "desc" },
      })
    : null;

  return NextResponse.json({ lead, interactions, booking: leadBooking });
}
