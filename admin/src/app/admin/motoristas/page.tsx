import { requireAdmin } from "@/lib/server/adminAuth";
import AdminMotoristasClient from "./AdminMotoristasClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão da Frota | Admin Multi Trip",
  robots: { index: false, follow: false },
};

export default async function AdminMotoristasPage() {
  await requireAdmin();

  return <AdminMotoristasClient />;
}
