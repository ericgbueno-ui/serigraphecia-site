import { requireAdmin } from "@/lib/server/adminAuth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function tripLabel(t: string) {
  if (t === "so_citytour") return "Somente City Tour";
  if (t === "ida_volta") return "Chegada In + Retorno Out";
  if (t === "volta") return "Retorno Out";
  return "Chegada In";
}

function statusBadge(s: string) {
  if (s === "CONFIRMED") {
    return {
      label: "Confirmada",
      color: "#3ecf8e",
      bg: "rgba(62,207,142,0.1)",
      border: "rgba(62,207,142,0.25)",
    };
  }
  if (s === "CANCELLED") {
    return {
      label: "Cancelada",
      color: "#f87171",
      bg: "rgba(248,113,113,0.1)",
      border: "rgba(248,113,113,0.25)",
    };
  }
  return {
    label: "Pendente",
    color: "#c9a84c",
    bg: "rgba(201,168,76,0.1)",
    border: "rgba(201,168,76,0.3)",
  };
}

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "14px",
  padding: "20px 22px",
};

export default async function AffiliateCashPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      whatsapp: true,
      code: true,
      commIda: true,
      commIdaVolta: true,
      payments: {
        orderBy: { createdAt: "desc" },
        select: { id: true, amountCents: true, note: true, createdAt: true },
      },
    },
  });

  if (!affiliate) notFound();

  const bookings = await prisma.booking.findMany({
    where: {
      affiliateCode: { equals: affiliate.code, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      tripType: true,
      totalCents: true,
      commissionCents: true,
      customer: { select: { name: true, phone: true } },
    },
  });

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const pending = bookings.filter((b) => b.status === "PENDING");
  const cancelled = bookings.filter((b) => b.status === "CANCELLED");
  const totalCommission = confirmed.reduce((sum, b) => sum + (b.commissionCents || 0), 0);
  const paidCommission = affiliate.payments.reduce((sum, p) => sum + p.amountCents, 0);
  const pendingCommission = totalCommission - paidCommission;
  const affiliateLink = `https://multitrip.com.br/${affiliate.code.toLowerCase()}`;

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ maxWidth: "1180px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "28px",
            gap: "18px",
          }}
        >
          <div>
            <Link
              href="/admin/afiliados"
              style={{ color: "var(--muted)", fontSize: "13px", textDecoration: "none" }}
            >
              ← Afiliados
            </Link>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                marginTop: "12px",
                marginBottom: "4px",
              }}
            >
              Painel de Desempenho: {affiliate.name}
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
              Código: <strong style={{ color: "var(--gold)" }}>{affiliate.code}</strong> · WhatsApp:{" "}
              {affiliate.whatsapp}
            </p>
          </div>

          <a
            href={affiliateLink}
            target="_blank"
            rel="noreferrer"
            style={{
              background: "var(--gold-dim)",
              border: "1px solid var(--gold-line)",
              borderRadius: "12px",
              padding: "12px 16px",
              color: "var(--gold)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          >
            {affiliateLink.replace("https://", "")}
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Reservas",
              value: bookings.length.toString(),
              unit: "total",
              color: "var(--text)",
            },
            {
              label: "Confirmadas",
              value: confirmed.length.toString(),
              unit: "pagas",
              color: "#3ecf8e",
            },
            {
              label: "Pendentes",
              value: pending.length.toString(),
              unit: "em aberto",
              color: "#c9a84c",
            },
            {
              label: "Canceladas",
              value: cancelled.length.toString(),
              unit: "perdidas",
              color: "#f87171",
            },
            {
              label: "Comissão",
              value: brl(totalCommission),
              unit: "confirmada",
              color: "#3ecf8e",
            },
            {
              label: "Saldo",
              value: brl(pendingCommission),
              unit: `pago ${brl(paidCommission)}`,
              color: pendingCommission > 0 ? "#c9a84c" : "#3ecf8e",
            },
          ].map((item) => (
            <div key={item.label} style={card}>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                  marginBottom: "8px",
                }}
              >
                {item.label}
              </p>
              <p style={{ fontSize: "20px", fontWeight: 800, color: item.color, lineHeight: 1 }}>
                {item.value}
              </p>
              <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "5px" }}>
                {item.unit}
              </p>
            </div>
          ))}
        </div>

        <div style={{ ...card, padding: 0, overflow: "hidden", marginBottom: "24px" }}>
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 700 }}>Reservas do afiliado</h2>
              <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                Todas as reservas associadas ao código {affiliate.code}.
              </p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div
              style={{
                padding: "52px 24px",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "14px",
              }}
            >
              Nenhuma reserva associada a este afiliado ainda.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {["Data", "Cliente", "Serviço", "Valor", "Comissão", "Status", ""].map(
                      (h, i) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 16px",
                            textAlign: i >= 3 ? "right" : "left",
                            color: "var(--muted)",
                            fontSize: "10px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const badge = statusBadge(booking.status);
                    return (
                      <tr key={booking.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td
                          style={{
                            padding: "14px 16px",
                            color: "var(--muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(booking.createdAt)}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <p style={{ fontWeight: 700 }}>{booking.customer?.name || "Sem nome"}</p>
                          <p
                            style={{
                              color: "var(--muted)",
                              fontSize: "12px",
                              marginTop: "2px",
                            }}
                          >
                            {booking.customer?.phone || "—"}
                          </p>
                        </td>
                        <td style={{ padding: "14px 16px", color: "var(--muted)" }}>
                          {tripLabel(booking.tripType)}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700 }}>
                          {brl(booking.totalCents)}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            textAlign: "right",
                            color: "var(--gold)",
                            fontWeight: 700,
                          }}
                        >
                          {booking.commissionCents ? brl(booking.commissionCents) : "—"}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "4px 10px",
                              borderRadius: "999px",
                              color: badge.color,
                              background: badge.bg,
                              border: `1px solid ${badge.border}`,
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <Link
                            href={`/admin/reservas/${booking.id}`}
                            style={{
                              color: "var(--gold)",
                              textDecoration: "none",
                              fontWeight: 700,
                            }}
                          >
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {affiliate.payments.length > 0 && (
          <div style={card}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>
              Pagamentos de comissão
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {affiliate.payments.map((payment) => (
                <div
                  key={payment.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <span style={{ color: "var(--muted)", fontSize: "13px" }}>
                    {formatDate(payment.createdAt)} {payment.note ? `· ${payment.note}` : ""}
                  </span>
                  <strong style={{ color: "#3ecf8e" }}>{brl(payment.amountCents)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
