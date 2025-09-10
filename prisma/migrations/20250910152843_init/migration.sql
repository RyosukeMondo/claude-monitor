-- CreateTable
CREATE TABLE "monitor_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "lastDetectedState" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "lastIdleClearAt" DATETIME,
    "lastIdlePromptAt" DATETIME,
    "pendingBootstrap" BOOLEAN NOT NULL DEFAULT false,
    "clearCompletedAt" DATETIME,
    "bootstrapCleared" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveSeenAt" DATETIME,
    "lastPostrunActionAt" DATETIME,
    "lastDecisionTs" DATETIME,
    "idlePeriodCleared" BOOLEAN NOT NULL DEFAULT false,
    "consecIdleCount" INTEGER NOT NULL DEFAULT 0,
    "consecActiveCount" INTEGER NOT NULL DEFAULT 0,
    "configPath" TEXT,
    "debugMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "daemon_statistics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "uptimeSeconds" REAL NOT NULL DEFAULT 0,
    "restarts" INTEGER NOT NULL DEFAULT 0,
    "configReloads" INTEGER NOT NULL DEFAULT 0,
    "totalDetections" INTEGER NOT NULL DEFAULT 0,
    "totalRecoveries" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "decisionMinIntervalSec" REAL NOT NULL DEFAULT 5.0,
    "clearCompletionFallbackSec" REAL NOT NULL DEFAULT 30.0,
    "consecIdleRequired" INTEGER NOT NULL DEFAULT 3,
    "inactivityIdleSec" REAL NOT NULL DEFAULT 5.0,
    "minRecoveryIntervalSec" REAL NOT NULL DEFAULT 2.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "daemon_statistics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "monitor_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "component_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME,
    "stoppedAt" DATETIME,
    "lastError" TEXT,
    "statistics" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "component_status_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "monitor_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recovery_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "throttledUntil" DATETIME,
    CONSTRAINT "recovery_actions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "monitor_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "configuration_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configPath" TEXT,
    "configHash" TEXT NOT NULL,
    "configData" JSONB NOT NULL,
    "loadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "daemon_statistics_sessionId_key" ON "daemon_statistics"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "component_status_sessionId_name_key" ON "component_status"("sessionId", "name");
