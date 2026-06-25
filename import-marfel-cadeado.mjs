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

// Sacola Modelo Cadeado - HD (página 24)
const produtosCadeado = [
  // 32 x 40 x 0,15
  { cor: 'Branca', tamanho: '32x40', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },
  { cor: 'Ouro', tamanho: '32x40', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },
  { cor: 'Preta', tamanho: '32x40', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },
  { cor: 'Rosa', tamanho: '32x40', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },
  { cor: 'Rosa Bebê', tamanho: '32x40', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },
  { cor: 'Transparente', tamanho: '32x40', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },

  // 42 x 65 x 0,15
  { cor: 'Branca', tamanho: '42x65', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },
  { cor: 'Ouro', tamanho: '42x65', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },
  { cor: 'Preta', tamanho: '42x65', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },
  { cor: 'Rosa', tamanho: '42x65', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },
  { cor: 'Rosa Bebê', tamanho: '42x65', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },
  { cor: 'Transparente', tamanho: '42x65', gramatura: '0,15', produto: 'Sacola Cadeado', tipo: 'HD', preco_kg: 36.00 },
];

async function main() {
  try {
    console.log('📦 Importando Sacola Cadeado...\n');

    let created = 0;
    for (const p of produtosCadeado) {
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
