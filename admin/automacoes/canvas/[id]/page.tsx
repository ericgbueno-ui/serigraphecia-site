import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";
import CanvasEditor from "./CanvasEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CanvasPage({ params }: Props) {
  if (!(await getIsAdmin())) redirect("/admin");

  const { id } = await params;

  const flow = await prisma.automationFlow.findUnique({ where: { id } });
  if (!flow) notFound();

  return <CanvasEditor flow={flow as never} />;
}
