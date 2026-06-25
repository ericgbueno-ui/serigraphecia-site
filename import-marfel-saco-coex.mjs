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

// Saco COEX para Correios - página 35
const produtosCoex = [
  { cor: 'Branca', tamanho: 'PPP-15x20', gramatura: '0,10', produto: 'Saco COEX', tipo: 'Correios', preco_kg: 20.00 },
  { cor: 'Branca', tamanho: 'PP-19x25', gramatura: '0,10', produto: 'Saco COEX', tipo: 'Correios', preco_kg: 20.00 },
  { cor: 'Branca', tamanho: 'P-20x30', gramatura: '0,10', produto: 'Saco COEX', tipo: 'Correios', preco_kg: 18.75 },
  { cor: 'Branca', tamanho: 'M-26x36', gramatura: '0,10', produto: 'Saco COEX', tipo: 'Correios', preco_kg: 16.43 },
  { cor: 'Branca', tamanho: 'G-32x40', gramatura: '0,10', produto: 'Saco COEX', tipo: 'Correios', preco_kg: 15.50 },
  { cor: 'Branca', tamanho: 'GG-40x50', gramatura: '0,10', produto: 'Saco COEX', tipo: 'Correios', preco_kg: 16.00 },
  { cor: 'Branca', tamanho: 'GG2-50x60', gramatura: '0,10', produto: 'Saco COEX', tipo: 'Correios', preco_kg: 18.00 },
];

async function main() {
  try {
    console.log('📦 Importando Saco COEX para Correios...\n');

    let created = 0;
    for (const p of produtosCoex) {
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
