/**
 * GET /api/cashflow/transactions
 * Listar transações com filtros opcionais
 *
 * Query params:
 * ?motoristaId=1
 * &startDate=2026-05-01
 * &endDate=2026-05-31
 */

import { NextRequest, NextResponse } from 'next/server';
import { cashflowService } from '@/lib/services/cashflow-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const motoristaId = searchParams.get('motoristaId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!motoristaId) {
      return NextResponse.json(
        { error: 'motoristaId é obrigatório' },
        { status: 400 }
      );
    }

    const transactions = await cashflowService.getTransactions({
      motoristaId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        count: transactions.length,
        transactions,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao listar transações:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar transações' },
      { status: 500 }
    );
  }
}
