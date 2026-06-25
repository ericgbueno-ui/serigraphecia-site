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

// Função para calcular peso estimado por unidade em gramas
function estimarPesoUnidade(tamanho, gramatura) {
  if (!tamanho || !gramatura) return 1; // default 1g

  const [l, a] = tamanho.split('x').map(x => parseInt(x));
  if (!l || !a) return 1;

  const grama = parseFloat(gramatura);
  if (!grama) return 1;

  // Volume em cm³ (assumindo saco fechado)
  const volumeCm3 = l * a * (grama * 100); // gramatura em mm * 100 = cm

  // Densidade PEAD/PEBD/PP ≈ 0.9-1.0 g/cm³
  const peso = volumeCm3 * 0.95; // em gramas

  // Para sacos com alça, adiciona ~10-20%
  return Math.max(0.5, peso * 1.15);
}

// Função para calcular custo/milheiro
function calcularCustoMilheiro(precoKgCents, tamanho, gramatura) {
  const precoKg = precoKgCents / 100; // converter de centavos para reais
  const pesoUniG = estimarPesoUnidade(tamanho, gramatura);
  const pesoUniKg = pesoUniG / 1000;

  // Custo por unidade em reais
  const custoPorUni = precoKg * pesoUniKg;

  // Custo por milheiro (1000 unidades) em reais
  const custoMilheiro = custoPorUni * 1000;

  // Retornar em centavos
  return Math.round(custoMilheiro * 100);
}

// Mapa de quantidades por pacote para cada tipo/tamanho
const quantidadesPorPacote = {
  'Sacola Papel Kraft|Com Alça': 100,
  'Sacola Papel Kraft|Sem Alça': 100,
  'Saco COEX|Correios': 250,
  'Camiseta Reciclada|Verde': 500, // estimado
  'Camiseta Reciclada|Preta': 500,
  'Sacola Mochila Sanfona|BD': 500, // estimado
  'Sacola Cadeado|HD': 500, // estimado
};

async function main() {
  try {
    console.log('🔄 Atualizando campos de estoque...\n');

    // Buscar todos os registros de Marfel
    const estoques = await prisma.estoque.findMany();

    let updated = 0;
    for (const estoque of estoques) {
      const key = `${estoque.produto}|${estoque.tipo}`;

      // Atualizar quantidadePacote
      const qtdPacote = quantidadesPorPacote[key] || null;

      // Calcular custoMilheiro
      let custoMilheiro = null;
      if (estoque.precoKgCents && estoque.tamanho && estoque.gramatura) {
        custoMilheiro = calcularCustoMilheiro(estoque.precoKgCents, estoque.tamanho, estoque.gramatura);
      }

      if (qtdPacote || custoMilheiro) {
        await prisma.estoque.update({
          where: { id: estoque.id },
          data: {
            quantidadePacote: qtdPacote,
            custoMilheiroCents: custoMilheiro,
          },
        });
        updated++;
      }
    }

    console.log(`✅ ${updated} registros atualizados!\n`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
