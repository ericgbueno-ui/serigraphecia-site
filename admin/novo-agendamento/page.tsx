import { requireAdmin } from "@/lib/server/adminAuth";
import { prisma } from "@/lib/db";
import { NovoAgendamentoForm } from "./NovoAgendamentoForm";
import { createManualBooking } from "./actions";

export default async function NovaReservaPage() {
  await requireAdmin();

  const affiliates = await prisma.affiliate.findMany({
    where: { active: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ maxWidth: "900px" }}>
        <div style={{ marginBottom: "28px" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--muted)",
              marginBottom: "6px",
            }}
          >
            Admin · Novo Contrato
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)" }}>
            ＋ Novo Contrato
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
            Crie um contrato manual para um cliente.
          </p>
        </div>
        <NovoAgendamentoForm action={createManualBooking} affiliates={affiliates} />
      </div>
    </div>
  );
}
