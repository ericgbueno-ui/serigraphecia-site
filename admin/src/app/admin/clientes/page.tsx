import { requireAdmin } from "@/lib/server/adminAuth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ClientesClient } from "./ClientesClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Clientes Recorrentes | Admin Multi Trip",
  robots: { index: false, follow: false },
};

export default async function ClientesPage() {
  await requireAdmin();

  // Buscar afiliados para mapear nomes e IDs
  const affiliates = await prisma.affiliate.findMany({
    select: { id: true, name: true, code: true },
  });

  const affiliateMap = new Map<string, { id: string; name: string }>();
  for (const aff of affiliates) {
    if (aff.code) {
      affiliateMap.set(aff.code.toUpperCase(), { id: aff.id, name: aff.name });
      affiliateMap.set(aff.code.toLowerCase(), { id: aff.id, name: aff.name });
    }
  }

  // Agrupa reservas por cliente
  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED" },
    select: {
      id: true,
      totalCents: true,
      createdAt: true,
      tripType: true,
      vehicleType: true,
      idaDate: true,
      affiliateCode: true,
      customer: { select: { id: true, name: true, phone: true, email: true, birthDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const bookingsWithAffiliate = bookings.map((b) => {
    const aff = b.affiliateCode ? affiliateMap.get(b.affiliateCode) || affiliateMap.get(b.affiliateCode.toLowerCase()) || affiliateMap.get(b.affiliateCode.toUpperCase()) : null;
    return {
      ...b,
      affiliateName: aff ? aff.name : null,
      affiliateId: aff ? aff.id : null,
    };
  });

  // Agrupa por cliente
  const customerMap = new Map<
    string,
    {
      customer: (typeof bookings)[0]["customer"];
      bookings: typeof bookingsWithAffiliate;
      totalCents: number;
    }
  >();

  for (const b of bookingsWithAffiliate) {
    const id = b.customer.id;
    if (!customerMap.has(id)) {
      customerMap.set(id, { customer: b.customer, bookings: [], totalCents: 0 });
    }
    const entry = customerMap.get(id)!;
    entry.bookings.push(b);
    entry.totalCents += b.totalCents;
  }

  // Convert map to array
  const customers = [...customerMap.values()];

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, color: "var(--text)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <Link href="/admin" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
          ← Admin
        </Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>🤎 Clientes Recorrentes</h1>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            Lifetime value, classificação e histórico de viagens.
          </p>
        </div>
      </div>

      <ClientesClient initialCustomers={customers as any} />
    </div>
  );
}
