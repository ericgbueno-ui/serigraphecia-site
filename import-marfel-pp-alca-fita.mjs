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

// Dados dos produtos PP e Alça Fita (páginas 17-19)
const produtosAdicionais = [
  // SACOLA MODELO VAZADA FEITA EM POLIPROPILENO (PP)
  // Transparente - R$ 39,60/kg
  { cor: 'Transparente', tamanho: '15x25', gramatura: '0,10', produto: 'Sacola Vazada PP', tipo: 'PP', preco_kg: 39.60 },
  { cor: 'Transparente', tamanho: '20x30', gramatura: '0,10', produto: 'Sacola Vazada PP', tipo: 'PP', preco_kg: 39.60 },
  { cor: 'Transparente', tamanho: '25x35', gramatura: '0,10', produto: 'Sacola Vazada PP', tipo: 'PP', preco_kg: 39.60 },
  { cor: 'Transparente', tamanho: '30x40', gramatura: '0,10', produto: 'Sacola Vazada PP', tipo: 'PP', preco_kg: 39.60 },
  { cor: 'Transparente', tamanho: '36x48', gramatura: '0,10', produto: 'Sacola Vazada PP', tipo: 'PP', preco_kg: 39.60 },
  { cor: 'Transparente', tamanho: '40x50', gramatura: '0,10', produto: 'Sacola Vazada PP', tipo: 'PP', preco_kg: 39.60 },

  // SACOLA MODELO ALÇA FITA (HD)
  // Polietileno de ALTA DENSIDADE - R$ 38,70/kg
  // Amarela
  { cor: 'Amarela', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Amarela', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Amarela', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Amarela', tamanho: '45x55', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Azul Real
  { cor: 'Azul Royal', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Azul Royal', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Azul Royal', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Branca
  { cor: 'Branca', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Branca', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Branca', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Laranja
  { cor: 'Laranja', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Laranja', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Laranja', tamanho: '40x50', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Prata
  { cor: 'Prata', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Preta
  { cor: 'Preta', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Preta', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Rosa
  { cor: 'Rosa', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
  { cor: 'Rosa', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Rosa Bebê
  { cor: 'Rosa Bebê', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Transparente
  { cor: 'Transparente', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Verde Limão
  { cor: 'Verde Limão', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Vermelha
  { cor: 'Vermelha', tamanho: '27x40', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Azul Bebê
  { cor: 'Azul Bebê', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Lilás
  { cor: 'Lilás', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Marrom
  { cor: 'Marrom', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Roxa
  { cor: 'Roxa', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },

  // Verde Água
  { cor: 'Verde Água', tamanho: '30x45', gramatura: '0,15', produto: 'Sacola Alça Fita', tipo: 'HD', preco_kg: 38.70 },
];

async function main() {
  try {
    console.log('📦 Importando Sacola Vazada PP e Sacola Alça Fita...\n');

    let created = 0;
    for (const p of produtosAdicionais) {
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
    console.log('📊 Novos modelos:');
    console.log('   - Sacola Vazada Polipropileno (PP) - R$ 39,60/kg');
    console.log('   - Sacola Alça Fita (HD) - R$ 38,70/kg');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
