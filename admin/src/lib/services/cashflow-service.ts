import { prisma } from "@/lib/prisma";

export interface CreateTransactionInput {
  motoristaId: string;
  categoryId: string;
  transactionType: "INCOME" | "EXPENSE";
  amount: number; // in decimal (e.g., 150.50)
  description: string;
  transactionDate?: Date;
  referencePaymentId?: string;
}

export interface TransactionFilter {
  motoristaId: string;
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  transactionType?: "INCOME" | "EXPENSE";
}

export interface MonthlyBalance {
  month: number;
  year: number;
  income: number;
  expense: number;
  balance: number;
}

/**
 * Add a new transaction to the cashflow system
 */
export async function addTransaction(
  input: CreateTransactionInput
): Promise<any> {
  const amountCents = Math.round(input.amount * 100);

  const transaction = await prisma.cashflowTransaction.create({
    data: {
      motoristaId: input.motoristaId,
      categoryId: input.categoryId,
      transactionType: input.transactionType,
      amountCents,
      description: input.description,
      transactionDate: input.transactionDate || new Date(),
      referencePaymentId: input.referencePaymentId,
    },
    include: {
      category: true,
    },
  });

  return {
    id: transaction.id,
    motoristaId: transaction.motoristaId,
    categoryId: transaction.categoryId,
    categoryName: transaction.category.name,
    transactionType: transaction.transactionType,
    amount: amountCents / 100,
    description: transaction.description,
    transactionDate: transaction.transactionDate,
    referencePaymentId: transaction.referencePaymentId,
    createdAt: transaction.createdAt,
  };
}

/**
 * Retrieve transactions with optional filters
 */
export async function getTransactions(
  filter: TransactionFilter
): Promise<any[]> {
  const transactions = await prisma.cashflowTransaction.findMany({
    where: {
      motoristaId: filter.motoristaId,
      ...(filter.startDate && {
        transactionDate: { gte: filter.startDate },
      }),
      ...(filter.endDate && {
        transactionDate: { lte: filter.endDate },
      }),
      ...(filter.categoryId && {
        categoryId: filter.categoryId,
      }),
      ...(filter.transactionType && {
        transactionType: filter.transactionType,
      }),
    },
    include: {
      category: true,
    },
    orderBy: {
      transactionDate: "desc",
    },
  });

  return transactions.map((t) => ({
    id: t.id,
    motoristaId: t.motoristaId,
    categoryId: t.categoryId,
    categoryName: t.category.name,
    transactionType: t.transactionType,
    amount: t.amountCents / 100,
    description: t.description,
    transactionDate: t.transactionDate,
    referencePaymentId: t.referencePaymentId,
    createdAt: t.createdAt,
  }));
}

/**
 * Calculate monthly balance for a driver
 */
export async function getMonthlyBalance(
  motoristaId: string,
  year: number,
  month: number
): Promise<MonthlyBalance> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const transactions = await prisma.cashflowTransaction.findMany({
    where: {
      motoristaId,
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  let income = 0;
  let expense = 0;

  transactions.forEach((t) => {
    const amount = t.amountCents / 100;
    if (t.transactionType === "INCOME") {
      income += amount;
    } else {
      expense += amount;
    }
  });

  return {
    month,
    year,
    income,
    expense,
    balance: income - expense,
  };
}

/**
 * Get all monthly balances for a driver in a given year
 */
export async function getYearlyBalances(
  motoristaId: string,
  year: number
): Promise<MonthlyBalance[]> {
  const balances: MonthlyBalance[] = [];

  for (let month = 1; month <= 12; month++) {
    const balance = await getMonthlyBalance(motoristaId, year, month);
    balances.push(balance);
  }

  return balances;
}

/**
 * Get total balance for a driver (all time)
 */
export async function getTotalBalance(motoristaId: string): Promise<{
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
}> {
  const transactions = await prisma.cashflowTransaction.findMany({
    where: {
      motoristaId,
    },
  });

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((t) => {
    const amount = t.amountCents / 100;
    if (t.transactionType === "INCOME") {
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }
  });

  return {
    totalIncome,
    totalExpense,
    totalBalance: totalIncome - totalExpense,
  };
}

/**
 * Automatic transaction creation from payment completion
 * Called from pagamento-service when a payment is completed
 */
export async function addTransactionFromPayment(
  motoristaId: string,
  paymentAmount: number,
  paymentId: string,
  viagemId: string
): Promise<any> {
  // Find the "Corridas Completadas" category
  const category = await prisma.cashflowCategory.findUnique({
    where: { name: "Corridas Completadas" },
  });

  if (!category) {
    throw new Error(
      'Category "Corridas Completadas" not found. Run seed script first.'
    );
  }

  return addTransaction({
    motoristaId,
    categoryId: category.id,
    transactionType: "INCOME",
    amount: paymentAmount,
    description: `Corrida ${viagemId}`,
    referencePaymentId: paymentId,
  });
}

export const cashflowService = {
  addTransaction,
  getTransactions,
  getMonthlyBalance,
  getYearlyBalances,
  getTotalBalance,
  addTransactionFromPayment,
};
