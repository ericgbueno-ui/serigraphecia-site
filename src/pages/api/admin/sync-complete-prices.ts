import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";

export const prerender = false;

// Tabela de acréscimos por quantidade
const tabelaAcrescimos = [
  { qtd: 100, acrescimo: 1.00 },
  { qtd: 200, acrescimo: 0.75 },
  { qtd: 300, acrescimo: 0.70 },
  { qtd: 400, acrescimo: 0.65 },
  { qtd: 500, acrescimo: 0.60 },
  { qtd: 600, acrescimo: 0.56 },
  { qtd: 700, acrescimo: 0.52 },
  { qtd: 800, acrescimo: 0.48 },
  { qtd: 900, acrescimo: 0.44 },
  { qtd: 1000, acrescimo: 0.40 },
];

const custoAdicional = 0.30;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
    if (!getIsAdmin(cookieVal)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const marfel = await prisma.fornecedor.findFirst({
      where: { nome: "Marfel" },
    });

    if (!marfel) {
      return new Response(
        JSON.stringify({ error: "Fornecedor Marfel não encontrado" }),
        { status: 404 }
      );
    }

    const custosMarfel = await prisma.fornecedorCusto.findMany({
      where: { fornecedorId: marfel.id },
      include: { modelo: true },
    });

    if (custosMarfel.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum custo de Marfel encontrado" }),
        { status: 404 }
      );
    }

    let precosCriados = 0;
    let precosAtualizados = 0;
    const relatorio: any[] = [];

    for (const custo of custosMarfel) {
      const modelo = custo.modelo;
      const tamanho = custo.tamanho;

      let custoPorUnidade = 0;

      if (custo.custoMilheiroCents && custo.custoMilheiroCents > 0) {
        custoPorUnidade = (custo.custoMilheiroCents / 1000) / 100;
      } else if (custo.pesoMilheiroKg && custo.precoKgCents > 0) {
        const custoMilheiroCents = custo.pesoMilheiroKg * custo.precoKgCents;
        custoPorUnidade = (custoMilheiroCents / 1000) / 100;
      } else {
        continue;
      }

      for (const faixa of tabelaAcrescimos) {
        const precoUnitario =
          (custoPorUnidade + custoAdicional) * (1 + faixa.acrescimo);

        const precoExistente = await prisma.tabelaPreco.findFirst({
          where: {
            modeloId: custo.modeloId,
            tamanho: tamanho,
            qtdMin: faixa.qtd,
            gramatura: custo.gramatura || null,
          },
        });

        if (precoExistente) {
          await prisma.tabelaPreco.update({
            where: { id: precoExistente.id },
            data: { precoUnitario },
          });
          precosAtualizados++;
        } else {
          await prisma.tabelaPreco.create({
            data: {
              tipo: `${modelo?.nome || "Modelo"} ${tamanho}`,
              modeloId: custo.modeloId,
              tamanho: tamanho,
              gramatura: custo.gramatura || null,
              qtdMin: faixa.qtd,
              qtdMax: null,
              precoUnitario: precoUnitario,
              ativo: true,
            },
          });
          precosCriados++;
        }
      }

      relatorio.push({
        modelo: modelo?.nome || "Desconhecido",
        tamanho,
        custoPorUnidade: custoPorUnidade.toFixed(2),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sincronização concluída",
        precosCriados,
        precosAtualizados,
        modelosProcessados: relatorio.length,
        faixasUsadas: tabelaAcrescimos.length,
        relatorio: relatorio.slice(0, 5),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      { status: 500 }
    );
  }
};
