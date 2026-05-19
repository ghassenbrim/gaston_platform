CREATE TABLE IF NOT EXISTS "QuoteConfigContent" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "config" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteConfigContent_pkey" PRIMARY KEY ("id")
);
