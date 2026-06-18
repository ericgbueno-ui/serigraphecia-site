import { requireAdmin } from "@/lib/server/adminAuth";
import B2bClient from "./B2bClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CRM B2B | Admin Multi Trip",
  robots: { index: false, follow: false },
};

export default async function B2bPage() {
  await requireAdmin();
  return <B2bClient />;
}
