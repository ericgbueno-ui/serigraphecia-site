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
    console.log('🏭 Criando fornecedor Gemir...\n');

    const gemir = await prisma.fornecedor.create({
      data: {
        nome: 'Gemir',
        produto: 'Tindas, Solventes, Emulção, Material de Produção',
        endereco: 'Garibaldi',
        cidade: 'Porto Alegre',
        estado: 'RS',
        ativo: true,
      },
    });

    console.log('✅ Fornecedor criado com sucesso!\n');
    console.log('📋 Dados:');
    console.log(`   ID: ${gemir.id}`);
    console.log(`   Nome: ${gemir.nome}`);
    console.log(`   Produtos: ${gemir.produto}`);
    console.log(`   Localização: ${gemir.endereco}, ${gemir.cidade}/${gemir.estado}`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
