import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";
import AutomacaoClient from "./AutomacaoClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AutomacaoPage({ params }: Props) {
  if (!(await getIsAdmin())) redirect("/admin");

  const { id } = await params;

  const flow = await prisma.automationFlow.findUnique({
    where: { id },
    include: {
      runs: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          status: true,
          createdAt: true,
          completedAt: true,
          logs: true,
          error: true,
          inputData: true,
        },
      },
    },
  });

  if (!flow) notFound();

  return <AutomacaoClient flow={flow as never} />;
}
