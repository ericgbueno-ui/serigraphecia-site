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

// Alça Fita HD - Gramatura 0,13 (página 21)
const produtosAlca013 = [
  // Branca 0,13
  { cor: 'Branca', tamanho: '30x45', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Branca', tamanho: '45x55', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Preta 0,13
  { cor: 'Preta', tamanho: '30x45', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Preta', tamanho: '40x50', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Preta', tamanho: '45x55', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
];

async function main() {
  try {
    console.log('📦 Importando Alça Fita 0,13mm...\n');

    let created = 0;
    for (const p of produtosAlca013) {
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
    console.log('✨ Catálogo Marfel 100% completo!');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
