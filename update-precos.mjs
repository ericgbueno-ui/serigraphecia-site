#!/usr/bin/env node

import pkg from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function main() {
  try {
    console.log('💰 Atualizando preços do estoque...\n');

    // Alquimia: Branco/Preto R$ 28,90/kg, Colorida/Rosa Bebê R$ 32,90/kg
    const alquimiaBasico = await prisma.estoque.updateMany({
      where: {
        tipo: 'PEAD',
        cor: { in: ['Branco', 'Preto'] },
      },
      data: {
        precoKgCents: 2890, // R$ 28,90
      },
    });

    const alquimiaColorida = await prisma.estoque.updateMany({
      where: {
        tipo: 'PEAD',
        cor: { in: ['Colorida', 'Rosa Bebê'] },
      },
      data: {
        precoKgCents: 3290, // R$ 32,90
      },
    });

    console.log(`✅ Alquimia atualizada:`);
    console.log(`   - ${alquimiaBasico.count} itens R$ 28,90/kg (Branco/Preto)`);
    console.log(`   - ${alquimiaColorida.count} itens R$ 32,90/kg (Colorida/Rosa Bebê)`);

    // Marfel: Branco/Preto R$ 31,00/kg, Coloridas R$ 34,20/kg
    const marfelBasico = await prisma.estoque.updateMany({
      where: {
        tipo: 'HD',
        cor: { in: ['Branco', 'Preto'] },
      },
      data: {
        precoKgCents: 3100, // R$ 31,00
      },
    });

    const marfelColorida = await prisma.estoque.updateMany({
      where: {
        tipo: 'HD',
        cor: { notIn: ['Branco', 'Preto'] },
      },
      data: {
        precoKgCents: 3420, // R$ 34,20
      },
    });

    console.log(`\n✅ Marfel atualizada:`);
    console.log(`   - ${marfelBasico.count} itens R$ 31,00/kg (Branco/Preto)`);
    console.log(`   - ${marfelColorida.count} itens R$ 34,20/kg (Coloridas)`);

    console.log(`\n✨ ${alquimiaBasico.count + alquimiaColorida.count + marfelBasico.count + marfelColorida.count} itens com preços atualizados!`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
