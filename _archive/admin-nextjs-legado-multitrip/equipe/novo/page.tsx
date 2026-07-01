import { requireAdmin } from "@/lib/server/adminAuth";
import NovoProfissionalClient from "./NovoProfissionalClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cadastrar Profissional | Admin [NOME DO NEGÓCIO]",
  robots: { index: false, follow: false },
};

export default async function NovoProfissionalPage() {
  await requireAdmin();

  return <NovoProfissionalClient />;
}
