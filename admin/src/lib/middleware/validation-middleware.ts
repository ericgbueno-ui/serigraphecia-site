interface TransactionInput {
  motoristaId: unknown;
  categoryId: unknown;
  transactionType: unknown;
  amount: unknown;
  description: unknown;
  transactionDate: unknown;
}

interface ValidationError {
  field: string;
  message: string;
}

export function validateTransaction(input: TransactionInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate motoristaId
  if (typeof input.motoristaId !== 'number' || input.motoristaId <= 0) {
    errors.push({
      field: 'motoristaId',
      message: 'motoristaId must be a positive integer',
    });
  }

  // Validate categoryId
  if (typeof input.categoryId !== 'number' || input.categoryId <= 0) {
    errors.push({
      field: 'categoryId',
      message: 'categoryId must be a positive integer',
    });
  }

  // Validate transactionType
  if (
    typeof input.transactionType !== 'string' ||
    !['INCOME', 'EXPENSE'].includes(input.transactionType)
  ) {
    errors.push({
      field: 'transactionType',
      message: 'transactionType must be either "INCOME" or "EXPENSE"',
    });
  }

  // Validate amount
  if (typeof input.amount !== 'number' || input.amount <= 0) {
    errors.push({
      field: 'amount',
      message: 'amount must be a positive number',
    });
  }

  // Validate description (XSS prevention)
  if (typeof input.description !== 'string' || input.description.trim() === '') {
    errors.push({
      field: 'description',
      message: 'description must be a non-empty string',
    });
  }

  // Sanitize description to prevent XSS
  const sanitizedDescription = typeof input.description === 'string'
    ? input.description
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
    : '';

  // Validate transactionDate
  if (typeof input.transactionDate !== 'string') {
    errors.push({
      field: 'transactionDate',
      message: 'transactionDate must be an ISO 8601 date string',
    });
  } else {
    const date = new Date(input.transactionDate);
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'transactionDate',
        message: 'transactionDate must be a valid ISO 8601 date',
      });
    }
  }

  return errors;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
