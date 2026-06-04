-- Migration: Lead CRM — Lead, Interaction, LeadEvent
-- Gerada manualmente em 2026-05-01
-- Execute no Neon ou via: npx prisma db push

-- Lead
CREATE TABLE IF NOT EXISTS "Lead" (
  "id"          TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "whatsapp"    TEXT NOT NULL,
  "name"        TEXT,
  "email"       TEXT,
  "origin"      TEXT,
  "destination" TEXT,
  "travelDate"  TIMESTAMP(3),
  "passengers"  INTEGER,
  "valueCents"  INTEGER,
  "score"       INTEGER NOT NULL DEFAULT 0,
  "status"      TEXT NOT NULL DEFAULT 'frio',
  "source"      TEXT NOT NULL DEFAULT 'whatsapp',
  "utmSource"   TEXT,
  "utmMedium"   TEXT,
  "utmCampaign" TEXT,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Lead_whatsapp_key" ON "Lead"("whatsapp");
CREATE INDEX IF NOT EXISTS "Lead_status_idx"    ON "Lead"("status");
CREATE INDEX IF NOT EXISTS "Lead_score_idx"     ON "Lead"("score");
CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead"("createdAt");

-- Interaction
CREATE TABLE IF NOT EXISTS "Interaction" (
  "id"        TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leadId"    TEXT NOT NULL,
  "role"      TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "aiEngine"  TEXT,
  CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Interaction_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Interaction_leadId_idx"    ON "Interaction"("leadId");
CREATE INDEX IF NOT EXISTS "Interaction_createdAt_idx" ON "Interaction"("createdAt");

-- LeadEvent
CREATE TABLE IF NOT EXISTS "LeadEvent" (
  "id"        TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leadId"    TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "points"    INTEGER NOT NULL DEFAULT 0,
  "meta"      JSONB,
  CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LeadEvent_leadId_idx" ON "LeadEvent"("leadId");
CREATE INDEX IF NOT EXISTS "LeadEvent_type_idx"   ON "LeadEvent"("type");
