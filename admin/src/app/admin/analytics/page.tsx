import { requireAdmin } from "@/lib/server/adminAuth";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics | Admin Multi Trip",
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  await requireAdmin();
  return <AnalyticsClient />;
}
