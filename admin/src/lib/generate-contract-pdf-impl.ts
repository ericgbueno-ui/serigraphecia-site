/**
 * generate-contract-pdf-impl.ts
 *
 * Gera o contrato como HTML estilizado.
 * Retornado pela rota /api/contracts/[id] como text/html.
 * O cliente pode imprimir ou salvar como PDF via Ctrl+P no navegador.
 *
 * Substituiu @react-pdf/renderer que era incompatível com Next.js 16 + Vercel
 * (React error #31 causado por conflito de reconciliadores).
 */

export interface ContractBookingData {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  tripType: string;
  vehicleType: string;
  passengerCount: number;
  routeLabel: string | null;
  hotel: string | null;
  hotelAddress: string | null;
  idaDate: Date | null;
  idaFlightTime: string | null;
  idaFlightNumber: string | null;
  voltaDate: Date | null;
  voltaFlightTime: string | null;
  voltaFlightNumber: string | null;
  totalCents: number;
  depositCents: number;
  remainderCents: number;
  payMethod: string;
  contractAcceptedAt: Date | null;
  contractAcceptedVersion: string | null;
  passengers: { fullName: string; docType: string; docNumber: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function fmtDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function tripLabel(t: string) {
  if (t === "so_citytour") return "Somente City Tour";
  if (t === "ida_volta") return "Chegada In + Retorno Out";
  if (t === "volta") return "Retorno Out";
  return "Chegada In";
}

function vehicleLabel(v: string) {
  const map: Record<string, string> = {
    sedan: "Sedan Premium",
    van: "Spin 6 Lugares",
    executivo: "Sedan Executivo",
    suv: "SUV",
    suv_eletrico: "SUV Elétrico",
  };
  return map[v] ?? v;
}

function esc(s: string | null | undefined): string {
  if (!s) return "—";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function calcHotelDepartureTime(flightTime: string | null | undefined): string {
  if (!flightTime) return "—";
  const match = flightTime.match(/^(\d{2}):(\d{2})/);
  if (!match) return flightTime;
  let h = parseInt(match[1], 10);
  const m = match[2];
  h -= 4;
  if (h < 0) h += 24;
  return `${h.toString().padStart(2, "0")}:${m}`;
}

// ─── HTML ─────────────────────────────────────────────────────────────────────

export function generateContractHtml(data: ContractBookingData): string {
  const shortId = data.id.slice(0, 8).toUpperCase();
  const hasIda = data.tripType === "ida" || data.tripType === "ida_volta";
  const hasVolta = data.tripType === "volta" || data.tripType === "ida_volta";
  const geradoEm = fmtDateTime(new Date());

  const mainPax =
    data.passengers.find((p) => p.fullName === data.customerName) || data.passengers[0];
  const mainDoc = mainPax ? `${mainPax.docType}: ${mainPax.docNumber}` : "";

  const passageirosRows = data.passengers
    .map(
      (p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(p.fullName)}</td>
      <td>${esc(p.docType)}</td>
      <td>${esc(p.docNumber)}</td>
    </tr>`
    )
    .join("");

  const secVoos = `
    ${
      hasIda
        ? `
    <div class="grid3">
      <div class="field"><span class="label">Data Chegada In</span><span class="value">${fmtDate(data.idaDate)}</span></div>
      <div class="field"><span class="label">Horário Chegada In</span><span class="value">${esc(data.idaFlightTime)}</span></div>
      <div class="field"><span class="label">Voo Chegada In</span><span class="value">${esc(data.idaFlightNumber)}</span></div>
    </div>`
        : ""
    }
    ${
      hasVolta
        ? `
    <div class="grid2">
      <div class="field"><span class="label">Data Retorno Out</span><span class="value">${fmtDate(data.voltaDate)}</span></div>
      <div class="field"><span class="label">Voo Retorno Out</span><span class="value">${esc(data.voltaFlightNumber)}</span></div>
    </div>
    <div class="grid2">
      <div class="field"><span class="label">Horário do Voo (Decolagem)</span><span class="value">${esc(data.voltaFlightTime)}</span></div>
      <div class="field"><span class="label">Horário de Saída do Hotel/Pousada</span><span class="value">${esc(calcHotelDepartureTime(data.voltaFlightTime))}</span></div>
    </div>`
        : ""
    }
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${data.customerName} - CONTRATO</title>
<style>
  :root {
    --gold: #c9a84c;
    --dark: #0d1117;
    --text: #1a1a2e;
    --muted: #555577;
    --border: #ddddee;
    --bg-field: #f7f7fb;
    --green: #3ecf8e;
    --green-bg: #f0faf5;
    --green-text: #1a7a4a;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 13px;
    color: var(--text);
    background: #f0f0f5;
    padding: 24px;
  }
  .contract {
    max-width: 820px;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 32px rgba(0,0,0,0.12);
  }

  /* ── HEADER ── */
  .header {
    background: var(--dark);
    padding: 28px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-title { color: var(--gold); font-size: 17px; font-weight: 700; letter-spacing: 0.5px; }
  .header-sub { color: #aaaacc; font-size: 11px; margin-top: 4px; }
  .header-right { text-align: right; }
  .header-right p { color: #aaaacc; font-size: 11px; line-height: 1.6; }

  /* ── PRINT BUTTON ── */
  .print-bar {
    background: #f7f7fb;
    border-bottom: 1px solid var(--border);
    padding: 12px 40px;
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .btn-print {
    background: var(--gold);
    color: var(--dark);
    border: none;
    border-radius: 6px;
    padding: 8px 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-print:hover { opacity: 0.9; }
  .print-hint { color: var(--muted); font-size: 12px; }

  /* ── BODY ── */
  .body { padding: 32px 40px 40px; }

  /* ── SECTIONS ── */
  .section { margin-bottom: 28px; }
  .section-title {
    font-size: 10px;
    font-weight: 700;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1.5px solid var(--gold);
    padding-bottom: 6px;
    margin-bottom: 14px;
  }

  /* ── GRIDS ── */
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; }

  /* ── FIELDS ── */
  .field {
    background: var(--bg-field);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .field.dark-field {
    background: var(--dark);
    border-color: var(--gold);
  }
  .label {
    font-size: 9px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .dark-field .label { color: var(--gold); }
  .value { font-size: 13px; font-weight: 700; color: var(--text); }
  .dark-field .value { color: #fff; }
  .value-muted { font-size: 12px; color: var(--muted); }
  .dark-field .value-muted { color: #aaaacc; }

  /* ── TOTAL BOX ── */
  .total-box {
    background: var(--dark);
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .total-label { color: #aaaacc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .total-value { color: var(--gold); font-size: 22px; font-weight: 700; }

  /* ── PASSENGERS TABLE ── */
  table { width: 100%; border-collapse: collapse; }
  th {
    background: var(--dark);
    color: var(--gold);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 12px;
    text-align: left;
  }
  td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid var(--border); }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: var(--bg-field); }

  /* ── CLAUSES ── */
  .clause-title { font-size: 13px; font-weight: 700; color: var(--text); margin: 16px 0 6px; }
  .clause-text { font-size: 12px; color: var(--muted); line-height: 1.6; margin-bottom: 4px; }
  .bullet { display: flex; gap: 8px; margin-bottom: 4px; padding-left: 8px; }
  .bullet::before { content: "•"; color: var(--gold); flex-shrink: 0; font-size: 12px; }
  .bullet-text { font-size: 12px; color: var(--muted); line-height: 1.6; }

  /* ── ACCEPT BOX ── */
  .accept-box {
    background: var(--green-bg);
    border: 1.5px solid var(--green);
    border-radius: 8px;
    padding: 16px 18px;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  .accept-title { font-size: 13px; font-weight: 700; color: var(--green-text); margin-bottom: 6px; }
  .accept-text { font-size: 12px; color: #2a5a3a; line-height: 1.6; }
  .accept-date { font-size: 12px; font-weight: 700; color: var(--green-text); margin-top: 6px; }

  /* ── SIGN ROW ── */
  .sign-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 28px; }
  .sign-box { border-top: 1.5px solid var(--text); padding-top: 10px; }
  .sign-label { font-size: 11px; color: var(--muted); }
  .sign-name { font-size: 13px; font-weight: 700; color: var(--text); margin-top: 3px; }

  /* ── DIVIDER ── */
  .divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

  /* ── FOOTER ── */
  .footer {
    background: var(--dark);
    padding: 14px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer p { color: #aaaacc; font-size: 10px; }

  /* ── PRINT ── */
  @media print {
    body { background: #fff; padding: 0; }
    .contract { box-shadow: none; border-radius: 0; }
    .print-bar { display: none !important; }
    .section { page-break-inside: avoid; }
  }
</style>
<script>
  var _contractTitle = '${data.customerName.replace(/'/g, "\\'")} - CONTRATO';
  document.title = _contractTitle;
  window.addEventListener('beforeprint', function() { document.title = _contractTitle; });
</script>
</head>
<body>
<div class="contract">

  <!-- HEADER -->
  <div class="header">
    <div style="display: flex; gap: 16px; align-items: center;">
      <img src="/brand/logo-horizontal.webp" alt="Multi Trip Logo" style="height: 40px; width: auto;" />
      <div>
        <div class="header-title">MULTI TRIP RECEPTIVOS E VIAGENS</div>
        <div class="header-sub">Contrato Particular de Prestação de Serviços de Transporte Turístico</div>
      </div>
    </div>
    <div class="header-right">
      <p>Reserva #${shortId}</p>
      <p>Gerado em ${geradoEm}</p>
    </div>
  </div>

  <!-- PRINT BAR -->
  <div class="print-bar">
    <button class="btn-print" onclick="document.title='${data.customerName.replace(/'/g, "\\'")} - CONTRATO'; window.print();">🖨️ Imprimir / Salvar como PDF</button>
    <span class="print-hint">No diálogo de impressão, selecione "Salvar como PDF" para baixar.</span>
  </div>

  <div class="body">

    <!-- 1. PARTES -->
    <div class="section">
      <div class="section-title">1. Partes do Contrato</div>
      <div class="grid2">
        <div class="field dark-field">
          <span class="label">CONTRATADA</span>
          <span class="value">Multi Trip Receptivo e Viagens</span>
          <span class="value-muted">CNPJ: 59.824.538/0001-63</span>
          <span class="value-muted">Cadastur: 59.824.538/0001-63</span>
          <span class="value-muted">Rua Nair Garcia Martins, 295/171 – Porto Alegre/RS</span>
        </div>
        <div class="field">
          <span class="label">CONTRATANTE</span>
          <span class="value">${esc(data.customerName)}</span>
          <span class="value-muted">WhatsApp: ${esc(data.customerPhone)}</span>
          <span class="value-muted">E-mail: ${esc(data.customerEmail)}</span>
        </div>
      </div>
    </div>

    <!-- 2. SERVIÇO -->
    <div class="section">
      <div class="section-title">2. Dados do Serviço</div>
      <div class="grid3">
        <div class="field"><span class="label">Trajeto</span><span class="value">${tripLabel(data.tripType)}</span></div>
        <div class="field"><span class="label">Veículo</span><span class="value">${vehicleLabel(data.vehicleType)}</span></div>
        <div class="field"><span class="label">Passageiros</span><span class="value">${data.passengerCount}</span></div>
      </div>
      <div class="grid2">
        <div class="field"><span class="label">Rota</span><span class="value">${esc(data.routeLabel) || "POA ↔ Gramado/Canela"}</span></div>
        <div class="field"><span class="label">Hotel / Destino</span><span class="value">${esc(data.hotel) || "A combinar"}</span></div>
      </div>
      ${data.hotelAddress ? `<div class="field" style="margin-bottom:10px"><span class="label">Endereço</span><span class="value">${esc(data.hotelAddress)}</span></div>` : ""}
    </div>

    <!-- 3. VOOS -->
    <div class="section">
      <div class="section-title">3. Datas e Voos</div>
      ${secVoos}
    </div>

    <!-- 4. PASSAGEIROS -->
    ${
      data.passengers.length > 0
        ? `
    <div class="section">
      <div class="section-title">4. Passageiros</div>
      <table>
        <thead><tr><th>#</th><th>Nome Completo</th><th>Documento</th><th>Número</th></tr></thead>
        <tbody>${passageirosRows}</tbody>
      </table>
    </div>`
        : ""
    }

    <!-- 5. VALOR -->
    <div class="section">
      <div class="section-title">5. Valor e Pagamento</div>
      <div class="total-box">
        <span class="total-label">Valor Total do Serviço</span>
        <span class="total-value">${brl(data.totalCents)}</span>
      </div>
      <div class="grid2">
        <div class="field"><span class="label">Forma de Pagamento</span><span class="value">${data.payMethod === "pix" ? (data.remainderCents > 0 ? "50% Pix" : "PIX") : "Cartão de Crédito"}</span></div>
        <div class="field"><span class="label">ID da Reserva</span><span class="value">${esc(data.id)}</span></div>
      </div>
    </div>

    <hr class="divider"/>

    <!-- 6. CLÁUSULAS -->
    <div class="section">
      <div class="section-title">6. Cláusulas e Condições Gerais</div>

      <div class="clause-title">6.1 Objeto</div>
      <p class="clause-text">Prestação de serviço de transporte turístico privativo, conforme itinerário previamente acordado, realizado em padrão executivo, com foco em conforto, segurança, pontualidade e atendimento profissional.</p>

      <div class="clause-title">6.2 Quilometragem e Roteiro</div>
      <div class="bullet"><span class="bullet-text">O serviço será realizado conforme roteiro contratado.</span></div>
      <div class="bullet"><span class="bullet-text">Quilometragem excedente, paradas adicionais, desvios de trajeto ou alterações não previstas poderão gerar custos adicionais.</span></div>

      <div class="clause-title">6.3 Responsabilidades do Contratante</div>
      <div class="bullet"><span class="bullet-text">Pela veracidade das informações fornecidas.</span></div>
      <div class="bullet"><span class="bullet-text">Pela conduta dos passageiros durante o translado.</span></div>
      <div class="bullet"><span class="bullet-text">Por danos causados ao veículo.</span></div>
      <div class="bullet"><span class="bullet-text">Taxa de limpeza em casos de derramamento de líquidos, sujeira excessiva ou vômitos.</span></div>

      <div class="clause-title">6.4 Veículo e Padrão de Serviço</div>
      <div class="bullet"><span class="bullet-text">O serviço contratado refere-se a um padrão de veículo, e não a um modelo específico.</span></div>
      <div class="bullet"><span class="bullet-text">Pode haver variação de modelo, marca ou cor, sem prejuízo do nível de serviço.</span></div>

      <div class="clause-title">6.5 Bagagens</div>
      <div class="bullet"><span class="bullet-text">Cada passageiro tem direito a 1 mala padrão e 1 bagagem de mão.</span></div>
      <div class="bullet"><span class="bullet-text">Bagagens adicionais deverão ser informadas previamente e poderão exigir adequação do veículo ou custos adicionais.</span></div>

      <div class="clause-title">6.6 Atendimento em Aeroporto e Tolerância Operacional</div>
      <div class="bullet"><span class="bullet-text">O motorista será posicionado conforme o horário programado de chegada do voo informado pelo Contratante.</span></div>
      <div class="bullet"><span class="bullet-text">Tolerância de até 60 minutos após o horário programado de chegada do voo para desembarque, retirada de bagagens e deslocamento até o ponto de encontro.</span></div>
      <div class="bullet"><span class="bullet-text">Atrasos superiores a 60 minutos podem exigir reprogramação ou substituição do veículo.</span></div>

      <div class="clause-title">6.7 No-show e Remarcações</div>
      <div class="bullet"><span class="bullet-text">No-show: remarcação sujeita à disponibilidade de agenda com acréscimo de 20% sobre o valor contratado.</span></div>
      <div class="bullet"><span class="bullet-text">Alterações com até 24h de antecedência: sem custo adicional.</span></div>
      <div class="bullet"><span class="bullet-text">Alterações com menos de 24h: acréscimo de 20% sobre o valor contratado.</span></div>

      <div class="clause-title">6.8 Falhas Mecânicas ou Força Maior</div>
      <p class="clause-text">Em caso de falha mecânica, pane, acidente ou evento de força maior, a Contratada poderá substituir o veículo ou readequar o atendimento para manter a continuidade do serviço.</p>

      <div class="clause-title">6.9 Limitação de Responsabilidade</div>
      <p class="clause-text">A Contratada não se responsabiliza por perda de voos, reservas ou compromissos decorrentes de trânsito, condições climáticas, acidentes de terceiros ou eventos de força maior.</p>

      <div class="clause-title">6.10 Foro</div>
      <p class="clause-text">Fica eleito o foro da Comarca de Porto Alegre/RS para dirimir quaisquer controvérsias oriundas deste contrato.</p>
    </div>

    <!-- ACEITE -->
    <div class="accept-box">
      <div class="accept-title">✓ Aceite Digital — Lei nº 14.063/2020</div>
      <p class="accept-text">A confirmação via WhatsApp, envio de dados ou realização de pagamento caracteriza aceite integral deste contrato, com plena validade jurídica conforme a Lei nº 14.063/2020 (Assinaturas Eletrônicas em Interações com o Poder Público) e o Marco Civil da Internet (Lei nº 12.965/2014).</p>
      ${
        data.contractAcceptedAt
          ? `<p class="accept-date">Aceite registrado em: ${fmtDateTime(data.contractAcceptedAt)} • Versão: ${esc(data.contractAcceptedVersion)}</p>`
          : `<p class="accept-date" style="color:var(--gold)">Aceite registrado pelo operador no momento da criação da reserva.</p>`
      }
    </div>

    <!-- ASSINATURAS -->
    <div class="sign-row">
      <div class="sign-box">
        <div class="sign-label">CONTRATADA</div>
        <div class="sign-name">Multi Trip Receptivo e Viagens</div>
        <div class="sign-label">CNPJ: 59.824.538/0001-63</div>
      </div>
      <div class="sign-box">
        <div class="sign-label">CONTRATANTE</div>
        <div class="sign-name">${esc(data.customerName)}</div>
        <div class="sign-label">WhatsApp: ${esc(data.customerPhone)}</div>
        ${mainDoc ? `<div class="sign-label">${esc(mainDoc)}</div>` : ""}
      </div>
    </div>

  </div><!-- /body -->

  <!-- FOOTER -->
  <div class="footer">
    <p>Multi Trip Receptivo e Viagens • CNPJ 59.824.538/0001-63 • Cadastur 59.824.538/0001-63</p>
    <p>Reserva #${shortId}</p>
  </div>

</div><!-- /contract -->
</body>
</html>`;
}

// ─── Funções exportadas ───────────────────────────────────────────────────────

/**
 * Retorna o HTML do contrato como string.
 * Usado pela rota /api/contracts/[id].
 */
export async function generateContractPdfBuffer(data: ContractBookingData): Promise<string> {
  return generateContractHtml(data);
}

/**
 * Retorna a URL pública do contrato (gerado on-demand por /api/contracts/[id]).
 */
export async function generateContractPdf(data: ContractBookingData): Promise<string> {
  return `/api/contracts/${data.id}`;
}
