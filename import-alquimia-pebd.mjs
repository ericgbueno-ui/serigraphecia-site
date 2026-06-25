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

// Sacolas Camiseta PEBD - Alquimia (página 6)
const produtosPEBD = [
  // BRANCO E PRETO - R$ 31,90/kg (Tabela 1)
  { cor: 'Branca', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 11.0 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 19.0 },
  { cor: 'Branca', tamanho: '45x60', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 24.0 },
  { cor: 'Branca', tamanho: '50x70', gramatura: '0,11', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 34.0 },
  { cor: 'Branca', tamanho: '60x80', gramatura: '0,11', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 50.0 },

  { cor: 'Preta', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 11.0 },
  { cor: 'Preta', tamanho: '40x50', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 19.0 },
  { cor: 'Preta', tamanho: '45x60', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 24.0 },
  { cor: 'Preta', tamanho: '50x70', gramatura: '0,11', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 34.0 },
  { cor: 'Preta', tamanho: '60x80', gramatura: '0,11', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 50.0 },

  // COLORIDAS - R$ 32,90/kg (Tabela 1)
  { cor: 'Colorida', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 32.90, quantidadePacote: 250, pesoMilheiro: 11.0 },
  { cor: 'Colorida', tamanho: '40x50', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 32.90, quantidadePacote: 250, pesoMilheiro: 19.0 },
  { cor: 'Colorida', tamanho: '45x60', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 32.90, quantidadePacote: 250, pesoMilheiro: 24.0 },
  { cor: 'Colorida', tamanho: '50x70', gramatura: '0,11', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 32.90, quantidadePacote: 250, pesoMilheiro: 34.0 },
  { cor: 'Colorida', tamanho: '60x80', gramatura: '0,11', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 32.90, quantidadePacote: 250, pesoMilheiro: 50.0 },

  // TABELA 2 - Branco/Preto - R$ 31,90/kg
  { cor: 'Branca', tamanho: '15x20', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 3.0 },
  { cor: 'Branca', tamanho: '20x30', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 6.0 },
  { cor: 'Branca', tamanho: '25x35', gramatura: '0,12', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 10.0 },
  { cor: 'Branca', tamanho: '30x40', gramatura: '0,11', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 13.2 },
  { cor: 'Branca', tamanho: '30x40', gramatura: '0,13', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 15.6 },
  { cor: 'Branca', tamanho: '36x48', gramatura: '0,12', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 19.6 },
  { cor: 'Branca', tamanho: '36x48', gramatura: '0,14', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 24.0 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 20.0 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 30.0 },
  { cor: 'Branca', tamanho: '45x60', gramatura: '0,15', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 40.0 },

  { cor: 'Preta', tamanho: '15x20', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 3.0 },
  { cor: 'Preta', tamanho: '20x30', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 6.0 },
  { cor: 'Preta', tamanho: '25x35', gramatura: '0,12', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 10.0 },
  { cor: 'Preta', tamanho: '30x40', gramatura: '0,11', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 13.2 },
  { cor: 'Preta', tamanho: '30x40', gramatura: '0,13', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 15.6 },
  { cor: 'Preta', tamanho: '36x48', gramatura: '0,12', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 19.6 },
  { cor: 'Preta', tamanho: '36x48', gramatura: '0,14', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 24.0 },
  { cor: 'Preta', tamanho: '40x50', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 20.0 },
  { cor: 'Preta', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 30.0 },
  { cor: 'Preta', tamanho: '45x60', gramatura: '0,15', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 40.0 },

  // TABELA 2 - Coloridas - R$ 32,90/kg
  { cor: 'Colorida', tamanho: '20x30', gramatura: '0,10', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 6.0 },
  { cor: 'Colorida', tamanho: '25x35', gramatura: '0,12', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 10.0 },
  { cor: 'Colorida', tamanho: '30x40', gramatura: '0,13', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 15.6 },
  { cor: 'Colorida', tamanho: '36x48', gramatura: '0,14', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 24.0 },
  { cor: 'Colorida', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 30.0 },
  { cor: 'Colorida', tamanho: '45x60', gramatura: '0,15', produto: 'Sacola Camiseta PEBD', tipo: 'PEBD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 40.0 },
];

async function main() {
  try {
    console.log('📦 Importando Sacolas Camiseta PEBD Alquimia...\n');

    let created = 0;
    for (const p of produtosPEBD) {
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
            quantidadePacote: p.quantidadePacote,
            custoMilheiroCents: Math.round(p.pesoMilheiro * p.preco_kg * 100),
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
