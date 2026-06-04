-- AlterTable: adiciona flags de corrida concluída (Chegada IN e Retorno OUT)
ALTER TABLE "Booking" ADD COLUMN "idaConcluida" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN "voltaConcluida" BOOLEAN NOT NULL DEFAULT false;
