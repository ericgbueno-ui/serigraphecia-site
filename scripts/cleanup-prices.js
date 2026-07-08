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
    console.log('🧹 Limpando tabela de preços de duplicatas e inconsistências...\n');

    // 1. Buscar todos os preços
    const precos = await prisma.tabelaPreco.findMany({
      where: { ativo: true },
      orderBy: [{ modeloId: 'asc' }, { tamanho: 'asc' }, { gramatura: 'asc' }, { qtdMin: 'asc' }, { updatedAt: 'desc' }],
    });

    console.log(`✓ ${precos.length} preços encontrados\n`);

    // 2. Agrupar por modelo + tamanho + gramatura
    const grupos = new Map();
    for (const p of precos) {
      const key = `${p.modeloId || 'null'}|${p.tamanho}|${p.gramatura || 'null'}`;
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key).push(p);
    }

    console.log(`📊 Agrupados por modelo/tamanho/gramatura: ${grupos.size} grupos\n`);

    // 3. Identificar problemas
    let deletados = 0;
    let incompletos = [];

    for (const [key, items] of grupos.entries()) {
      const [modeloId, tamanho, gramatura] = key.split('|');
      const faixas = new Set(items.map(i => i.qtdMin));

      // Problema 1: Duplicatas (mais de 1 preço para a mesma faixa)
      const faixasComDuplicatas = new Map();
      items.forEach(item => {
        if (!faixasComDuplicatas.has(item.qtdMin)) {
          faixasComDuplicatas.set(item.qtdMin, []);
        }
        faixasComDuplicatas.get(item.qtdMin).push(item);
      });

      for (const [faixa, duplicatas] of faixasComDuplicatas.entries()) {
        if (duplicatas.length > 1) {
          console.log(`⚠️  Duplicata encontrada: ${tamanho} x ${gramatura || 'sem gramatura'} - ${faixa} un (${duplicatas.length} registros)`);

          // Manter o mais recente, deletar os outros
          duplicatas.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          for (let i = 1; i < duplicatas.length; i++) {
            await prisma.tabelaPreco.delete({ where: { id: duplicatas[i].id } });
            deletados++;
            console.log(`   └─ Deletado: ID ${duplicatas[i].id} (R$ ${duplicatas[i].precoUnitario})`);
          }
        }
      }

      // Problema 2: Faixas incompletas (menos de 10 faixas esperadas)
      if (faixas.size < 10) {
        incompletos.push({
          tamanho,
          gramatura: gramatura === 'null' ? null : gramatura,
          faixasEncontradas: Array.from(faixas).sort((a, b) => a - b),
          faixasEsperadas: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
        });
      }
    }

    console.log(`\n✅ Resumo:`);
    console.log(`   • ${deletados} duplicatas deletadas`);
    console.log(`   • ${incompletos.length} configurações incompletas encontradas\n`);

    if (incompletos.length > 0) {
      console.log('⚠️  Configurações incompletas (precisam de resincronização):\n');
      incompletos.forEach((inc) => {
        console.log(`   📦 ${inc.tamanho} ${inc.gramatura ? `(gramatura ${inc.gramatura})` : '(sem gramatura)'}`);
        console.log(`      Faixas encontradas: ${inc.faixasEncontradas.join(', ')}`);
        console.log(`      Faixas esperadas: ${inc.faixasEsperadas.join(', ')}\n`);
      });

      console.log('🔄 Para corrigir as configurações incompletas, execute:');
      console.log('   node scripts/sync-prices-complete.js\n');
    } else {
      console.log('✓ Todas as configurações estão completas (10 faixas cada)!');
    }

  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
