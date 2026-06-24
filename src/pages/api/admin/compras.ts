import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import { entrarEstoque } from "../../../lib/estoque";

export const prerender = false;

type ItemInput = {
  descricao: string;
  tipo: string;
  tamanho?: string;
  gramatura?: string;
  cor?: string;
  pecas: number;
  pesoKg: number;
  precoKg: number;
};

function toCents(valor: number): number {
  return Math.round(valor * 100);
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const formData = await request.formData();

  const numeroPedido = formData.get("numeroPedido")?.toString().trim() || null;
  const fornecedorId = formData.get("fornecedorId")?.toString().trim() || null;
  const dataEmissaoRaw = formData.get("dataEmissao")?.toString().trim() || "";
  const transportadora = formData.get("transportadora")?.toString().trim() || null;
  const observacao = formData.get("observacao")?.toString().trim() || null;
  const itensRaw = formData.get("itensJson")?.toString() || "[]";

  let itens: ItemInput[] = [];
  try {
    itens = JSON.parse(itensRaw);
  } catch {
    itens = [];
  }

  itens = itens.filter(
    (i) => i && i.tipo && i.pecas > 0 && i.pesoKg > 0 && i.precoKg >= 0
  );

  if (itens.length === 0) {
    return redirect("/admin/compras/novo?error=itens", 302);
  }

  const dataEmissao = dataEmissaoRaw ? new Date(dataEmissaoRaw) : null;

  try {
    const totalPecas = itens.reduce((s, i) => s + i.pecas, 0);
    const totalKg = itens.reduce((s, i) => s + i.pesoKg, 0);
    const totalCents = itens.reduce((s, i) => s + toCents(i.pesoKg * i.precoKg), 0);

    const compra = await prisma.compra.create({
      data: {
        numeroPedido,
        dataEmissao,
        transportadora,
        fornecedorId,
        observacao,
        totalPecas,
        totalKg,
        totalCents,
        itens: {
          create: itens.map((i) => ({
            descricao: i.descricao || i.tipo,
            tipo: i.tipo,
            tamanho: i.tamanho || null,
            gramatura: i.gramatura || null,
            cor: i.cor || null,
            pecas: i.pecas,
            pesoKg: i.pesoKg,
            precoKgCents: toCents(i.precoKg),
            totalCents: toCents(i.pesoKg * i.precoKg),
          })),
        },
      },
    });

    // Dá entrada no estoque, item a item
    for (const i of itens) {
      await entrarEstoque(prisma, {
        tipo: i.tipo,
        tamanho: i.tamanho,
        gramatura: i.gramatura,
        cor: i.cor,
        pecas: i.pecas,
      });
    }

    // Lança a despesa no Fluxo de Caixa
    try {
      let categoria = await prisma.cashflowCategory.findFirst({
        where: { name: "Compra de Matéria-Prima" },
      });
      if (!categoria) {
        categoria = await prisma.cashflowCategory.create({
          data: {
            name: "Compra de Matéria-Prima",
            type: "EXPENSE",
            description: "Compras de sacolas/insumos de fornecedores",
          },
        });
      }

      const fornecedor = fornecedorId
        ? await prisma.fornecedor.findUnique({ where: { id: fornecedorId }, select: { nome: true } })
        : null;

      const descricaoDespesa = `Compra${fornecedor ? ` de ${fornecedor.nome}` : ""}${numeroPedido ? ` — Pedido ${numeroPedido}` : ""}`;

      const transacao = await prisma.cashflowTransaction.create({
        data: {
          transactionDate: dataEmissao || new Date(),
          categoryId: categoria.id,
          transactionType: "EXPENSE",
          amountCents: totalCents,
          description: descricaoDespesa,
        },
      });

      await prisma.compra.update({
        where: { id: compra.id },
        data: { cashflowTransactionId: transacao.id },
      });
    } catch (err) {
      console.error("Erro ao lançar despesa no Fluxo de Caixa (compra segue registrada):", err);
    }

    return redirect("/admin/compras", 302);
  } catch (err) {
    console.error("Erro ao registrar compra:", err);
    return redirect("/admin/compras/novo?error=1", 302);
  }
};
