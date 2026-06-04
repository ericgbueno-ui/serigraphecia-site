-- CreateTable
CREATE TABLE IF NOT EXISTS "AffiliatePayment" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliatePayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AffiliatePayment"
    ADD CONSTRAINT "AffiliatePayment_affiliateId_fkey"
    FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
