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
    console.log('🏭 Criando fornecedor RBL...\n');

    const rbl = await prisma.fornecedor.create({
      data: {
        nome: 'RBL',
        produto: 'Sacolas',
        endereco: 'Av. Missões, 230',
        bairro: 'São Geraldo',
        cidade: 'Porto Alegre',
        estado: 'RS',
        cep: '90230-100',
        telefone: '(51) 3337-2183',
        ativo: true,
      },
    });

    console.log('✅ Fornecedor criado com sucesso!\n');
    console.log('📋 Dados:');
    console.log(`   ID: ${rbl.id}`);
    console.log(`   Nome: ${rbl.nome}`);
    console.log(`   Produtos: ${rbl.produto}`);
    console.log(`   Endereço: ${rbl.endereco}, ${rbl.bairro}`);
    console.log(`   ${rbl.cidade}/${rbl.estado} - ${rbl.cep}`);
    console.log(`   Telefone: ${rbl.telefone}`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
