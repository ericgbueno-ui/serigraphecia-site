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

// Camiseta Reciclada - página 33
// ⚠️ NÃO ACEITA TINTA!
const produtosCamisetaReciclada = [
  // Verde
  { cor: 'Verde', tamanho: '30x40', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Verde', preco_kg: 12.00 },
  { cor: 'Verde', tamanho: '35x45', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Verde', preco_kg: 12.00 },
  { cor: 'Verde', tamanho: '40x50', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Verde', preco_kg: 12.00 },
  { cor: 'Verde', tamanho: '45x60', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Verde', preco_kg: 12.00 },
  { cor: 'Verde', tamanho: '50x70', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Verde', preco_kg: 12.00 },
  { cor: 'Verde', tamanho: '60x80', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Verde', preco_kg: 12.00 },
  { cor: 'Verde', tamanho: '70x90', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Verde', preco_kg: 12.00 },
  { cor: 'Verde', tamanho: '90x100', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Verde', preco_kg: 12.00 },

  // Preta
  { cor: 'Preta', tamanho: '30x40', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Preta', preco_kg: 12.00 },
  { cor: 'Preta', tamanho: '35x45', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Preta', preco_kg: 12.00 },
  { cor: 'Preta', tamanho: '40x50', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Preta', preco_kg: 12.00 },
  { cor: 'Preta', tamanho: '45x60', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Preta', preco_kg: 12.00 },
  { cor: 'Preta', tamanho: '50x70', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Preta', preco_kg: 12.00 },
  { cor: 'Preta', tamanho: '60x80', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Preta', preco_kg: 12.00 },
  { cor: 'Preta', tamanho: '70x90', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Preta', preco_kg: 12.00 },
  { cor: 'Preta', tamanho: '90x100', gramatura: 'Reciclada', produto: 'Camiseta Reciclada', tipo: 'Preta', preco_kg: 12.00 },
];

async function main() {
  try {
    console.log('📦 Importando Camiseta Reciclada...\n');
    console.log('⚠️  IMPORTANTE: Camiseta reciclada NÃO ACEITA TINTA!\n');

    let created = 0;
    for (const p of produtosCamisetaReciclada) {
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
