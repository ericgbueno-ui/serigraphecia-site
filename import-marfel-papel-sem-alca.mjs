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

// Sacolas de Papel (Kraft) sem Alça - página 26
const produtosPapelSemAlca = [
  { cor: 'Natural', tamanho: 'P-18x31x10.5', produto: 'Sacola Papel Kraft', tipo: 'Sem Alça', preco_kg: 35.00 },
  { cor: 'Natural', tamanho: 'M-24x34x14.0', produto: 'Sacola Papel Kraft', tipo: 'Sem Alça', preco_kg: 28.33 },
  { cor: 'Natural', tamanho: 'G-31x31x17.5', produto: 'Sacola Papel Kraft', tipo: 'Sem Alça', preco_kg: 25.00 },
];

async function main() {
  try {
    console.log('📦 Importando Sacolas de Papel (Kraft) sem Alça...\n');

    let created = 0;
    for (const p of produtosPapelSemAlca) {
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
