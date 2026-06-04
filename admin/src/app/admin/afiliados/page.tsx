import { requireAdmin } from "@/lib/server/adminAuth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AffiliateManager } from "./AffiliateManager";
import { CopyLinkButton } from "./CopyLinkButton";

export const dynamic = "force-dynamic";

async function getAffiliatesData() {
  const affiliates = await prisma.affiliate.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      code: true,
      active: true,
      type: true,
      commIda: true,
      commIdaVolta: true,
      createdAt: true,
      payments: {
        orderBy: { createdAt: "desc" },
        select: { id: true, amountCents: true, note: true, createdAt: true },
      },
      _count: {
        select: { payments: true },
      },
    },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      affiliateCode: { in: affiliates.map((a) => a.code) },
      status: { notIn: ["CANCELLED", "PENDING"] },
    },
    select: {
      affiliateCode: true,
      commissionCents: true,
    },
  });

  const bookingsByAffiliate = bookings.reduce(
    (acc, booking) => {
      if (!booking.affiliateCode) return acc;
      if (!acc[booking.affiliateCode]) {
        acc[booking.affiliateCode] = [];
      }
      acc[booking.affiliateCode].push(booking);
      return acc;
    },
    {} as Record<string, typeof bookings>
  );

  return affiliates.map((affiliate) => {
    const affiliateBookings = bookingsByAffiliate[affiliate.code] || [];
    const totalCommission = affiliateBookings.reduce((sum, b) => sum + (b.commissionCents || 0), 0);
    const totalPaid = affiliate.payments.reduce((sum, p) => sum + p.amountCents, 0);
    const balance = totalCommission - totalPaid;

    return {
      ...affiliate,
      totalComm: totalCommission,
      paidComm: totalPaid,
      pendingComm: balance,
    };
  });
}

export default async function AdminAfiliadosPage() {
  await requireAdmin();

  const affiliatesData = await getAffiliatesData();

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Afiliados</h1>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
              Gerencie parceiros, comissões e pagamentos.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <CopyLinkButton />
            <Link
              href="/admin/afiliados/novo"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "var(--gold)",
                color: "var(--bg)",
                padding: "10px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: "18px" }}>+</span> Adicionar Afiliado
            </Link>
          </div>
        </div>

        <AffiliateManager data={affiliatesData} />
      </div>
    </div>
  );
}
