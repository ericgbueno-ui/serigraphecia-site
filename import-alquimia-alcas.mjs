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

// Alças - Alquimia (páginas 4-5)
const produtosAlcas = [
  // ALÇA FITA - BRANCO E PRETO - R$ 35,50/kg
  { cor: 'Branca', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 19.0 },
  { cor: 'Branca', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 23.0 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 32.0 },
  { cor: 'Branca', tamanho: '45x55', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 40.0 },
  { cor: 'Branca', tamanho: '30x45', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 20.0 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 28.0 },
  { cor: 'Branca', tamanho: '45x55', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 35.0 },

  { cor: 'Preta', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 19.0 },
  { cor: 'Preta', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 23.0 },
  { cor: 'Preta', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 32.0 },
  { cor: 'Preta', tamanho: '45x55', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 40.0 },
  { cor: 'Preta', tamanho: '30x45', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 20.0 },
  { cor: 'Preta', tamanho: '40x50', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 28.0 },
  { cor: 'Preta', tamanho: '45x55', gramatura: '0,13', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 35.50, quantidadePacote: 250, pesoMilheiro: 35.0 },

  // ALÇA FITA - COLORIDAS - R$ 36,90/kg
  { cor: 'Colorida', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 36.90, quantidadePacote: 250, pesoMilheiro: 19.0 },
  { cor: 'Colorida', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 36.90, quantidadePacote: 250, pesoMilheiro: 23.0 },
  { cor: 'Colorida', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 36.90, quantidadePacote: 250, pesoMilheiro: 32.0 },
  { cor: 'Colorida', tamanho: '45x55', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'PEAD', preco_kg: 36.90, quantidadePacote: 250, pesoMilheiro: 40.0 },

  // ALÇA VAZADA FUNDO - BRANCO, PRETO, TRANSPARENTE - R$ 31,90/kg
  { cor: 'Branca', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 20.0 },
  { cor: 'Branca', tamanho: '40x55', gramatura: '0,15', produto: 'Sacola Alça Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 33.0 },

  { cor: 'Preta', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 20.0 },
  { cor: 'Preta', tamanho: '40x55', gramatura: '0,15', produto: 'Sacola Alça Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 33.0 },

  { cor: 'Transparente', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 20.0 },
  { cor: 'Transparente', tamanho: '40x55', gramatura: '0,15', produto: 'Sacola Alça Vazada', tipo: 'PEAD', preco_kg: 31.90, quantidadePacote: 250, pesoMilheiro: 33.0 },

  // ALÇA VAZADA LATERAL - TODAS AS CORES - R$ 32,90/kg
  { cor: 'Colorida', tamanho: '45x45', gramatura: '0,08', produto: 'Sacola Alça Vazada Lateral', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 250, pesoMilheiro: 16.0 },
  { cor: 'Colorida', tamanho: '55x55', gramatura: '0,10', produto: 'Sacola Alça Vazada Lateral', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 250, pesoMilheiro: 30.0 },

  // ALÇA CADEADO - TODAS AS CORES - R$ 37,00/kg
  { cor: 'Colorida', tamanho: '42x65', gramatura: '0,15', produto: 'Sacola Alça Cadeado', tipo: 'PEAD', preco_kg: 37.00, quantidadePacote: 250, pesoMilheiro: 32.0 },
];

async function main() {
  try {
    console.log('📦 Importando Alças (Fita, Vazada, Cadeado) Alquimia...\n');

    let created = 0;
    for (const p of produtosAlcas) {
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
