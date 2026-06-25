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

// Sacolas Modelo Vazada - Alquimia (página 3)
const produtosVazada = [
  // BRANCO E PRETO - R$ 31,90/kg
  // Branca
  { cor: 'Branca', tamanho: '20x30', gramatura: '0,08', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 4.6 },
  { cor: 'Branca', tamanho: '25x35', gramatura: '0,08', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 7.0 },
  { cor: 'Branca', tamanho: '30x40', gramatura: '0,06', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 6.9 },
  { cor: 'Branca', tamanho: '30x40', gramatura: '0,08', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 9.9 },
  { cor: 'Branca', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 11.8 },
  { cor: 'Branca', tamanho: '36x48', gramatura: '0,09', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 15.9 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,08', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 16.0 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,10', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 20.0 },
  { cor: 'Branca', tamanho: '50x60', gramatura: '0,10', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 30.0 },
  { cor: 'Branca', tamanho: '16x22', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 4.6 },
  { cor: 'Branca', tamanho: '20x30', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 8.0 },
  { cor: 'Branca', tamanho: '25x35', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 11.5 },
  { cor: 'Branca', tamanho: '30x40', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 15.6 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 26.0 },

  // Preta
  { cor: 'Preta', tamanho: '20x30', gramatura: '0,08', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 4.6 },
  { cor: 'Preta', tamanho: '25x35', gramatura: '0,08', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 7.0 },
  { cor: 'Preta', tamanho: '30x40', gramatura: '0,06', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 6.9 },
  { cor: 'Preta', tamanho: '30x40', gramatura: '0,08', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 9.9 },
  { cor: 'Preta', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 11.8 },
  { cor: 'Preta', tamanho: '36x48', gramatura: '0,09', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 15.9 },
  { cor: 'Preta', tamanho: '40x50', gramatura: '0,08', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 16.0 },
  { cor: 'Preta', tamanho: '40x50', gramatura: '0,10', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 20.0 },
  { cor: 'Preta', tamanho: '50x60', gramatura: '0,10', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 30.0 },
  { cor: 'Preta', tamanho: '16x22', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 4.6 },
  { cor: 'Preta', tamanho: '20x30', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 8.0 },
  { cor: 'Preta', tamanho: '25x35', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 11.5 },
  { cor: 'Preta', tamanho: '30x40', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 15.6 },
  { cor: 'Preta', tamanho: '40x50', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 500, pesoMilheiro: 26.0 },

  // COLORIDAS - R$ 32,90/kg
  { cor: 'Colorida', tamanho: '20x30', gramatura: '0,08', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 4.6 },
  { cor: 'Colorida', tamanho: '25x35', gramatura: '0,08', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 7.0 },
  { cor: 'Colorida', tamanho: '30x40', gramatura: '0,08', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 10.0 },
  { cor: 'Colorida', tamanho: '36x48', gramatura: '0,09', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 15.9 },
  { cor: 'Colorida', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 12.0 },
  { cor: 'Colorida', tamanho: '40x50', gramatura: '0,10', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 20.0 },
  { cor: 'Colorida', tamanho: '16x22', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 4.6 },
  { cor: 'Colorida', tamanho: '20x30', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 8.0 },
  { cor: 'Colorida', tamanho: '25x35', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 11.5 },
  { cor: 'Colorida', tamanho: '30x40', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 15.6 },
  { cor: 'Colorida', tamanho: '40x50', gramatura: '0,13', produto: 'Sacola Vazada', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 26.0 },
];

async function main() {
  try {
    console.log('📦 Importando Sacolas Vazada Alquimia...\n');

    let created = 0;
    for (const p of produtosVazada) {
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
