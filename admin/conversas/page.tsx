import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { redirect } from "next/navigation";
import ConversasClient from "./ConversasClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conversas | Admin",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Conversas",
  },
};

export default async function ConversasPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  if (!(await getIsAdmin())) redirect("/admin");

  const { id } = await searchParams;

  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    take: 300,
    select: {
      id: true,
      name: true,
      whatsapp: true,
      status: true,
      score: true,
      updatedAt: true,
      valueCents: true,
      interactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { role: true, content: true, createdAt: true },
      },
    },
  });

  const [selectedLead, interactions] = await Promise.all([
    id ? prisma.lead.findUnique({ where: { id } }) : null,
    id
      ? prisma.interaction.findMany({
          where: { leadId: id },
          orderBy: { createdAt: "asc" },
        })
      : [],
  ]);

  const booking =
    selectedLead?.whatsapp
      ? await prisma.booking.findFirst({
          where: { customer: { phone: selectedLead.whatsapp } },
          select: { id: true, status: true, idaDate: true },
          orderBy: { createdAt: "desc" },
        })
      : null;

  return (
    <ConversasClient
      leads={leads as any}
      selectedId={id ?? null}
      selectedLead={selectedLead as any}
      interactions={interactions as any}
      booking={booking as any}
    />
  );
}
