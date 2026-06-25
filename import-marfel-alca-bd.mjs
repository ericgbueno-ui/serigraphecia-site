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

// Alça Fita BD - Polietileno de BAIXA DENSIDADE (página 22)
const produtosAlcaBD = [
  // Amarela
  { cor: 'Amarela', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'BD', preco_kg: 40.50 },
  { cor: 'Amarela', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'BD', preco_kg: 40.50 },
  { cor: 'Amarela', tamanho: '45x55', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'BD', preco_kg: 40.50 },

  // Azul
  { cor: 'Azul', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'BD', preco_kg: 40.50 },

  // Branca
  { cor: 'Branca', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'BD', preco_kg: 40.50 },

  // Prata
  { cor: 'Prata', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'BD', preco_kg: 40.50 },

  // Preta
  { cor: 'Preta', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'BD', preco_kg: 40.50 },
];

async function main() {
  try {
    console.log('📦 Importando Alça Fita BD...\n');

    let created = 0;
    for (const p of produtosAlcaBD) {
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
