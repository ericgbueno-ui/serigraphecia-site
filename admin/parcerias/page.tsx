import { requireAdmin } from "@/lib/server/adminAuth";
import ParceriasClient from "./ParceriasClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Parcerias B2B | Admin [NOME DO NEGÓCIO]",
  robots: { index: false, follow: false },
};

export default async function B2bPage() {
  await requireAdmin();
  return <ParceriasClient />;
}
