-- CreateTable CashflowCategory
CREATE TABLE IF NOT EXISTS "CashflowCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashflowCategory_name_key" UNIQUE ("name")
);

-- CreateIndex on CashflowCategory.type
CREATE INDEX IF NOT EXISTS "CashflowCategory_type_idx" ON "CashflowCategory"("type");

-- CreateTable CashflowTransaction
CREATE TABLE IF NOT EXISTS "CashflowTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "referencePaymentId" TEXT,
    CONSTRAINT "CashflowTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CashflowCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashflowTransaction_referencePaymentId_fkey" FOREIGN KEY ("referencePaymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex on CashflowTransaction fields
CREATE INDEX IF NOT EXISTS "CashflowTransaction_motoristaId_idx" ON "CashflowTransaction"("motoristaId");
CREATE INDEX IF NOT EXISTS "CashflowTransaction_categoryId_idx" ON "CashflowTransaction"("categoryId");
CREATE INDEX IF NOT EXISTS "CashflowTransaction_transactionType_idx" ON "CashflowTransaction"("transactionType");
CREATE INDEX IF NOT EXISTS "CashflowTransaction_transactionDate_idx" ON "CashflowTransaction"("transactionDate");
CREATE INDEX IF NOT EXISTS "CashflowTransaction_motoristaId_transactionDate_idx" ON "CashflowTransaction"("motoristaId", "transactionDate");
