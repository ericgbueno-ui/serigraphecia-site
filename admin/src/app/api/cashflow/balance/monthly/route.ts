import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const motoristaId = searchParams.get('motoristaId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!motoristaId || !year || !month) {
      return NextResponse.json(
        { error: 'motoristaId, year, and month are required' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum)) {
      return NextResponse.json(
        { error: 'Invalid parameter values' },
        { status: 400 }
      );
    }

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);

    const transactions = await prisma.cashflowTransaction.findMany({
      where: {
        motoristaId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((transaction) => {
      if (transaction.transactionType === 'INCOME') {
        totalIncome += transaction.amountCents / 100;
      } else if (transaction.transactionType === 'EXPENSE') {
        totalExpense += transaction.amountCents / 100;
      }
    });

    const netBalance = totalIncome - totalExpense;

    return NextResponse.json(
      {
        totalIncome,
        totalExpense,
        netBalance,
        transactionCount: transactions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching monthly balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
