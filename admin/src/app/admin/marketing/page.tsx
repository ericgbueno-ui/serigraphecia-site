import { requireAdmin } from "@/lib/server/adminAuth";
import MarketingHub from "./MarketingHub";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketing | Admin Multi Trip",
  robots: { index: false, follow: false },
};

export default async function MarketingPage() {
  await requireAdmin();
  return <MarketingHub />;
}
