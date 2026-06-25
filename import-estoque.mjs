#!/usr/bin/env node

import pkg from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, '.env.local');
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

// Dados de cores e gramaturas extraídos dos PDFs
const estoqueDados = [
  // ALQUIMIA - Sacola Camiseta PEAD
  // Cores: Branco, Preto, Coloridas, Rosa Bebê

  // Branco e Preto R$ 28,90/kg
  { cor: 'Branco', tamanho: '25x35', gramatura: '0,04', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Branco', tamanho: '30x40', gramatura: '0,04', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Branco', tamanho: '35x45', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Branco', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Branco', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Branco', tamanho: '50x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Branco', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Branco', tamanho: '60x80', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Branco', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Branco', tamanho: '90x100', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },

  { cor: 'Preto', tamanho: '25x35', gramatura: '0,04', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Preto', tamanho: '30x40', gramatura: '0,04', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Preto', tamanho: '35x45', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Preto', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Preto', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Preto', tamanho: '50x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Preto', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Preto', tamanho: '60x80', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Preto', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },
  { cor: 'Preto', tamanho: '90x100', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 28.90 },

  // Coloridas R$ 32,90/kg
  { cor: 'Colorida', tamanho: '30x40', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90 },
  { cor: 'Colorida', tamanho: '40x50', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90 },
  { cor: 'Colorida', tamanho: '45x60', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90 },
  { cor: 'Colorida', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90 },
  { cor: 'Colorida', tamanho: '60x80', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90 },
  { cor: 'Colorida', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90 },
  { cor: 'Colorida', tamanho: '90x100', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90 },

  // Rosa Bebê R$ 32,90/kg
  { cor: 'Rosa Bebê', tamanho: '30x40', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90 },
  { cor: 'Rosa Bebê', tamanho: '40x50', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90 },
  { cor: 'Rosa Bebê', tamanho: '45x60', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90 },
  { cor: 'Rosa Bebê', tamanho: '50x70', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'PEAD', preco_kg: 32.90 },

  // MARFEL - Cores disponíveis com R$ 31,00/kg (branco/preto) e R$ 34,20/kg (coloridas)
  { cor: 'Amarela', tamanho: '35x45', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Amarela', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Amarela', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Amarela', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Amarela', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Amarela', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Amarela', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Azul Bebê', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Bebê', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Bebê', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Bebê', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Bebê', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Bebê', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Azul Royal', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Royal', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Royal', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Royal', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Royal', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Azul Royal', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Laranja', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Laranja', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Laranja', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Laranja', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Laranja', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Laranja', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Lilás', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Lilás', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Lilás', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Lilás', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Lilás', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Lilás', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Marrom', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Marrom', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Marrom', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Marrom', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Marrom', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Marrom', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Ouro', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Ouro', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Ouro', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Ouro', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Ouro', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Ouro', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Prata', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Prata', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Prata', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Prata', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Prata', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Prata', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Rosa', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Rosa', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Rosa', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Rosa', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Rosa', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Rosa', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Rosa Neon', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Rosa Neon', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Rosa Neon', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Rosa Neon', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Rosa Neon', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Rosa Neon', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Roxa', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Roxa', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Roxa', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Roxa', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Roxa', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Roxa', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Transparente', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Transparente', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Transparente', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Transparente', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Transparente', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Transparente', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Verde Água', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Água', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Água', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Água', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Água', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Água', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Verde Bandeira', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Bandeira', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Bandeira', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Bandeira', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Bandeira', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Bandeira', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Verde Limão', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Limão', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Limão', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Limão', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Limão', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Verde Limão', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },

  { cor: 'Vermelha', tamanho: '30x40', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Vermelha', tamanho: '40x50', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Vermelha', tamanho: '45x60', gramatura: '0,05', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Vermelha', tamanho: '50x70', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Vermelha', tamanho: '60x80', gramatura: '0,06', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
  { cor: 'Vermelha', tamanho: '70x90', gramatura: '0,07', produto: 'Sacola Camiseta', tipo: 'HD', preco_kg: 34.20 },
];

async function main() {
  try {
    console.log('📦 Importando catálogo de cores, gramaturas e tamanhos...\n');

    let created = 0;
    for (const e of estoqueDados) {
      await prisma.estoque.create({
        data: {
          produto: e.produto,
          tipo: e.tipo,
          tamanho: e.tamanho,
          gramatura: e.gramatura,
          cor: e.cor,
          quantidade: 0, // Inicialmente zero
          unidade: 'un',
          minimo: 0,
        },
      });
      created++;
    }

    console.log(`✅ ${created} registros de estoque criados!\n`);
    console.log('📊 Resumo:');
    console.log('   - Alquimia: Cores (Branco, Preto, Colorida, Rosa Bebê)');
    console.log('   - Marfel: Cores (16+ cores disponíveis)');
    console.log('   - Gramaturas: 0,04 a 0,07mm');
    console.log('   - Tamanhos: 25x35 a 90x100');
    console.log('   - Preços: R$ 28,90/kg (Alquimia) e R$ 31,00-34,20/kg (Marfel)');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
