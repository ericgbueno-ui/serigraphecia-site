import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";
import LeadsClient from "./LeadsClient";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  if (!(await getIsAdmin())) redirect("/admin");
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const statusFilter = params.status ?? undefined;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const perPage = 50;

  const whereClause = {
    ...(statusFilter ? { status: statusFilter } : {})
  };

  const [leads, total, stats, confirmedBookings, allLeadDates, sourceStats] = await Promise.all([
    prisma.lead.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        interactions: { orderBy: { createdAt: "desc" }, take: 3 },
        events: { orderBy: { createdAt: "desc" }, take: 2 },
      },
    }),
    prisma.lead.count({ where: whereClause }),
    prisma.lead.groupBy({
      by: ["status"],
      where: whereClause,
      _count: { status: true },
    }),
    // Telefones de todas as reservas confirmadas para o badge automático
    prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      select: { customer: { select: { phone: true } } },
    }),
    // Datas de todos os leads para breakdown mensal (sem paginação)
    prisma.lead.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    // Breakdown por origem/source
    prisma.lead.groupBy({
      by: ["source"],
      _count: { source: true },
      orderBy: { _count: { source: "desc" } },
    }),
  ]);

  const statMap: Record<string, number> = {};
  for (const s of stats) {
    statMap[s.status] = s._count.status;
  }

  // Normaliza telefones das reservas confirmadas (apenas dígitos)
  const convertedPhones = confirmedBookings
    .map((b) => b.customer?.phone?.replace(/\D/g, "") ?? "")
    .filter(Boolean);

  // Agrupa leads por mês
  const monthlyMap: Record<string, number> = {};
  for (const l of allLeadDates) {
    const d = new Date(l.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = (monthlyMap[key] ?? 0) + 1;
  }
  const monthlyStats = Object.entries(monthlyMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, count]) => ({ month, count }));

  const sourceBreakdown = sourceStats.map((s) => ({
    source: s.source ?? "desconhecido",
    count: s._count.source,
  }));

  return (
    <LeadsClient
      leads={leads as any}
      total={total}
      page={page}
      perPage={perPage}
      statusFilter={statusFilter}
      statMap={statMap}
      convertedPhones={convertedPhones}
      monthlyStats={monthlyStats}
      totalAllLeads={allLeadDates.length}
      sourceBreakdown={sourceBreakdown}
    />
  );
}
