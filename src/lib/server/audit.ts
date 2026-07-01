import type { PrismaClient } from "@prisma/client";

/**
 * Helper genérico de auditoria — grava em HistoricoAlteracao.
 *
 * Uso recomendado ao alterar qualquer campo sensível (datas de pedido, status,
 * valores financeiros, dados de cliente, estoque, etc.):
 *
 *   await registrarHistorico(prisma, {
 *     entidade: "Pedido",
 *     entidadeId: pedido.id,
 *     campo: "dataPrevistaEntrega",
 *     valorAnterior: pedido.dataPrevistaEntrega?.toISOString() ?? null,
 *     valorNovo: novaData.toISOString(),
 *     userId: usuarioAtual?.id ?? null,
 *     motivo: motivoOpcional,
 *   });
 *
 * Erros aqui são logados mas NUNCA devem impedir a operação principal —
 * mesmo princípio já usado em baixarEstoque/entrarEstoque.
 */
export async function registrarHistorico(
  prisma: PrismaClient,
  params: {
    entidade: string;
    entidadeId: string;
    campo: string;
    valorAnterior?: string | null;
    valorNovo?: string | null;
    userId?: string | null;
    motivo?: string | null;
  }
): Promise<void> {
  try {
    await prisma.historicoAlteracao.create({
      data: {
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        campo: params.campo,
        valorAnterior: params.valorAnterior ?? null,
        valorNovo: params.valorNovo ?? null,
        userId: params.userId ?? null,
        motivo: params.motivo ?? null,
      },
    });
  } catch (err) {
    console.error("Erro ao registrar histórico de alteração:", err);
  }
}

/**
 * Compara um objeto "antes" e "depois" e grava um HistoricoAlteracao para
 * cada campo que mudou. Útil em rotas de update genéricas.
 */
export async function registrarDiferencas(
  prisma: PrismaClient,
  params: {
    entidade: string;
    entidadeId: string;
    antes: Record<string, unknown>;
    depois: Record<string, unknown>;
    userId?: string | null;
    motivo?: string | null;
  }
): Promise<void> {
  const { entidade, entidadeId, antes, depois, userId, motivo } = params;
  const campos = new Set([...Object.keys(antes), ...Object.keys(depois)]);

  for (const campo of campos) {
    const anterior = antes[campo];
    const novo = depois[campo];
    const anteriorStr = anterior === undefined || anterior === null ? null : String(anterior);
    const novoStr = novo === undefined || novo === null ? null : String(novo);
    if (anteriorStr === novoStr) continue;

    await registrarHistorico(prisma, {
      entidade,
      entidadeId,
      campo,
      valorAnterior: anteriorStr,
      valorNovo: novoStr,
      userId,
      motivo,
    });
  }
}
