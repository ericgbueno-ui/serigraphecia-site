#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  try {
    console.log('🔄 Sincronizando preços com custos da Marfel...\n');

    // 1. Encontrar Marfel
    const marfel = await prisma.fornecedor.findFirst({
      where: { nome: 'Marfel' },
    });

    if (!marfel) {
      console.log('❌ Fornecedor Marfel não encontrado');
      return;
    }

    console.log(`✓ Marfel encontrada (ID: ${marfel.id})\n`);

    // 2. Buscar custos da Marfel
    const custosMarfel = await prisma.fornecedorCusto.findMany({
      where: { fornecedorId: marfel.id },
    });

    console.log(`✓ ${custosMarfel.length} custos da Marfel encontrados\n`);

    // 3. Mapear custos por tamanho
    const custosPorTamanho = new Map();
    custosMarfel.forEach((c) => {
      const key = `${c.tamanho}`;
      if (!custosPorTamanho.has(key)) {
        custosPorTamanho.set(key, []);
      }
      custosPorTamanho.get(key).push(c);
    });

    // 4. Buscar todos os preços
    const precos = await prisma.tabelaPreco.findMany({
      where: { ativo: true },
      include: { modelo: true },
    });

    console.log(`✓ ${precos.length} preços encontrados\n`);
    console.log('📊 Sincronizando preços (fórmula: R$ 0.59 + R$ 0.30 × 2 = R$ 1.78)...\n');

    let precosAtualizados = 0;
    const atualizacoes = [];

    // 5. Atualizar preços baseado em Marfel
    for (const preco of precos) {
      const tamanho = preco.tamanho;
      if (!tamanho || !custosPorTamanho.has(tamanho)) continue;

      const custos = custosPorTamanho.get(tamanho);
      if (custos.length === 0) continue;

      const custo = custos[0];
      // Fórmula: (R$ 0.59 + R$ 0.30) × 2 = R$ 1.78
      const custoBase = 0.59; // R$
      const custoAdicional = 0.30; // R$
      const margem = 2.0; // 100% = multiplicador 2

      let novoPreco = (custoBase + custoAdicional) * margem;

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

    // 6. Mostrar resultados
    console.log(`✓ ${precosAtualizados} preços foram atualizados\n`);

    if (atualizacoes.length > 0) {
      console.log('📋 Exemplos de atualizações:');
      console.log('─'.repeat(70));
      atualizacoes.slice(0, 10).forEach((upd) => {
        console.log(`${upd.tipo.padEnd(25)} | ${upd.tamanho.padEnd(8)} | R$ ${upd.precoAnterior.toFixed(2).padStart(7)} → R$ ${upd.precoNovo.toFixed(2).padStart(7)}`);
      });
      if (atualizacoes.length > 10) {
        console.log(`... e mais ${atualizacoes.length - 10} atualizações`);
      }
      console.log('─'.repeat(70));
    }

    console.log('\n✅ Sincronização concluída com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
