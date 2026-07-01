"use server";

import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateLeadStatus(id: string, status: string) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");
  await prisma.lead.update({ where: { id }, data: { status } });
  revalidatePath("/admin/conversas");
}

export async function deleteLeadFromConversas(id: string) {
  if (!(await getIsAdmin())) throw new Error("Acesso negado.");
  await prisma.interaction.deleteMany({ where: { leadId: id } });
  await prisma.leadEvent.deleteMany({ where: { leadId: id } });
  await prisma.lead.delete({ where: { id } });
  redirect("/admin/conversas");
}
