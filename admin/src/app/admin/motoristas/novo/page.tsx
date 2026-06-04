import { requireAdmin } from "@/lib/server/adminAuth";
import NovoMotoristaClient from "./NovoMotoristaClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cadastrar Motorista | Admin Multi Trip",
  robots: { index: false, follow: false },
};

export default async function NovoMotoristaPage() {
  await requireAdmin();

  return <NovoMotoristaClient />;
}
