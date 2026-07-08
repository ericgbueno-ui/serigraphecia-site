import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verificar autenticação
    const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
    if (!getIsAdmin(cookieVal)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Encontrar Marfel
    const marfel = await prisma.fornecedor.findFirst({
      where: { nome: "Marfel" },
    });

    if (!marfel) {
      return new Response(
        JSON.stringify({ error: "Fornecedor Marfel não encontrado" }),
        { status: 404 }
      );
    }

    // Buscar custos da Marfel
    const custosMarfel = await prisma.fornecedorCusto.findMany({
      where: { fornecedorId: marfel.id },
    });

    // Mapear custos por tamanho
    const custosPorTamanho = new Map<string, any[]>();
    custosMarfel.forEach((c) => {
      const key = `${c.tamanho}`;
      if (!custosPorTamanho.has(key)) {
        custosPorTamanho.set(key, []);
      }
      custosPorTamanho.get(key)!.push(c);
    });

    // Buscar todos os preços
    const precos = await prisma.tabelaPreco.findMany({
      where: { ativo: true },
      include: { modelo: true },
    });

    let precosAtualizados = 0;
    const atualizacoes: any[] = [];

    // Atualizar preços baseado em Marfel
    for (const preco of precos) {
      const tamanho = preco.tamanho;
      if (!tamanho || !custosPorTamanho.has(tamanho)) continue;

      const custos = custosPorTamanho.get(tamanho);
      if (custos.length === 0) continue;

      const custo = custos[0];
      // Fórmula: (R$ 0.59 + R$ 0.30) × 2 = R$ 1.78
      const custoBase = 0.59;
      const custoAdicional = 0.30;
      const margem = 2.0;
      const novoPreco = (custoBase + custoAdicional) * margem;

      if (Math.abs(novoPreco - preco.precoUnitario) > 0.01) {
        await prisma.tabelaPreco.update({
          where: { id: preco.id },
          data: { precoUnitario: novoPreco },
        });
        precosAtualizados++;
        atualizacoes.push({
          tipo: preco.modelo?.nome || preco.tipo,
          tamanho,
          precoAnterior: preco.precoUnitario,
          precoNovo: novoPreco,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${precosAtualizados} preços foram sincronizados`,
        atualizados: precosAtualizados,
        total: precos.length,
        custosUsados: custosMarfel.length,
        atualizacoes: atualizacoes.slice(0, 10),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao sincronizar preços:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      { status: 500 }
    );
  }
};
