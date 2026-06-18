import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/server/adminAuth";
import NovoFluxoClient from "./NovoFluxoClient";

export const dynamic = "force-dynamic";

export default async function NovoFluxoPage() {
  if (!(await getIsAdmin())) redirect("/admin");
  return (
    <div style={{ padding: "32px 24px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
        ⚡ Novo fluxo de automação
      </h1>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32 }}>
        Configure o gatilho e os passos que serão executados.
      </p>
      <NovoFluxoClient />
    </div>
  );
}
