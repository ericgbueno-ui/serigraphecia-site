-- AlterTable: adiciona campo para armazenar URL do PDF do contrato gerado automaticamente
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "contractPdfUrl" TEXT;
