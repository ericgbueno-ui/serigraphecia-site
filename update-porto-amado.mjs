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
    console.log('📧 Atualizando email Porto Amado...\n');

    const updated = await prisma.fornecedor.update({
      where: { id: 'cmqtlqsck00004h1yclxmj1at' },
      data: {
        email: 'portoamado.embalagens@gmail.com',
      },
    });

    console.log('✅ Email atualizado!\n');
    console.log('📋 Dados:');
    console.log(`   Nome: ${updated.nome}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   WhatsApp: ${updated.whatsapp}`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
