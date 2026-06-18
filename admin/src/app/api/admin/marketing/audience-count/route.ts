// GET /api/admin/marketing/audience-count?audience=clientes|leads|ambos
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";

export async function GET(req: NextRequest) {
  if (!(await getIsAdmin())) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const audience = req.nextUrl.searchParams.get("audience") ?? "ambos";

  let count = 0;

  if (audience === "clientes" || audience === "ambos") {
    count += await prisma.customer.count();
  }
  if (audience === "leads" || audience === "ambos") {
    count += await prisma.lead.count();
  }

  return NextResponse.json({ count });
}
