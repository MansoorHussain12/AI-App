-- Provider config tables for persisted model switching
CREATE TABLE IF NOT EXISTS "ProviderConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "defaultLlmProvider" TEXT NOT NULL DEFAULT 'OLLAMA',
  "defaultEmbedProvider" TEXT NOT NULL DEFAULT 'OLLAMA',
  "allowRemoteHf" BOOLEAN NOT NULL DEFAULT false,
  "allowRemoteHfContext" BOOLEAN NOT NULL DEFAULT false,
  "hfApiToken" TEXT,
  "hfChatModel" TEXT,
  "hfEmbedModel" TEXT,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "UserProviderPreference" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "llmProvider" TEXT,
  "embedProvider" TEXT,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserProviderPreference_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT OR IGNORE INTO "ProviderConfig" ("id") VALUES ('singleton');
