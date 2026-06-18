import { requireAdmin } from "@/lib/server/adminAuth";
import EmailClient from "./EmailClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "E-mail Marketing | Admin Multi Trip",
  robots: { index: false, follow: false },
};

export default async function EmailPage() {
  await requireAdmin();
  return <EmailClient />;
}
