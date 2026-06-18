// PATCH /api/admin/b2b/contacts/[id] — atualiza status, whatsapp, notes
// DELETE /api/admin/b2b/contacts/[id] — remove contato
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await ctx.params;
  const data = await req.json();
  const contact = await prisma.b2bContact.update({ where: { id }, data });
  return NextResponse.json({ contact });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await ctx.params;
  await prisma.b2bContact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
