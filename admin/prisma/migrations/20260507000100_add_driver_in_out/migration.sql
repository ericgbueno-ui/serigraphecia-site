-- AlterTable: adiciona campos de motorista separados para Chegada (IN) e Retorno (OUT)
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "driverInName"     TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "driverInCar"      TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "driverInWhatsapp" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "driverOutName"    TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "driverOutCar"     TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "driverOutWhatsapp" TEXT;
