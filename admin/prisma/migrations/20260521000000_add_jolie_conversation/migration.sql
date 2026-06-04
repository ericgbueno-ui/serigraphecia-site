-- CreateTable
CREATE TABLE IF NOT EXISTS "JolieConversation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phone" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'site',
    "history" JSONB NOT NULL DEFAULT '[]',
    "intent" TEXT,
    "handoffToHuman" BOOLEAN NOT NULL DEFAULT false,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JolieConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "JolieConversation_sessionId_key" ON "JolieConversation"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JolieConversation_phone_idx" ON "JolieConversation"("phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JolieConversation_channel_idx" ON "JolieConversation"("channel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JolieConversation_lastActivity_idx" ON "JolieConversation"("lastActivity");
