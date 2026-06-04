import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getIsAdmin())) redirect("/admin");
  const { id } = await params;
  redirect(`/admin/conversas?id=${id}`);
}
