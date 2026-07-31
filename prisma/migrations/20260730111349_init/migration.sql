-- CreateEnum
DO $$ BEGIN CREATE TYPE "EntityStatus" AS ENUM ('Active', 'Inactive', 'Prospect'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "LeadStatus" AS ENUM ('New', 'Contacted', 'Qualified', 'Converted', 'Disqualified'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "PipelineStageName" AS ENUM ('Discovery', 'Qualification', 'Proposal', 'Negotiation', 'ClosedWon', 'ClosedLost'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ActivityType" AS ENUM ('Call', 'Email', 'Meeting', 'Task', 'Note'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ActivityStatus" AS ENUM ('Planned', 'Completed', 'Cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "TicketStatus" AS ENUM ('Open', 'InProgress', 'Resolved', 'Closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "TicketPriority" AS ENUM ('Low', 'Medium', 'High', 'Critical'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "NotificationType" AS ENUM ('Info', 'Warning', 'Success', 'Error'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable User
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    image TEXT,
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Company
CREATE TABLE IF NOT EXISTS "Company" (
    id TEXT PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    country TEXT,
    city TEXT,
    address TEXT,
    "employeeCount" INTEGER,
    status TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Customer
CREATE TABLE IF NOT EXISTS "Customer" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status "EntityStatus" NOT NULL DEFAULT 'Active',
    "companyId" TEXT REFERENCES "Company"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Contact
CREATE TABLE IF NOT EXISTS "Contact" (
    id TEXT PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT,
    "companyId" TEXT REFERENCES "Company"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable PipelineStage
CREATE TABLE IF NOT EXISTS "PipelineStage" (
    id TEXT PRIMARY KEY,
    name "PipelineStageName" NOT NULL DEFAULT 'Discovery',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Opportunity
CREATE TABLE IF NOT EXISTS "Opportunity" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL DEFAULT 0,
    probability INTEGER NOT NULL DEFAULT 0,
    "stageId" TEXT REFERENCES "PipelineStage"(id),
    "customerId" TEXT REFERENCES "Customer"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Lead
CREATE TABLE IF NOT EXISTS "Lead" (
    id TEXT PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    "companyName" TEXT,
    source TEXT,
    status "LeadStatus" NOT NULL DEFAULT 'New',
    "assignedToId" TEXT REFERENCES "User"(id),
    "convertedAt" TIMESTAMPTZ,
    "opportunityId" TEXT UNIQUE REFERENCES "Opportunity"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable OpportunityStageHistory
CREATE TABLE IF NOT EXISTS "OpportunityStageHistory" (
    id TEXT PRIMARY KEY,
    "opportunityId" TEXT NOT NULL REFERENCES "Opportunity"(id),
    "fromStageId" TEXT REFERENCES "PipelineStage"(id),
    "toStageId" TEXT NOT NULL REFERENCES "PipelineStage"(id),
    "changedById" TEXT REFERENCES "User"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Ticket
CREATE TABLE IF NOT EXISTS "Ticket" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status "TicketStatus" NOT NULL DEFAULT 'Open',
    priority "TicketPriority" NOT NULL DEFAULT 'Medium',
    "customerId" TEXT REFERENCES "Customer"(id),
    "assigneeId" TEXT REFERENCES "User"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Activity
CREATE TABLE IF NOT EXISTS "Activity" (
    id TEXT PRIMARY KEY,
    type "ActivityType" NOT NULL DEFAULT 'Note',
    subject TEXT NOT NULL,
    description TEXT,
    status "ActivityStatus" NOT NULL DEFAULT 'Planned',
    "dueDate" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "leadId" TEXT REFERENCES "Lead"(id),
    "opportunityId" TEXT REFERENCES "Opportunity"(id),
    "customerId" TEXT REFERENCES "Customer"(id),
    "ticketId" TEXT REFERENCES "Ticket"(id),
    "assigneeId" TEXT REFERENCES "User"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable CalendarEvent
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    location TEXT,
    "userId" TEXT NOT NULL REFERENCES "User"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Reminder
CREATE TABLE IF NOT EXISTS "Reminder" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    "dueDate" TIMESTAMPTZ NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL REFERENCES "User"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Notification
CREATE TABLE IF NOT EXISTS "Notification" (
    id TEXT PRIMARY KEY,
    type "NotificationType" NOT NULL DEFAULT 'Info',
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL REFERENCES "User"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Document
CREATE TABLE IF NOT EXISTS "Document" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    size INTEGER,
    url TEXT,
    "storageKey" TEXT,
    "customerId" TEXT REFERENCES "Customer"(id),
    "opportunityId" TEXT REFERENCES "Opportunity"(id),
    "uploadedById" TEXT REFERENCES "User"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    id TEXT PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    action TEXT NOT NULL,
    "userId" TEXT REFERENCES "User"(id),
    data JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- Seed default pipeline stages
INSERT INTO "PipelineStage" (id, name, "order") VALUES
    ('stage-discovery', 'Discovery', 0),
    ('stage-qualification', 'Qualification', 1),
    ('stage-proposal', 'Proposal', 2),
    ('stage-negotiation', 'Negotiation', 3),
    ('stage-closed-won', 'ClosedWon', 4),
    ('stage-closed-lost', 'ClosedLost', 5)
ON CONFLICT (id) DO NOTHING;
