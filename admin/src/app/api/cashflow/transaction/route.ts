/**
 * POST /api/cashflow/transaction
 * Criar uma nova transação de fluxo de caixa
 *
 * Body:
 * {
 *   motoristaId: number (motorista/driver ID)
 *   categoryId: number (categoria da transação)
 *   transactionType: "INCOME" | "EXPENSE"
 *   amount: number (valor em centavos)
 *   description: string
 *   transactionDate: string (YYYY-MM-DD)
 *   reference_payment_id?: string (opcional, para rastrear pagamentos)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateTransaction } from '@/lib/middleware/validation-middleware';
import { cashflowService } from '@/lib/services/cashflow-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar payload
    const validation = validateTransaction(body);
    if (validation.length > 0) {
      return NextResponse.json(
        { error: 'Validação falhou', details: validation },
        { status: 400 }
      );
    }

    // Criar transação
    const transaction = await cashflowService.addTransaction({
      motoristaId: String(body.motoristaId),
      categoryId: String(body.categoryId),
      transactionType: body.transactionType,
      amount: body.amount,
      description: body.description,
      referencePaymentId: body.reference_payment_id ? String(body.reference_payment_id) : undefined,
      transactionDate: body.transactionDate ? new Date(body.transactionDate) : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        transaction,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar transação' },
      { status: 500 }
    );
  }
}
