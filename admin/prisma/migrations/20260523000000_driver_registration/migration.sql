-- CreateTable
CREATE TABLE IF NOT EXISTS "Driver" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "carColor" TEXT NOT NULL,
    "carYear" TEXT NOT NULL,
    "carPlate" TEXT NOT NULL,
    "pixKey" TEXT NOT NULL,
    "cadastur" TEXT,
    "companyType" TEXT NOT NULL,
    "acceptedTerms" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Driver_phone_idx" ON "Driver"("phone");
