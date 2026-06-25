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

// Sacolas Modelo Camiseta - Alquimia (página 2)
const produtosCamiseta = [
  // BRANCO E PRETO - R$ 28,90/kg
  // Branca
  { cor: 'Branca', tamanho: '25x35', gramatura: '0,04', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 3.2 },
  { cor: 'Branca', tamanho: '30x40', gramatura: '0,04', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 4.4 },
  { cor: 'Branca', tamanho: '35x45', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 7.1 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 9.0 },
  { cor: 'Branca', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 12.2 },
  { cor: 'Branca', tamanho: '50x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 13.5 },
  { cor: 'Branca', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 18.9 },
  { cor: 'Branca', tamanho: '60x80', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 250, pesoMilheiro: 30.0 },
  { cor: 'Branca', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 250, pesoMilheiro: 40.0 },
  { cor: 'Branca', tamanho: '90x100', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 250, pesoMilheiro: 56.0 },

  // Preta
  { cor: 'Preta', tamanho: '25x35', gramatura: '0,04', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 3.2 },
  { cor: 'Preta', tamanho: '30x40', gramatura: '0,04', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 4.4 },
  { cor: 'Preta', tamanho: '35x45', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 7.1 },
  { cor: 'Preta', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 9.0 },
  { cor: 'Preta', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 12.2 },
  { cor: 'Preta', tamanho: '50x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 13.5 },
  { cor: 'Preta', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 500, pesoMilheiro: 18.9 },
  { cor: 'Preta', tamanho: '60x80', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 250, pesoMilheiro: 30.0 },
  { cor: 'Preta', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 250, pesoMilheiro: 40.0 },
  { cor: 'Preta', tamanho: '90x100', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90, quantidadePacote: 250, pesoMilheiro: 56.0 },

  // COLORIDAS - R$ 32,90/kg
  // Colorida Padrão
  { cor: 'Colorida', tamanho: '30x40', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 6.2 },
  { cor: 'Colorida', tamanho: '40x50', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 11.0 },
  { cor: 'Colorida', tamanho: '45x60', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 14.0 },
  { cor: 'Colorida', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 19.0 },
  { cor: 'Colorida', tamanho: '60x80', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 250, pesoMilheiro: 30.0 },
  { cor: 'Colorida', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 250, pesoMilheiro: 39.0 },
  { cor: 'Colorida', tamanho: '90x100', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 250, pesoMilheiro: 56.0 },

  // Rosa Bebê
  { cor: 'Rosa Bebê', tamanho: '30x40', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 7.4 },
  { cor: 'Rosa Bebê', tamanho: '40x50', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 12.4 },
  { cor: 'Rosa Bebê', tamanho: '45x60', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 16.6 },
  { cor: 'Rosa Bebê', tamanho: '50x70', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90, quantidadePacote: 500, pesoMilheiro: 22.0 },
];

async function main() {
  try {
    console.log('📦 Importando Sacolas Camiseta Alquimia...\n');

    let created = 0;
    for (const p of produtosCamiseta) {
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
