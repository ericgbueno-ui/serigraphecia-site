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
 */
export async function baixarEstoque(
  prisma: PrismaClient,
  tipoProduto: string,
  corProduto: string | null | undefined,
  quantidade: number
): Promise<void> {
  if (!tipoProduto || !quantidade) return;

  try {
    let item: { id: string } | null = null;

    if (corProduto) {
      item = await prisma.estoque.findFirst({
        where: {
          tipo: { equals: tipoProduto, mode: "insensitive" },
          produto: { contains: corProduto, mode: "insensitive" },
        },
        select: { id: true },
      });
    }

    if (!item) {
      item = await prisma.estoque.findFirst({
        where: { tipo: { equals: tipoProduto, mode: "insensitive" } },
        orderBy: { quantidade: "desc" },
        select: { id: true },
      });
    }

    if (!item) return;

    await prisma.estoque.update({
      where: { id: item.id },
      data: { quantidade: { decrement: quantidade } },
    });
  } catch (err) {
    console.error("Erro ao baixar estoque (pedido segue normalmente):", err);
  }
}
