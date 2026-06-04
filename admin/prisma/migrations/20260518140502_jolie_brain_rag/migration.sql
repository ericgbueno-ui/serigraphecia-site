-- CreateExtension (idempotente)
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable (seguro repetir — só falha se coluna já não existe com DEFAULT, o que é ok)
ALTER TABLE "AffiliatePayment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable Booking — adiciona colunas apenas se ainda não existem
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='cityTourConcluido') THEN
    ALTER TABLE "Booking" ADD COLUMN "cityTourConcluido" BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='driverCityTourCar') THEN
    ALTER TABLE "Booking" ADD COLUMN "driverCityTourCar" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='driverCityTourName') THEN
    ALTER TABLE "Booking" ADD COLUMN "driverCityTourName" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='driverCityTourPaymentCents') THEN
    ALTER TABLE "Booking" ADD COLUMN "driverCityTourPaymentCents" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='driverCityTourWhatsapp') THEN
    ALTER TABLE "Booking" ADD COLUMN "driverCityTourWhatsapp" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='driverInPaymentCents') THEN
    ALTER TABLE "Booking" ADD COLUMN "driverInPaymentCents" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='driverOutPaymentCents') THEN
    ALTER TABLE "Booking" ADD COLUMN "driverOutPaymentCents" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='zohoEventUid') THEN
    ALTER TABLE "Booking" ADD COLUMN "zohoEventUid" TEXT;
  END IF;
END $$;

-- AlterTable Lead (seguro repetir)
ALTER TABLE "Lead" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable MetaAdSpend (idempotente)
CREATE TABLE IF NOT EXISTS "MetaAdSpend" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetaAdSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable JolieBrain (idempotente)
CREATE TABLE IF NOT EXISTS "JolieBrain" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "corePrompt" TEXT NOT NULL,
    "note" TEXT,
    "updatedBy" TEXT DEFAULT 'seed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JolieBrain_pkey" PRIMARY KEY ("id")
);

-- CreateTable JolieKnowledge (idempotente)
CREATE TABLE IF NOT EXISTS "JolieKnowledge" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceRef" TEXT,
    "embedding" vector(1536),
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JolieKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable JolieClientMemory (idempotente)
CREATE TABLE IF NOT EXISTS "JolieClientMemory" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "profile" TEXT NOT NULL DEFAULT 'desconhecido',
    "summary" TEXT,
    "preferences" JSONB,
    "embedding" vector(1536),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JolieClientMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable JolieInsight (idempotente)
CREATE TABLE IF NOT EXISTS "JolieInsight" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "embedding" vector(1536),
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JolieInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotentes)
CREATE INDEX IF NOT EXISTS "MetaAdSpend_date_idx" ON "MetaAdSpend"("date");
CREATE UNIQUE INDEX IF NOT EXISTS "MetaAdSpend_date_accountId_key" ON "MetaAdSpend"("date", "accountId");
CREATE INDEX IF NOT EXISTS "JolieBrain_active_idx" ON "JolieBrain"("active");
CREATE INDEX IF NOT EXISTS "JolieBrain_version_idx" ON "JolieBrain"("version");
CREATE INDEX IF NOT EXISTS "JolieKnowledge_type_idx" ON "JolieKnowledge"("type");
CREATE INDEX IF NOT EXISTS "JolieKnowledge_active_idx" ON "JolieKnowledge"("active");
CREATE INDEX IF NOT EXISTS "JolieKnowledge_source_idx" ON "JolieKnowledge"("source");
CREATE UNIQUE INDEX IF NOT EXISTS "JolieClientMemory_leadId_key" ON "JolieClientMemory"("leadId");
CREATE INDEX IF NOT EXISTS "JolieClientMemory_profile_idx" ON "JolieClientMemory"("profile");
CREATE INDEX IF NOT EXISTS "JolieInsight_converted_idx" ON "JolieInsight"("converted");
CREATE INDEX IF NOT EXISTS "JolieInsight_processed_idx" ON "JolieInsight"("processed");
CREATE INDEX IF NOT EXISTS "JolieInsight_type_idx" ON "JolieInsight"("type");
CREATE INDEX IF NOT EXISTS "Affiliate_active_idx" ON "Affiliate"("active");
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone");

-- AddForeignKey (idempotente via DO block)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'JolieClientMemory_leadId_fkey'
  ) THEN
    ALTER TABLE "JolieClientMemory" ADD CONSTRAINT "JolieClientMemory_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
