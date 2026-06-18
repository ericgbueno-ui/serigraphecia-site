// GET  /api/admin/b2b/contacts   — lista contatos
// POST /api/admin/b2b/contacts   — cria contato
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";

export async function GET(req: NextRequest) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const state  = req.nextUrl.searchParams.get("state")  ?? undefined;

  const contacts = await prisma.b2bContact.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(state  ? { state  } : {}),
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json();
  const contact = await prisma.b2bContact.create({ data: body });
  return NextResponse.json({ contact });
}
