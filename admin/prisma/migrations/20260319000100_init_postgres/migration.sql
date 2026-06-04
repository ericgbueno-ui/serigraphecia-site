CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "commIda" INTEGER NOT NULL DEFAULT 2500,
    "commIdaVolta" INTEGER NOT NULL DEFAULT 5000,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publicToken" TEXT NOT NULL,
    "affiliateCode" TEXT,
    "commissionCents" INTEGER,
    "commissionPaid" BOOLEAN NOT NULL DEFAULT false,
    "routeLabel" TEXT,
    "origin" TEXT NOT NULL,
    "dest" TEXT NOT NULL,
    "tripType" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "passengerCount" INTEGER NOT NULL,
    "hotel" TEXT,
    "hotelAddress" TEXT,
    "idaDate" TIMESTAMP(3),
    "idaFlightTime" TEXT,
    "idaFlightNumber" TEXT,
    "voltaDate" TIMESTAMP(3),
    "voltaFlightTime" TEXT,
    "voltaFlightNumber" TEXT,
    "payMethod" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "depositCents" INTEGER NOT NULL,
    "remainderCents" INTEGER NOT NULL,
    "optionalsJson" TEXT,
    "optionalsCents" INTEGER NOT NULL DEFAULT 0,
    "contractAcceptedAt" TIMESTAMP(3),
    "contractAcceptedVersion" TEXT,
    "status" TEXT NOT NULL,
    "mpPreferenceId" TEXT,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Passenger" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "Passenger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "providerId" TEXT,
    "paidAt" TIMESTAMP(3),
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Affiliate_email_key" ON "Affiliate"("email");
CREATE UNIQUE INDEX "Affiliate_code_key" ON "Affiliate"("code");
CREATE UNIQUE INDEX "Booking_publicToken_key" ON "Booking"("publicToken");
CREATE UNIQUE INDEX "Payment_providerId_key" ON "Payment"("providerId");

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_affiliateCode_fkey"
FOREIGN KEY ("affiliateCode") REFERENCES "Affiliate"("code")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Passenger"
ADD CONSTRAINT "Passenger_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
