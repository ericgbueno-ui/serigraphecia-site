import type { PrismaClient } from "@prisma/client";

/**
 * Baixa do estoque a quantidade de peças usada em um pedido.
 *
 * Regras:
 * - Tenta achar o item de estoque pelo tipo do produto (e, se houver cor
 *   informada, prioriza o item cujo nome do produto contenha essa cor).
 * - Se nenhum item correspondente for encontrado, não faz nada — o pedido
 *   segue normalmente (estoque é apenas controle interno, não bloqueio).
 * - O estoque PODE ficar negativo: pedidos sempre podem ser feitos mesmo
 *   sem quantidade suficiente em estoque.
 * - Qualquer erro aqui é registrado no log mas NUNCA deve impedir a criação
 *   do pedido — por isso os erros são capturados internamente.
 * - Fase 3 (auditoria 2026-07-01): toda baixa agora grava uma
 *   MovimentacaoEstoque com saldo antes/depois, pedido e usuário responsável,
 *   para rastreabilidade completa e permanente.
 */
export async function baixarEstoque(
  prisma: PrismaClient,
  tipoProduto: string,
  corProduto: string | null | undefined,
  quantidade: number,
  contexto?: { pedidoId?: string | null; userId?: string | null; motivo?: string | null }
): Promise<void> {
  if (!tipoProduto || !quantidade) return;

  try {
    let item: { id: string; quantidade: number } | null = null;

    if (corProduto) {
      item = await prisma.estoque.findFirst({
        where: {
          tipo: { equals: tipoProduto, mode: "insensitive" },
          produto: { contains: corProduto, mode: "insensitive" },
        },
        select: { id: true, quantidade: true },
      });
    }

    if (!item) {
      item = await prisma.estoque.findFirst({
        where: { tipo: { equals: tipoProduto, mode: "insensitive" } },
        orderBy: { quantidade: "desc" },
        select: { id: true, quantidade: true },
      });
    }

    if (!item) return;

    const saldoAnterior = item.quantidade;
    const saldoAtual = saldoAnterior - quantidade;

    await prisma.estoque.update({
      where: { id: item.id },
      data: { quantidade: { decrement: quantidade } },
    });

    await registrarMovimentacao(prisma, {
      estoqueId: item.id,
      tipo: "SAIDA",
      quantidade,
      saldoAnterior,
      saldoAtual,
      pedidoId: contexto?.pedidoId ?? null,
      userId: contexto?.userId ?? null,
      motivo: contexto?.motivo ?? null,
    });
  } catch (err) {
    console.error("Erro ao baixar estoque (pedido segue normalmente):", err);
  }
}

/**
 * Dá entrada no estoque a partir de uma compra de matéria-prima.
 *
 * Regras:
 * - Busca um item de estoque já existente com o mesmo tipo + tamanho +
 *   gramatura + cor (comparação sem distinção de maiúsculas/minúsculas).
 * - Se encontrar, soma a quantidade de peças recebidas.
 * - Se não encontrar, cria um novo item de estoque com essas características.
 * - Qualquer erro aqui é registrado no log mas NUNCA deve impedir o registro
 *   da compra — por isso os erros são capturados internamente.
 * - Fase 3: também grava MovimentacaoEstoque (ENTRADA) com saldo antes/depois.
 */
export async function entrarEstoque(
  prisma: PrismaClient,
  params: {
    tipo: string;
    tamanho?: string | null;
    gramatura?: string | null;
    cor?: string | null;
    pecas: number;
    userId?: string | null;
    motivo?: string | null;
  }
): Promise<void> {
  const { tipo, tamanho, gramatura, cor, pecas, userId, motivo } = params;
  if (!tipo || !pecas) return;

  try {
    const where: any = {
      tipo: { equals: tipo, mode: "insensitive" },
      tamanho: tamanho ? { equals: tamanho, mode: "insensitive" } : null,
      gramatura: gramatura ? { equals: gramatura, mode: "insensitive" } : null,
      cor: cor ? { equals: cor, mode: "insensitive" } : null,
    };

    const item = await prisma.estoque.findFirst({ where, select: { id: true, quantidade: true } });

    if (item) {
      const saldoAnterior = item.quantidade;
      const saldoAtual = saldoAnterior + pecas;
      await prisma.estoque.update({
        where: { id: item.id },
        data: { quantidade: { increment: pecas } },
      });
      await registrarMovimentacao(prisma, {
        estoqueId: item.id,
        tipo: "ENTRADA",
        quantidade: pecas,
        saldoAnterior,
        saldoAtual,
        pedidoId: null,
        userId: userId ?? null,
        motivo: motivo ?? null,
      });
      return;
    }

    const partesNome = [tipo, tamanho, gramatura ? `${gramatura}g` : null, cor].filter(Boolean);
    const novoItem = await prisma.estoque.create({
      data: {
        produto: partesNome.join(" "),
        tipo,
        tamanho: tamanho || null,
        gramatura: gramatura || null,
        cor: cor || null,
        quantidade: pecas,
        unidade: "un",
        minimo: 0,
      },
    });

    await registrarMovimentacao(prisma, {
      estoqueId: novoItem.id,
      tipo: "ENTRADA",
      quantidade: pecas,
      saldoAnterior: 0,
      saldoAtual: pecas,
      pedidoId: null,
      userId: userId ?? null,
      motivo: motivo ?? "Criação do item + entrada inicial",
    });
  } catch (err) {
    console.error("Erro ao dar entrada no estoque (compra segue registrada):", err);
  }
}

async function registrarMovimentacao(
  prisma: PrismaClient,
  params: {
    estoqueId: string;
    tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
    quantidade: number;
    saldoAnterior: number;
    saldoAtual: number;
    pedidoId?: string | null;
    userId?: string | null;
    motivo?: string | null;
  }
): Promise<void> {
  try {
    await prisma.movimentacaoEstoque.create({ data: params });
  } catch (err) {
    // Se a tabela ainda não existir (migração da Fase 3 não aplicada) ou
    // qualquer outro erro, nunca deixar isso quebrar a baixa/entrada real.
    console.error("Erro ao registrar movimentação de estoque:", err);
  }
}

/** Quantidade realmente disponível para vender (Fase 3). */
export function quantidadeDisponivel(item: { quantidade: number; quantidadeReservada: number }): number {
  return item.quantidade - (item.quantidadeReservada || 0);
}
