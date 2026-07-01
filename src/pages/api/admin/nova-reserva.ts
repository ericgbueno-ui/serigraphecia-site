import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import { gerarNumeroPedido } from "../../../lib/pedido";
import { baixarEstoque } from "../../../lib/estoque";
import crypto from "crypto";

export const prerender = false;

const TIPO_LABELS: Record<string, string> = {
  alca_vazada: "Alça Vazada",
  alca_fita: "Alça Fita",
  alca_camiseta: "Alça Camiseta",
  outro: "Outro",
};

interface ItemForm {
  tripType: string;
  passengerCount: number;
  tamanho: string | null;
  gramatura: string | null;
  corSacola: string;
  cores: string;
  corImpressao: string | null;
  observacoes: string | null;
  subtotalCents: number;
}

/**
 * Extrai os itens do FormData a partir de campos "itens[N][campo]"
 * (Fase 2 — suporte a múltiplos produtos por pedido, 2026-07-01).
 */
function parseItens(formData: FormData): ItemForm[] {
  const porIndice = new Map<number, Record<string, string>>();

  for (const [key, value] of formData.entries()) {
    const m = key.match(/^itens\[(\d+)\]\[(\w+)\]$/);
    if (!m) continue;
    const idx = parseInt(m[1], 10);
    const campo = m[2];
    if (!porIndice.has(idx)) porIndice.set(idx, {});
    porIndice.get(idx)![campo] = value.toString();
  }

  const indices = [...porIndice.keys()].sort((a, b) => a - b);

  return indices
    .map((idx) => {
      const campos = porIndice.get(idx)!;
      return {
        tripType: campos.tripType || "outro",
        passengerCount: parseInt(campos.passengerCount || "0", 10) || 0,
        tamanho: campos.tamanho?.trim() || null,
        gramatura: campos.gramatura?.trim() || null,
        corSacola: campos.corSacola?.trim() || "",
        cores: campos.cores || "1",
        corImpressao: campos.corImpressao?.trim() || null,
        observacoes: campos.observacoes?.trim() || null,
        subtotalCents: parseInt(campos.subtotalCents || "0", 10) || 0,
      };
    })
    .filter((item) => item.passengerCount > 0);
}

function coresLabel(valor: string): string {
  if (valor === "4c") return "4 cores (CMYK)";
  if (valor === "personalizado") return "personalizado";
  return `${valor} cor(es)`;
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const formData = await request.formData();

  const name        = formData.get("name")?.toString().trim() || "";
  const nomeLoja    = formData.get("nomeLoja")?.toString().trim() || null;
  const phone       = formData.get("phone")?.toString().replace(/\D/g, "") || "";
  const email       = formData.get("email")?.toString().trim() || "";
  const instagram   = formData.get("instagram")?.toString().trim() || null;
  const endereco    = formData.get("endereco")?.toString().trim() || null;
  const bairro      = formData.get("bairro")?.toString().trim() || null;
  const cidade      = formData.get("cidade")?.toString().trim() || null;

  const idaDateRaw  = formData.get("idaDate")?.toString();
  const idaFlightTime = formData.get("idaFlightTime")?.toString().trim() || null;
  const payMethod   = formData.get("payMethod")?.toString() || "pix";
  const affiliateCode = formData.get("affiliateCode")?.toString() || null;

  const totalCentsRaw   = parseFloat(formData.get("totalCents")?.toString().replace(",", ".") || "0");
  const totalCentsForm  = Math.round(totalCentsRaw * 100);
  const depositCentsRaw = parseFloat(formData.get("depositCents")?.toString().replace(",", ".") || "0");
  const depositCents    = Math.round(depositCentsRaw * 100);

  const idaDate = idaDateRaw ? new Date(`${idaDateRaw}T12:00:00-03:00`) : null;

  const itens = parseItens(formData);

  if (itens.length === 0) {
    return redirect("/admin/nova-reserva?error=1", 302);
  }

  try {
    let customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          nomeLoja: nomeLoja || undefined,
          phone,
          email: email || `sem_email_${phone}@placeholder.local`,
          instagram: instagram || undefined,
          endereco: endereco || undefined,
          bairro: bairro || undefined,
          cidade: cidade || undefined,
          marketingOptIn: false,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: name || customer.name,
          nomeLoja: nomeLoja ?? customer.nomeLoja,
          email: email || customer.email,
          instagram: instagram ?? customer.instagram,
          endereco: endereco ?? customer.endereco,
          bairro: bairro ?? customer.bairro,
          cidade: cidade ?? customer.cidade,
        },
      });
    }

    const publicToken  = crypto.randomBytes(16).toString("hex");
    const numeroPedido = await gerarNumeroPedido(prisma);

    // Total geral: soma dos subtotais calculados por produto. Se o admin
    // ajustou manualmente o campo "Total (R$)" para um valor diferente da
    // soma, respeita o que foi digitado (ele pode ter um motivo: desconto,
    // frete, etc.) — só usa a soma como padrão quando o campo bate com ela.
    const somaItens = itens.reduce((s, i) => s + i.subtotalCents, 0);
    const totalCents = totalCentsForm > 0 ? totalCentsForm : somaItens;
    const remainderCents = Math.max(0, totalCents - depositCents);
    const quantidadeTotal = itens.reduce((s, i) => s + i.passengerCount, 0);

    // Campos "legados" do Pedido (tipoProduto, corProduto, etc.) recebem os
    // dados do primeiro produto, para compatibilidade com telas que ainda
    // leem esses campos direto do pedido. O detalhe completo, produto a
    // produto, fica em ItemPedido.
    const primeiro = itens[0];
    const multiplosProdutos = itens.length > 1;

    const notas = [
      idaDate ? `Prazo de entrega: ${idaDate.toLocaleDateString("pt-BR")}` : null,
      multiplosProdutos ? `Pedido com ${itens.length} produtos — ver detalhe na lista de itens.` : null,
      idaFlightTime,
    ]
      .filter(Boolean)
      .join(" | ") || undefined;

    const pedido = await prisma.pedido.create({
      data: {
        publicToken,
        numeroPedido,
        customerId: customer.id,
        tipoProduto: multiplosProdutos
          ? `${TIPO_LABELS[primeiro.tripType] || primeiro.tripType} + ${itens.length - 1} outro(s)`
          : (TIPO_LABELS[primeiro.tripType] || primeiro.tripType),
        corProduto: primeiro.corSacola || undefined,
        tamanho: primeiro.tamanho || undefined,
        gramatura: primeiro.gramatura || undefined,
        corImpressao: primeiro.corImpressao || undefined,
        lados: "um",
        coresLadoA: parseInt(primeiro.cores || "0", 10) || 0,
        quantidade: quantidadeTotal,
        internalNotes: notas,
        payMethod,
        totalCents,
        depositCents,
        remainderCents,
        status: "CONFIRMED",
        affiliateCode: affiliateCode || undefined,
        // Fase 2 — auditoria 2026-07-01: datas independentes do pedido.
        // Mesmo pedido, mesma data, com vários produtos dentro.
        dataPedido: new Date(),
        dataPrevistaEntrega: idaDate || undefined,
      },
    });

    // Um ItemPedido por produto informado no formulário — sem limite de itens.
    for (const item of itens) {
      const nomeBase = TIPO_LABELS[item.tripType] || item.tripType;
      const detalhesImpressao = [
        item.gramatura ? `Gramatura: ${item.gramatura}` : null,
        `Impressão: ${coresLabel(item.cores)}`,
        item.corImpressao ? `Tinta: ${item.corImpressao}` : null,
        item.observacoes,
      ]
        .filter(Boolean)
        .join(" | ") || undefined;

      await prisma.itemPedido.create({
        data: {
          pedidoId: pedido.id,
          produtoId: null,
          nome: nomeBase,
          cor: item.corSacola || undefined,
          tamanho: item.tamanho || undefined,
          observacoes: detalhesImpressao,
          quantidade: item.passengerCount,
          valorUnitarioCents: item.passengerCount > 0 ? Math.round(item.subtotalCents / item.passengerCount) : item.subtotalCents,
          subtotalCents: item.subtotalCents,
        },
      });

      // Baixa do estoque por produto (não bloqueia o pedido caso não haja
      // estoque suficiente — ver src/lib/estoque.ts).
      await baixarEstoque(prisma, item.tripType, item.corSacola, item.passengerCount, {
        pedidoId: pedido.id,
      });
    }

    return redirect(`/admin/reservas/${pedido.id}`, 302);
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    return redirect("/admin/nova-reserva?error=1", 302);
  }
};
