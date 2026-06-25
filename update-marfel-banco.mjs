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

async function main() {
  try {
    console.log('🏦 Atualizando dados bancários do Marfel...\n');

    const marfel = await prisma.fornecedor.findFirst({
      where: { nome: 'Marfel' },
    });

    if (!marfel) {
      console.error('❌ Marfel não encontrado');
      process.exit(1);
    }

    const updated = await prisma.fornecedor.update({
      where: { id: marfel.id },
      data: {
        banco1: 'Banco Itaú S/A',
        agencia1: '0004',
        conta1: '06459-8',
        banco2: 'Banco Bradesco S/A',
        agencia2: '0125',
        conta2: '157455-8',
      },
    });

    console.log('✅ Marfel atualizado com sucesso!\n');
    console.log('🏦 Dados Bancários - Embacolor:');
    console.log(`   ${updated.banco1}: Ag. ${updated.agencia1} | Conta ${updated.conta1}`);
    console.log(`   ${updated.banco2}: Ag. ${updated.agencia2} | Conta ${updated.conta2}`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
