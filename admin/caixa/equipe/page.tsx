import { requireAdmin } from "@/lib/server/adminAuth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { toBrtDateString } from "@/lib/meta-ads";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Relatório de Profissionais | Admin [NOME DO NEGÓCIO]",
  robots: { index: false, follow: false },
};

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getBookingDate(b: { publicToken?: string | null; createdAt: Date; idaDate?: Date | null; voltaDate?: Date | null }) {
  if (b.publicToken?.startsWith("hist_")) {
    return b.idaDate ?? b.voltaDate ?? b.createdAt;
  }
  return b.createdAt;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default async function AdminCaixaEquipePage() {
  await requireAdmin();

  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      publicToken: true,
      createdAt: true,
      idaDate: true,
      voltaDate: true,
      driverInName: true,
      driverOutName: true,
      driverCityTourName: true,
      optionalsJson: true,
      customer: { select: { name: true } },
    },
  });

  const today = toBrtDateString();
  const currentMonth = today.slice(0, 7);

  // Mapeamento e cálculo de todos os atendimentos
  const allDriversRides = bookings.map((b) => {
    let opts: Record<string, any> = {};
    try {
      opts = JSON.parse(b.optionalsJson ?? "{}");
    } catch {}

    const inPay = typeof opts._driverInPaymentCents === "number" ? opts._driverInPaymentCents : 0;
    const outPay = typeof opts._driverOutPaymentCents === "number" ? opts._driverOutPaymentCents : 0;
    const tourPay = typeof opts._driverCityTourPaymentCents === "number" ? opts._driverCityTourPaymentCents : 0;

    return {
      id: b.id,
      customerName: b.customer?.name ?? "—",
      createdAt: getBookingDate(b),
      driverInName: b.driverInName,
      driverOutName: b.driverOutName,
      driverCityTourName: b.driverCityTourName,
      inPayment: inPay,
      outPayment: outPay,
      cityTourPayment: tourPay,
      total: inPay + outPay + tourPay,
    };
  });

  // 1. Atendimentos Pagos (com gastos de profissional maiores que zero)
  const paidRides = allDriversRides
    .filter((r) => r.total > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 2. Atendimentos Pendentes (profissional designado mas custo zerado)
  const pendingRides = allDriversRides
    .filter((r) => {
      const hasDriver = !!r.driverInName || !!r.driverOutName || !!r.driverCityTourName;
      // Se tem profissional escalado em algum atendimento, mas o pagamento daquele segmento específico está zerado
      const hasPendingSegment =
        (!!r.driverInName && r.inPayment === 0) ||
        (!!r.driverOutName && r.outPayment === 0) ||
        (!!r.driverCityTourName && r.cityTourPayment === 0);

      return hasPendingSegment;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPagoGeral = paidRides.reduce((s, r) => s + r.total, 0);
  const totalPagoMes = paidRides
    .filter((r) => monthKey(new Date(r.createdAt)) === currentMonth)
    .reduce((s, r) => s + r.total, 0);

  return (
    <div className="caixa-page">
      <style>{`
        .caixa-page { padding: 32px 40px; color: var(--text); background: var(--bg); }
        .caixa-page > div { max-width: 1200px; margin: 0 auto; }
        .caixa-header { margin-bottom: 32px; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .caixa-title-block h1 { font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .caixa-title-block p { font-size: 13px; color: var(--muted); }
        .btn-voltar {
          font-size: 12px;
          color: var(--muted);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          transition: color 0.15s, border-color 0.15s;
        }
        .btn-voltar:hover {
          color: var(--text);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .driver-kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px; }
        .driver-kpi-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 24px;
        }
        .driver-kpi-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .driver-kpi-value { font-size: 24px; font-weight: 800; line-height: 1; }
        .driver-kpi-sub { font-size: 12px; color: var(--muted); margin-top: 6px; }
        
        .notice-box {
          background: rgba(167, 139, 250, 0.04);
          border: 1px solid rgba(167, 139, 250, 0.2);
          border-radius: 14px;
          padding: 18px 22px;
          margin-bottom: 32px;
          font-size: 13px;
          line-height: 1.5;
        }
        .notice-box strong { color: #a78bfa; }
        
        .section-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .report-table-wrapper {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 36px;
        }
        
        .report-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .report-table th {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.01);
        }
        .report-table td {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 13px;
          vertical-align: middle;
        }
        .report-table tr:last-child td {
          border-bottom: none;
        }
        .report-table tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }
        
        .customer-cell { display: flex; flex-direction: column; }
        .customer-name { font-weight: 600; color: var(--text); }
        .customer-date { font-size: 11px; color: var(--muted); margin-top: 2px; }
        
        .segment-cell { display: flex; flex-direction: column; gap: 2px; }
        .segment-driver { font-weight: 500; color: var(--text); }
        .segment-value { font-size: 12px; font-weight: 600; color: #f87171; }
        .segment-value.zero { color: var(--muted); font-weight: 400; }
        
        .total-cell { font-size: 14px; font-weight: 700; color: #f87171; }
        
        .btn-edit {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #3ecf8e;
          background: rgba(62, 207, 142, 0.06);
          border: 1px solid rgba(62, 207, 142, 0.2);
          padding: 8px 14px;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.12s, border-color 0.12s, transform 0.1s;
          display: inline-block;
        }
        .btn-edit:hover {
          background: rgba(62, 207, 142, 0.12);
          border-color: rgba(62, 207, 142, 0.4);
        }
        .btn-edit:active {
          transform: scale(0.97);
        }
        
        .empty-state {
          padding: 44px 24px;
          text-align: center;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .pending-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          color: #fb923c;
          background: rgba(251, 146, 60, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 4px;
        }

        @media (max-width: 768px) {
          .caixa-page { padding: 20px 16px; }
          .driver-kpi-grid { grid-template-columns: 1fr; gap: 12px; }
          .report-table th, .report-table td { padding: 12px 14px; font-size: 12px; }
          .report-table th.col-hide, .report-table td.col-hide { display: none; }
        }
      `}</style>
      <div>
        {/* Header */}
        <div className="caixa-header">
          <div className="caixa-title-block">
            <h1>Relatório Detalhado de Profissionais</h1>
            <p>Controle de despesas, repasses e atendimentos efetuados por agendamento confirmada.</p>
          </div>
          <Link href="/admin/caixa" className="btn-voltar">
            ← Voltar ao Caixa
          </Link>
        </div>

        {/* KPIs */}
        <div className="driver-kpi-grid">
          <div className="driver-kpi-card" style={{ borderTop: "3px solid rgba(248,113,113,0.3)" }}>
            <p className="driver-kpi-label">Repasse Geral Total</p>
            <p className="driver-kpi-value" style={{ color: "#f87171" }}>{brl(totalPagoGeral)}</p>
            <p className="driver-kpi-sub">Total repassado em todas as agendamentos confirmadas</p>
          </div>

          <div className="driver-kpi-card" style={{ borderTop: "3px solid rgba(251,113,133,0.3)" }}>
            <p className="driver-kpi-label">Repasse do Mês Atual</p>
            <p className="driver-kpi-value" style={{ color: "#fb7185" }}>{brl(totalPagoMes)}</p>
            <p className="driver-kpi-sub">Repasses computados em {monthLabel(currentMonth)}</p>
          </div>
        </div>

        {/* Notice Box */}
        <div className="notice-box">
          💡 <strong>Como funciona o controle de despesas de profissionais?</strong> Para que o sistema compute uma despesa com profissional no fluxo de caixa, é necessário preencher o valor do pagamento (em R$) no segmento correspondente dentro do agendamento. Atribuir apenas o nome do profissional sem definir o valor pago a ele resulta em R$ 0,00 e o sistema não registrará despesa. Use a tabela de pendências abaixo para encontrar atendimentos que necessitam de definição de custo.
        </div>

        {/* ── Tabela 1: Planilha Detalhada de Pagamentos (Gastos Efetuados) ── */}
        <h2 className="section-title">
          <span>📊</span> Planilha de Repasses de Profissionais ({paidRides.length})
        </h2>
        <div className="report-table-wrapper">
          {paidRides.length === 0 ? (
            <div className="empty-state">
              Nenhuma despesa com profissional computada ainda.
              <br />
              <span style={{ fontSize: "11px", display: "block", marginTop: "4px" }}>
                Preencha os valores nas agendamentos dos clientes para gerar despesas.
              </span>
            </div>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Cliente / Agendamento</th>
                  <th>Atendimento Principal</th>
                  <th className="col-hide">Atendimento Secundário</th>
                  <th className="col-hide">Serviço Adicional</th>
                  <th>Total Pago</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paidRides.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name">{r.customerName}</span>
                        <span className="customer-date">{formatDate(r.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      {r.driverInName ? (
                        <div className="segment-cell">
                          <span className="segment-driver">{r.driverInName}</span>
                          <span className={`segment-value ${r.inPayment === 0 ? "zero" : ""}`}>
                            {r.inPayment > 0 ? brl(r.inPayment) : "R$ 0,00"}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                    <td className="col-hide">
                      {r.driverOutName ? (
                        <div className="segment-cell">
                          <span className="segment-driver">{r.driverOutName}</span>
                          <span className={`segment-value ${r.outPayment === 0 ? "zero" : ""}`}>
                            {r.outPayment > 0 ? brl(r.outPayment) : "R$ 0,00"}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                    <td className="col-hide">
                      {r.driverCityTourName ? (
                        <div className="segment-cell">
                          <span className="segment-driver">{r.driverCityTourName}</span>
                          <span className={`segment-value ${r.cityTourPayment === 0 ? "zero" : ""}`}>
                            {r.cityTourPayment > 0 ? brl(r.cityTourPayment) : "R$ 0,00"}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className="total-cell">{brl(r.total)}</span>
                    </td>
                    <td>
                      <Link href={`/admin/agendamentos/${r.id}`} className="btn-edit">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Tabela 2: Atendimentos com Profissionais Escalados sem Custo Definido ── */}
        <h2 className="section-title" style={{ marginTop: "44px" }}>
          <span style={{ color: "#fb923c" }}>⚠️</span> Atendimentos com Profissionais Escalados sem Custo Definido ({pendingRides.length})
        </h2>
        <div className="report-table-wrapper" style={{ border: "1px solid rgba(251, 146, 60, 0.2)" }}>
          {pendingRides.length === 0 ? (
            <div className="empty-state">
              🎉 Todos os atendimentos com profissionais escalados possuem custos definidos!
            </div>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Cliente / Agendamento</th>
                  <th>Segmentos & Profissionais Escalados</th>
                  <th>Status do Caixa</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pendingRides.map((r) => {
                  const pendingSegments: string[] = [];
                  if (r.driverInName && r.inPayment === 0) {
                    pendingSegments.push(`Atendimento Principal: ${r.driverInName}`);
                  }
                  if (r.driverOutName && r.outPayment === 0) {
                    pendingSegments.push(`Atendimento Secundário: ${r.driverOutName}`);
                  }
                  if (r.driverCityTourName && r.cityTourPayment === 0) {
                    pendingSegments.push(`Serviço Adicional: ${r.driverCityTourName}`);
                  }

                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">{r.customerName}</span>
                          <span className="customer-date">{formatDate(r.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {pendingSegments.map((s, idx) => (
                            <span key={idx} style={{ fontSize: "13px", color: "var(--text)" }}>
                              👤 {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="pending-badge">
                          R$ 0,00 (Sem custo lançado)
                        </div>
                      </td>
                      <td>
                        <Link href={`/admin/agendamentos/${r.id}`} className="btn-edit" style={{ color: "#fb923c", background: "rgba(251, 146, 60, 0.06)", borderColor: "rgba(251, 146, 60, 0.2)" }}>
                          Definir Valor →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
