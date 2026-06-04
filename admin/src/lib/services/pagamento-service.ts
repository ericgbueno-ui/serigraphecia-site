import { cashflowService } from './cashflow-service';

export const pagamentoService = {
  async marcarPagamentoConcluido(booking: any, pagamento: any) {
    // Pagamento salvo com sucesso logic
    console.log("Pagamento salvo com sucesso", pagamento.id);

    try {
      await cashflowService.addTransaction({
        motoristaId: String(booking.motorista_id),
        categoryId: '1', // categoryId para "Corridas Completadas"
        transactionType: 'INCOME',
        amount: pagamento.valor_centavos / 100,
        description: `Corrida ${booking.viagem_id}`,
        referencePaymentId: String(pagamento.id),
        transactionDate: new Date(pagamento.data_pagamento),
      });
    } catch (cashflowError) {
      console.error('Error creating cashflow transaction:', cashflowError);
      // Não rejeita o pagamento se falhar a criação da transação de cashflow
    }
  }
};
