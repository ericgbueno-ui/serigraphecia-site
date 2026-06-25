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

// Dados adicionais de produtos Marfel extraídos do PDF (páginas 10-16)
const produtosExtras = [
  // SACOLA MODELO ALÇA VAZADA - HD
  // Amarela
  { cor: 'Amarela', tamanho: '35x45', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Azul Bebê
  { cor: 'Azul Bebê', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Bebê', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Bebê', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Azul Royal
  { cor: 'Azul Royal', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Branca
  { cor: 'Branca', tamanho: '16x22', gramatura: '0,10', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 36.20 },
  { cor: 'Branca', tamanho: '20x30', gramatura: '0,08', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Branca', tamanho: '20x30', gramatura: '0,12', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Branca', tamanho: '25x35', gramatura: '0,08', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Branca', tamanho: '25x35', gramatura: '0,12', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Branca', tamanho: '30x40', gramatura: '0,08', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Branca', tamanho: '30x40', gramatura: '0,12', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Branca', tamanho: '36x48', gramatura: '0,09', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,10', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,12', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Bordô
  { cor: 'Bordô', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'BD', preco_kg: 36.00 },

  // Cobre
  { cor: 'Cobre', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Alça Vazada', tipo: 'BD', preco_kg: 36.00 },

  // Creme
  { cor: 'Creme', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Alça Vazada', tipo: 'BD', preco_kg: 36.00 },

  // Laranja
  { cor: 'Laranja', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Laranja', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Lilás
  { cor: 'Lilás', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Marrom
  { cor: 'Marrom', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Ouro
  { cor: 'Ouro', tamanho: '30x40', gramatura: '0,08', produto: 'Sacola Alça Vazada', tipo: 'BD', preco_kg: 36.00 },

  // Prata
  { cor: 'Prata', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Preta
  { cor: 'Preta', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Preta', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Alça Vazada', tipo: 'BD', preco_kg: 36.00 },

  // Rosa
  { cor: 'Rosa', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Rosa Bebê
  { cor: 'Rosa Bebê', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Alça Vazada', tipo: 'BD', preco_kg: 36.00 },

  // Rosa Neon
  { cor: 'Rosa Neon', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Salmão
  { cor: 'Salmão', tamanho: '30x40', gramatura: '0,12', produto: 'Sacola Alça Vazada', tipo: 'BD', preco_kg: 36.00 },

  // Transparente
  { cor: 'Transparente', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Verde Água
  { cor: 'Verde Água', tamanho: '30x40', gramatura: '0,12', produto: 'Sacola Alça Vazada', tipo: 'BD', preco_kg: 36.00 },

  // Verde Bandeira
  { cor: 'Verde Bandeira', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },

  // Verde Limão
  { cor: 'Verde Limão', tamanho: '30x40', gramatura: '0,12', produto: 'Sacola Alça Vazada', tipo: 'BD', preco_kg: 36.00 },

  // Vermelha
  { cor: 'Vermelha', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Vermelha', tamanho: '45x60', gramatura: '0,12', produto: 'Sacola Alça Vazada', tipo: 'BD', preco_kg: 36.00 },

  // Vinho
  { cor: 'Vinho', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Alça Vazada', tipo: 'BD', preco_kg: 36.00 },

  // Roxa
  { cor: 'Roxa', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Alça Vazada', tipo: 'HD', preco_kg: 34.20 },
];

async function main() {
  try {
    console.log('📦 Importando produtos extras da Marfel...\n');

    let created = 0;
    for (const p of produtosExtras) {
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
    console.log('📊 Resumo de novos modelos:');
    console.log('   - Sacola Alça Vazada (HD)');
    console.log('   - Sacola Alça Vazada (BD)');
    console.log(`   - ${created} combinações de cores, tamanhos e gramaturas`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
