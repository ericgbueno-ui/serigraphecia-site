import { requireAdmin } from "@/lib/server/adminAuth";
import Link from "next/link";
import { NewAffiliateForm } from "./NewAffiliateForm";

export const dynamic = "force-dynamic";

export default async function NovoAfiliadoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ maxWidth: "760px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
              Novo Representante
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
              Cadastre o parceiro, defina o tipo, código de indicação e as comissões padrão.
            </p>
          </div>
          <Link
            href="/admin/representantes"
            style={{
              color: "var(--muted)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            ← Voltar
          </Link>
        </div>

        <NewAffiliateForm error={params.error} />
      </div>
    </div>
  );
}
