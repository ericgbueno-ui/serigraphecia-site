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
    console.log('📋 Atualizando dados completos do Marfel...\n');

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
        razaoSocial: 'Embacolor Distribuidora de Embalagens EIRELI',
        cnpj: '31943653000138',
        endereco: 'Rua da Cantareira, 604',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01024-000',
        telefone: '(11) 3229-6866',
        whatsapp: '11988018537',
        email: 'vendas@marfelsacolas.com.br',
        emailAdicional: 'adm1@marfelsacolas.com.br',
        site: 'https://www.marfelsacolas.com.br',
      },
    });

    console.log('✅ Marfel atualizado com sucesso!\n');
    console.log('📊 Dados cadastrados:');
    console.log(`   Razão Social: ${updated.razaoSocial}`);
    console.log(`   CNPJ: ${updated.cnpj?.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}`);
    console.log(`   Endereço: ${updated.endereco}, ${updated.bairro}`);
    console.log(`   ${updated.cidade}/${updated.estado} - CEP: ${updated.cep}`);
    console.log(`   Telefone: ${updated.telefone}`);
    console.log(`   WhatsApp: ${updated.whatsapp}`);
    console.log(`   Emails: ${updated.email} / ${updated.emailAdicional}`);
    console.log(`   Site: ${updated.site}`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
