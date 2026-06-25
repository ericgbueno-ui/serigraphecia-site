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

// Sacola Mochila com Sanfona - BD (página 23)
const produtosMochila = [
  // Branca
  { cor: 'Branca', tamanho: '25x35', gramatura: '0,13', produto: 'Sacola Mochila Sanfona', tipo: 'BD', preco_kg: 36.00 },
  { cor: 'Branca', tamanho: '30x40', gramatura: '0,13', produto: 'Sacola Mochila Sanfona', tipo: 'BD', preco_kg: 36.00 },
  { cor: 'Branca', tamanho: '35x45', gramatura: '0,13', produto: 'Sacola Mochila Sanfona', tipo: 'BD', preco_kg: 36.00 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,13', produto: 'Sacola Mochila Sanfona', tipo: 'BD', preco_kg: 36.00 },
];

async function main() {
  try {
    console.log('📦 Importando Sacola Mochila com Sanfona...\n');

    let created = 0;
    for (const p of produtosMochila) {
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

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
