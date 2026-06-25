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
    console.log('🏭 Criando fornecedor Porto Amado...\n');

    const portoAmado = await prisma.fornecedor.create({
      data: {
        nome: 'Porto Amado',
        produto: 'Sacolas',
        cidade: 'Canoas',
        estado: 'RS',
        whatsapp: '5151989117767',
        ativo: true,
      },
    });

    console.log('✅ Fornecedor criado com sucesso!\n');
    console.log('📋 Dados:');
    console.log(`   ID: ${portoAmado.id}`);
    console.log(`   Nome: ${portoAmado.nome}`);
    console.log(`   Produtos: ${portoAmado.produto}`);
    console.log(`   Localização: ${portoAmado.cidade}/${portoAmado.estado}`);
    console.log(`   WhatsApp: ${portoAmado.whatsapp}`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
