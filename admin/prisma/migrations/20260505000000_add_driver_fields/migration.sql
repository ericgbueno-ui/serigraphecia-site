-- AlterTable: adiciona campos de motorista na Booking
ALTER TABLE "Booking" ADD COLUMN "driverName" TEXT;
ALTER TABLE "Booking" ADD COLUMN "driverCar" TEXT;
ALTER TABLE "Booking" ADD COLUMN "driverWhatsapp" TEXT;
ALTER TABLE "Booking" ADD COLUMN "driverNotifiedAt" TIMESTAMP(3);
