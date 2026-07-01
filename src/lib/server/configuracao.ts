import type { PrismaClient } from "@prisma/client";

/**
 * Configurações do sistema em chave/valor (Fase 3 — auditoria 2026-07-01).
 * Permite mudar regras de negócio (ex: em que etapa o estoque é baixado)
 * direto no admin, sem precisar alterar código-fonte.
 */

export const CHAVE_GATILHO_BAIXA_ESTOQUE = "estoque_gatilho_baixa";

// Valores possíveis: "criacao" | "confirmacao" | "producao"
// "criacao" preserva o comportamento atual do sistema (baixa ao criar o
// orçamento/pedido) — é o padrão, para não mudar nada sem decisão explícita.
export const GATILHO_PADRAO = "criacao";

export async function obterConfiguracao(
  prisma: PrismaClient,
  chave: string,
  padrao: string
): Promise<string> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave } });
    return row?.valor ?? padrao;
  } catch (err) {
    console.error(`Configuração "${chave}" indisponível, usando padrão:`, err);
    return padrao;
  }
}

export async function definirConfiguracao(
  prisma: PrismaClient,
  chave: string,
  valor: string,
  descricao?: string
): Promise<void> {
  await prisma.configuracao.upsert({
    where: { chave },
    update: { valor },
    create: { chave, valor, descricao },
  });
}

export async function getGatilhoBaixaEstoque(prisma: PrismaClient): Promise<string> {
  return obterConfiguracao(prisma, CHAVE_GATILHO_BAIXA_ESTOQUE, GATILHO_PADRAO);
}
