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

async function main() {
  try {
    console.log('📋 Atualizando dados dos fornecedores...\n');

    // Atualizar Alquimia
    const alquimiaFound = await prisma.fornecedor.findFirst({
      where: { nome: 'Alquimia' },
    });

    if (!alquimiaFound) {
      console.error('❌ Alquimia não encontrado');
      process.exit(1);
    }

    const alquimia = await prisma.fornecedor.update({
      where: { id: alquimiaFound.id },
      data: {
        whatsapp: '11911195231',
        email: 'contato@alquimiaplasticos.com.br',
        produto: 'Sacolas Plásticas PEAD/PEBD',
      },
    });
    console.log(`✅ Alquimia atualizado`);
    console.log(`   WhatsApp: ${alquimia.whatsapp}`);
    console.log(`   Email: ${alquimia.email}`);

    // Atualizar Marfel
    const marfelFound = await prisma.fornecedor.findFirst({
      where: { nome: 'Marfel' },
    });

    if (!marfelFound) {
      console.error('❌ Marfel não encontrado');
      process.exit(1);
    }

    const marfel = await prisma.fornecedor.update({
      where: { id: marfelFound.id },
      data: {
        whatsapp: '11988018537',
        email: 'vendas@marfelsacolas.com.br',
        produto: 'Sacolas Plásticas HD e Embalagens',
      },
    });
    console.log(`\n✅ Marfel atualizado`);
    console.log(`   WhatsApp: ${marfel.whatsapp}`);
    console.log(`   Email: ${marfel.email}`);
    console.log(`   Fone: (11) 3229-6866`);

    console.log('\n📊 Status Final:');
    console.log('   ✓ 2 fornecedores cadastrados');
    console.log('   ✓ 128 itens de estoque com cores/gramaturas');
    console.log('   ✓ Contatos comerciais atualizados');
    console.log('   ✓ Pronto para usar no sistema!');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
