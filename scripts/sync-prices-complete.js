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

// Tabela de acréscimos por quantidade
const tabelaAcrescimos = [
  { qtd: 100, acrescimo: 1.00 },   // 100%
  { qtd: 200, acrescimo: 0.75 },   // 75%
  { qtd: 300, acrescimo: 0.70 },   // 70%
  { qtd: 400, acrescimo: 0.65 },   // 65%
  { qtd: 500, acrescimo: 0.60 },   // 60%
  { qtd: 600, acrescimo: 0.56 },   // 56%
  { qtd: 700, acrescimo: 0.52 },   // 52%
  { qtd: 800, acrescimo: 0.48 },   // 48%
  { qtd: 900, acrescimo: 0.44 },   // 44%
  { qtd: 1000, acrescimo: 0.40 },  // 40%
];

const custoAdicional = 0.30; // R$ 0.30 por unidade

async function main() {
  try {
    console.log('🔄 Sincronizando preços de todos os modelos com Marfel...\n');

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
      include: { modelo: true },
    });

    console.log(`✓ ${custosMarfel.length} custos da Marfel encontrados\n`);

    if (custosMarfel.length === 0) {
      console.log('⚠️  Nenhum custo de Marfel para sincronizar');
      return;
    }

    // 3. Para cada custo, criar/atualizar as faixas de preço
    let precosCriados = 0;
    let precosAtualizados = 0;
    const relatorio = [];

    for (const custo of custosMarfel) {
      const modelo = custo.modelo;
      const tamanho = custo.tamanho;

      // Calcular custo por unidade
      let custoPorUnidade = 0;

      if (custo.custoMilheiroCents && custo.custoMilheiroCents > 0) {
        // custoMilheiroCents é o custo por 1000 unidades
        custoPorUnidade = (custo.custoMilheiroCents / 1000) / 100; // converter para reais
      } else if (custo.pesoMilheiroKg && custo.precoKgCents > 0) {
        // Calcular custo do milheiro
        const custoMilheiroCents = custo.pesoMilheiroKg * custo.precoKgCents;
        custoPorUnidade = (custoMilheiroCents / 1000) / 100;
      } else {
        console.log(`⚠️  Custo sem informação para ${modelo?.nome || 'desconhecido'} ${tamanho}`);
        continue;
      }

      console.log(`📦 Processando: ${modelo?.nome || 'Modelo'} - ${tamanho}`);
      console.log(`   Custo unitário: R$ ${custoPorUnidade.toFixed(2)}`);

      // 4. Criar/atualizar faixas de preço para cada quantidade
      for (const faixa of tabelaAcrescimos) {
        const precoUnitario = (custoPorUnidade + custoAdicional) * (1 + faixa.acrescimo);

        // Buscar se já existe
        const precoExistente = await prisma.tabelaPreco.findFirst({
          where: {
            modeloId: custo.modeloId,
            tamanho: tamanho,
            qtdMin: faixa.qtd,
            gramatura: custo.gramatura || null,
          },
        });

        if (precoExistente) {
          // Atualizar
          await prisma.tabelaPreco.update({
            where: { id: precoExistente.id },
            data: { precoUnitario },
          });
          precosAtualizados++;
        } else {
          // Criar
          await prisma.tabelaPreco.create({
            data: {
              tipo: `${modelo?.nome || 'Modelo'} ${tamanho}`,
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

        console.log(`   ├─ ${faixa.qtd} un (+${(faixa.acrescimo * 100).toFixed(0)}%): R$ ${precoUnitario.toFixed(2)}`);
      }

      relatorio.push({
        modelo: modelo?.nome || 'Desconhecido',
        tamanho,
        custoPorUnidade: custoPorUnidade.toFixed(2),
      });

      console.log('');
    }

    // 5. Mostrar resumo
    console.log('═'.repeat(70));
    console.log('✅ Sincronização concluída!\n');
    console.log(`📊 Resumo:`);
    console.log(`   • ${precosCriados} novos preços criados`);
    console.log(`   • ${precosAtualizados} preços atualizados`);
    console.log(`   • ${relatorio.length} modelos processados`);
    console.log(`   • ${tabelaAcrescimos.length} faixas de quantidade por modelo\n`);

    console.log('📋 Modelos processados:');
    relatorio.forEach((r) => {
      console.log(`   • ${r.modelo} (${r.tamanho}) - Custo: R$ ${r.custoPorUnidade}`);
    });

    console.log('\n✓ Todos os modelos estão com preços sincronizados!\n');

  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
