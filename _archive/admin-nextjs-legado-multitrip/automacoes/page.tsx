import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";
import AutomacoesClient from "./AutomacoesClient";

export const dynamic = "force-dynamic";

export default async function AutomacoesPage() {
  if (!(await getIsAdmin())) redirect("/admin");

  const flows = await prisma.automationFlow.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { runs: true } },
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, createdAt: true },
      },
    },
  });

  const stats = {
    total: flows.length,
    active: flows.filter((f) => f.active).length,
    totalRuns: flows.reduce((acc, f) => acc + f._count.runs, 0),
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text)" }}>
            ⚡ Automações
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
            Motor de fluxos integrado — sem mensalidade, sem dependência externa.
          </p>
        </div>
        <Link
          href="/admin/automacoes/novo"
          style={{
            background: "var(--gold)",
            color: "#000",
            padding: "10px 20px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          + Novo fluxo
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Fluxos", value: stats.total, icon: "🔄" },
          { label: "Ativos", value: stats.active, icon: "✅" },
          { label: "Execuções", value: stats.totalRuns, icon: "▶️" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "16px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <AutomacoesClient flows={flows as never} />
    </div>
  );
}
