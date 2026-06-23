import { requireAdmin } from "@/lib/server/adminAuth";
import AdminEquipeClient from "./AdminEquipeClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Equipe / Profissionais | Admin [NOME DO NEGÓCIO]",
  robots: { index: false, follow: false },
};

export default async function AdminEquipePage() {
  await requireAdmin();

  return <AdminEquipeClient />;
}
