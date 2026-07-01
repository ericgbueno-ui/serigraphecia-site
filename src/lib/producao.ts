import type { PrismaClient } from "@prisma/client";

/**
 * Fluxo fixo de etapas da produção (Fase 4 — auditoria 2026-07-01).
 * Mantido como array de strings (não enum do banco) para poder ajustar a
 * ordem/nome das etapas no futuro sem precisar de migração.
 */
export const ETAPAS_PRODUCAO = [
  "RECEBIDO",
  "AGUARDANDO_APROVACAO",
  "AGUARDANDO_PRODUCAO",
  "EM_PRODUCAO",
  "PRODUCAO_FINALIZADA",
  "SEPARACAO",
  "PRONTO",
  "ENTREGUE",
  "FINALIZADO",
] as const;

export type EtapaProducao = (typeof ETAPAS_PRODUCAO)[number];

export const ETAPA_LABEL: Record<EtapaProducao, string> = {
  RECEBIDO: "Pedido recebido",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  AGUARDANDO_PRODUCAO: "Aguardando produção",
  EM_PRODUCAO: "Em produção",
  PRODUCAO_FINALIZADA: "Produção finalizada",
  SEPARACAO: "Separação",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
  FINALIZADO: "Finalizado",
};

async function gerarNumeroOrdem(prisma: PrismaClient): Promise<string> {
  const ano = new Date().getFullYear();
  const count = await prisma.ordemProducao.count({
    where: { numero: { startsWith: `OP-${ano}-` } },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `OP-${ano}-${seq}`;
}

/**
 * Gera automaticamente uma Ordem de Produção vinculada ao pedido, caso ainda
 * não exista uma (idempotente — nunca cria duplicada). Chamar sempre que um
 * pedido for aprovado/confirmado.
 */
export async function gerarOrdemProducao(
  prisma: PrismaClient,
  pedidoId: string
): Promise<void> {
  try {
    const existente = await prisma.ordemProducao.findUnique({ where: { pedidoId } });
    if (existente) return;

    const numero = await gerarNumeroOrdem(prisma);
    const ordem = await prisma.ordemProducao.create({
      data: { numero, pedidoId, status: "RECEBIDO" },
    });

    await prisma.ordemProducaoEtapa.create({
      data: { ordemId: ordem.id, etapa: "RECEBIDO" },
    });
  } catch (err) {
    // Nunca impedir a confirmação do pedido por causa da ordem de produção.
    console.error("Erro ao gerar ordem de produção (pedido segue confirmado):", err);
  }
}

/** Avança (ou altera) a etapa de uma ordem, gravando histórico permanente. */
export async function avancarEtapa(
  prisma: PrismaClient,
  ordemId: string,
  novaEtapa: EtapaProducao,
  params?: { responsavelId?: string | null; observacoes?: string | null }
): Promise<void> {
  await prisma.ordemProducao.update({
    where: { id: ordemId },
    data: { status: novaEtapa },
  });
  await prisma.ordemProducaoEtapa.create({
    data: {
      ordemId,
      etapa: novaEtapa,
      responsavelId: params?.responsavelId ?? null,
      observacoes: params?.observacoes ?? null,
    },
  });
}
