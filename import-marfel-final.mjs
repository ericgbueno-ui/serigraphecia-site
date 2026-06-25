#!/usr/bin/env node

import pkg from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envFile, 'utf-8');
const lines = envContent.split('\n');
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...rest] = trimmed.split('=');
    let value = rest.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Dados adicionais da Alça Fita com preços maiores (páginas 20+)
const produtosFinais = [
  // SACOLA ALÇA FITA (HD) - R$ 43,20/kg (variação de preço)
  // Ouro
  { cor: 'Ouro', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD-Premium', preco_kg: 43.20 },
  { cor: 'Ouro', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD-Premium', preco_kg: 43.20 },
  { cor: 'Ouro', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD-Premium', preco_kg: 43.20 },
  { cor: 'Ouro', tamanho: '45x55', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD-Premium', preco_kg: 43.20 },

  // Rosa Neon
  { cor: 'Rosa Neon', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD-Premium', preco_kg: 43.20 },
  { cor: 'Rosa Neon', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD-Premium', preco_kg: 43.20 },
  { cor: 'Rosa Neon', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD-Premium', preco_kg: 43.20 },
  { cor: 'Rosa Neon', tamanho: '45x55', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD-Premium', preco_kg: 43.20 },
];

async function main() {
  try {
    console.log('📦 Importando produtos finais da Marfel...\n');

    let created = 0;
    for (const p of produtosFinais) {
      try {
        await prisma.estoque.create({
          data: {
            produto: p.produto,
            tipo: p.tipo,
            tamanho: p.tamanho,
            gramatura: p.gramatura,
            cor: p.cor,
            quantidade: 0,
            unidade: 'un',
            minimo: 0,
            precoKgCents: Math.round(p.preco_kg * 100),
          },
        });
        created++;
      } catch (e) {
        // Pode ser duplicado, ignore
      }
    }

    console.log(`✅ ${created} novos produtos importados!\n`);
    console.log('📊 Variações de preço encontradas:');
    console.log('   - Alça Fita HD Padrão: R$ 38,70/kg');
    console.log('   - Alça Fita HD Premium (Ouro, Rosa Neon): R$ 43,20/kg');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
