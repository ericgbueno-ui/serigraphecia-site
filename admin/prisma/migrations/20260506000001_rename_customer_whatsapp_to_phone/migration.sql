-- AlterTable: renomeia "whatsapp" para "phone" na tabela Customer (idempotente)
-- Só executa se a coluna "whatsapp" ainda existir (evita erro em re-execução)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Customer' AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE "Customer" RENAME COLUMN "whatsapp" TO "phone";
  END IF;
END $$;

-- Recria índice único para "phone" (idempotente)
DROP INDEX IF EXISTS "Customer_whatsapp_key";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'Customer' AND indexname = 'Customer_phone_key'
  ) THEN
    CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
  END IF;
END $$;
