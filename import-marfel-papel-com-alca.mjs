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

// Sacolas de Papel (Kraft) com Alça - página 25
const produtosPapelComAlca = [
  { cor: 'Natural', tamanho: 'PP-18x22x10.5', produto: 'Sacola Papel Kraft', tipo: 'Com Alça', preco_kg: 34.62 },
  { cor: 'Natural', tamanho: 'P-24x36x13.5', produto: 'Sacola Papel Kraft', tipo: 'Com Alça', preco_kg: 26.15 },
  { cor: 'Natural', tamanho: 'M1-31x33x12.5', produto: 'Sacola Papel Kraft', tipo: 'Com Alça', preco_kg: 22.40 },
  { cor: 'Natural', tamanho: 'M2-31x31x17.5', produto: 'Sacola Papel Kraft', tipo: 'Com Alça', preco_kg: 22.59 },
  { cor: 'Natural', tamanho: 'G1-31x39x12.5', produto: 'Sacola Papel Kraft', tipo: 'Com Alça', preco_kg: 22.80 },
  { cor: 'Natural', tamanho: 'G2-31x37x19.0', produto: 'Sacola Papel Kraft', tipo: 'Com Alça', preco_kg: 25.20 },
  { cor: 'Natural', tamanho: 'GG-31x49x12.5', produto: 'Sacola Papel Kraft', tipo: 'Com Alça', preco_kg: 21.07 },
];

async function main() {
  try {
    console.log('📦 Importando Sacolas de Papel (Kraft) com Alça...\n');

    let created = 0;
    for (const p of produtosPapelComAlca) {
      try {
        await prisma.estoque.create({
          data: {
            produto: p.produto,
            tipo: p.tipo,
            tamanho: p.tamanho,
            gramatura: 'Papel',
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
