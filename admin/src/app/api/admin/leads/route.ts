/**
 * GET /api/admin/leads
 * Retorna lista de leads com score, status e interações recentes.
 * Protegido por cookie de admin.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const parsedPage = parseInt(searchParams.get("page") ?? "1", 10);
  const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
  const perPage = 50;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where: status ? { status } : undefined,
      orderBy: { score: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        interactions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    }),
    prisma.lead.count({ where: status ? { status } : undefined }),
  ]);

  return NextResponse.json({ leads, total, page, perPage });
}
