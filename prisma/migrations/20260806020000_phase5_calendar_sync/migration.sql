-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "attendees" JSONB,
ADD COLUMN     "changeKey" TEXT,
ADD COLUMN     "graphEventId" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "onlineMeetingUrl" TEXT,
ADD COLUMN     "organizer" JSONB,
ADD COLUMN     "syncAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "syncError" TEXT,
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "CalendarSyncJob" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarDeltaState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deltaLink" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarDeltaState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarSyncJob_status_nextAttemptAt_idx" ON "CalendarSyncJob"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "CalendarSyncJob_eventId_idx" ON "CalendarSyncJob"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarDeltaState_userId_key" ON "CalendarDeltaState"("userId");

-- CreateIndex
CREATE INDEX "CalendarDeltaState_userId_idx" ON "CalendarDeltaState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_graphEventId_key" ON "CalendarEvent"("graphEventId");

-- CreateIndex
CREATE INDEX "CalendarEvent_graphEventId_idx" ON "CalendarEvent"("graphEventId");

-- AddForeignKey
ALTER TABLE "CalendarSyncJob" ADD CONSTRAINT "CalendarSyncJob_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSyncJob" ADD CONSTRAINT "CalendarSyncJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarDeltaState" ADD CONSTRAINT "CalendarDeltaState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
