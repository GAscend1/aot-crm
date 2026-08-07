-- SaaS multi-tenancy: preserve all existing data by backfilling into a single
-- default organization. New organizations are created at login time keyed by
-- the authenticated Microsoft tenant id (tid).

-- ---------------------------------------------------------------------------
-- 1. Core SaaS tables
-- ---------------------------------------------------------------------------

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "microsoftTenantId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "limits" JSONB,
    "features" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL DEFAULT 'TRIAL',
    "status" TEXT NOT NULL DEFAULT 'TRIALING',
    "source" TEXT NOT NULL DEFAULT 'TRIAL',
    "trialStartedAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "grantedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionChange" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "previousPlan" TEXT,
    "newPlan" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "source" TEXT,
    "reason" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionChange_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OnboardingState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "tourCompleted" BOOLEAN NOT NULL DEFAULT false,
    "gettingStartedDismissedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "companySize" TEXT,
    "industry" TEXT,
    "intendedUse" TEXT,
    "preferredPlan" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "organizationId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalesInquiry_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- 2. Default organization + unique constraints + indexes
-- ---------------------------------------------------------------------------

INSERT INTO "Organization" ("id", "name", "slug", "status", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'AOT Default Workspace', 'default', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "Organization_microsoftTenantId_key" ON "Organization"("microsoftTenantId");
CREATE INDEX "Organization_microsoftTenantId_idx" ON "Organization"("microsoftTenantId");

CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");
CREATE UNIQUE INDEX "Entitlement_planCode_feature_key" ON "Entitlement"("planCode", "feature");
CREATE INDEX "Entitlement_planCode_idx" ON "Entitlement"("planCode");

CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId");
CREATE INDEX "Subscription_planCode_idx" ON "Subscription"("planCode");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "SubscriptionChange_subscriptionId_idx" ON "SubscriptionChange"("subscriptionId");

CREATE UNIQUE INDEX "OnboardingState_userId_key" ON "OnboardingState"("userId");
CREATE INDEX "OnboardingState_organizationId_idx" ON "OnboardingState"("organizationId");

CREATE INDEX "SalesInquiry_email_idx" ON "SalesInquiry"("email");
CREATE INDEX "SalesInquiry_status_idx" ON "SalesInquiry"("status");

-- ---------------------------------------------------------------------------
-- 3. organizationId on every tenant-owned table (add → backfill → NOT NULL)
-- ---------------------------------------------------------------------------

ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
UPDATE "User" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

ALTER TABLE "Company" ADD COLUMN "organizationId" TEXT;
UPDATE "Company" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Company" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Company_organizationId_idx" ON "Company"("organizationId");

ALTER TABLE "Customer" ADD COLUMN "organizationId" TEXT;
UPDATE "Customer" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Customer" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Customer_organizationId_idx" ON "Customer"("organizationId");

ALTER TABLE "Contact" ADD COLUMN "organizationId" TEXT;
UPDATE "Contact" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Contact" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");

ALTER TABLE "Lead" ADD COLUMN "organizationId" TEXT;
UPDATE "Lead" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Lead" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Lead_organizationId_idx" ON "Lead"("organizationId");

ALTER TABLE "Opportunity" ADD COLUMN "organizationId" TEXT;
UPDATE "Opportunity" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Opportunity" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Opportunity_organizationId_idx" ON "Opportunity"("organizationId");

ALTER TABLE "Activity" ADD COLUMN "organizationId" TEXT;
UPDATE "Activity" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Activity" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Activity_organizationId_idx" ON "Activity"("organizationId");

ALTER TABLE "CalendarEvent" ADD COLUMN "organizationId" TEXT;
UPDATE "CalendarEvent" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "CalendarEvent" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "CalendarEvent_organizationId_idx" ON "CalendarEvent"("organizationId");

ALTER TABLE "Reminder" ADD COLUMN "organizationId" TEXT;
UPDATE "Reminder" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Reminder" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Reminder_organizationId_idx" ON "Reminder"("organizationId");

ALTER TABLE "Notification" ADD COLUMN "organizationId" TEXT;
UPDATE "Notification" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Notification" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

ALTER TABLE "Ticket" ADD COLUMN "organizationId" TEXT;
UPDATE "Ticket" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Ticket" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Ticket_organizationId_idx" ON "Ticket"("organizationId");

ALTER TABLE "Document" ADD COLUMN "organizationId" TEXT;
UPDATE "Document" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Document" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");

ALTER TABLE "AuditLog" ADD COLUMN "organizationId" TEXT;
UPDATE "AuditLog" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

ALTER TABLE "Tag" ADD COLUMN "organizationId" TEXT;
UPDATE "Tag" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Tag" ALTER COLUMN "organizationId" SET NOT NULL;
-- Tags become org-scoped: name is unique per organization, not globally.
ALTER TABLE "Tag" DROP CONSTRAINT IF EXISTS "Tag_name_key";
CREATE UNIQUE INDEX "Tag_organizationId_name_key" ON "Tag"("organizationId", "name");
CREATE INDEX "Tag_organizationId_idx" ON "Tag"("organizationId");

ALTER TABLE "Note" ADD COLUMN "organizationId" TEXT;
UPDATE "Note" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Note" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Note_organizationId_idx" ON "Note"("organizationId");

ALTER TABLE "Assignment" ADD COLUMN "organizationId" TEXT;
UPDATE "Assignment" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Assignment" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Assignment_organizationId_idx" ON "Assignment"("organizationId");

ALTER TABLE "Quote" ADD COLUMN "organizationId" TEXT;
UPDATE "Quote" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Quote" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Quote_organizationId_idx" ON "Quote"("organizationId");

ALTER TABLE "Invoice" ADD COLUMN "organizationId" TEXT;
UPDATE "Invoice" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Invoice" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");

ALTER TABLE "ProspectingList" ADD COLUMN "organizationId" TEXT;
UPDATE "ProspectingList" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "ProspectingList" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "ProspectingList_organizationId_idx" ON "ProspectingList"("organizationId");

ALTER TABLE "CallCampaign" ADD COLUMN "organizationId" TEXT;
UPDATE "CallCampaign" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "CallCampaign" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "CallCampaign_organizationId_idx" ON "CallCampaign"("organizationId");

ALTER TABLE "SalesGoal" ADD COLUMN "organizationId" TEXT;
UPDATE "SalesGoal" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "SalesGoal" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "SalesGoal_organizationId_idx" ON "SalesGoal"("organizationId");

ALTER TABLE "Automation" ADD COLUMN "organizationId" TEXT;
UPDATE "Automation" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Automation" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Automation_organizationId_idx" ON "Automation"("organizationId");

ALTER TABLE "Report" ADD COLUMN "organizationId" TEXT;
UPDATE "Report" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Report" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "Report_organizationId_idx" ON "Report"("organizationId");

-- ---------------------------------------------------------------------------
-- 4. Foreign keys
-- ---------------------------------------------------------------------------

ALTER TABLE "Organization" ADD CONSTRAINT "Organization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubscriptionChange" ADD CONSTRAINT "SubscriptionChange_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionChange" ADD CONSTRAINT "SubscriptionChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OnboardingState" ADD CONSTRAINT "OnboardingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OnboardingState" ADD CONSTRAINT "OnboardingState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesInquiry" ADD CONSTRAINT "SalesInquiry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesInquiry" ADD CONSTRAINT "SalesInquiry_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Company" ADD CONSTRAINT "Company_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProspectingList" ADD CONSTRAINT "ProspectingList_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CallCampaign" ADD CONSTRAINT "CallCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesGoal" ADD CONSTRAINT "SalesGoal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 5. Seed plans, entitlements, and the default organization's trial
-- ---------------------------------------------------------------------------

INSERT INTO "Plan" ("id", "code", "name", "limits", "features", "sortOrder", "active", "createdAt", "updatedAt") VALUES
('plan-trial', 'TRIAL', 'Trial', '{"users": 5, "companies": 100}', '["companies","contacts","leads","opportunities","activities"]', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('plan-starter', 'STARTER', 'Starter', '{"users": 10, "companies": 500}', '["companies","contacts","leads","opportunities","kanban","tasks","activities","quotes","reports"]', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('plan-professional', 'PROFESSIONAL', 'Professional', '{"users": 50, "companies": 5000}', '["companies","contacts","leads","opportunities","kanban","tasks","activities","quotes","reports","outlook_email","calendar_sync","teams","microsoft_365","advanced_analytics","automation","api","priority_support"]', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('plan-enterprise', 'ENTERPRISE', 'Enterprise', '{"users": 250, "companies": 25000}', '["companies","contacts","leads","opportunities","kanban","tasks","activities","quotes","reports","outlook_email","calendar_sync","teams","microsoft_365","advanced_analytics","automation","api","priority_support","custom_integrations","enterprise_configuration"]', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Entitlement" ("id", "planCode", "feature", "enabled", "createdAt") VALUES
-- TRIAL
('ent-trial-1', 'TRIAL', 'companies', true, CURRENT_TIMESTAMP),
('ent-trial-2', 'TRIAL', 'contacts', true, CURRENT_TIMESTAMP),
('ent-trial-3', 'TRIAL', 'leads', true, CURRENT_TIMESTAMP),
('ent-trial-4', 'TRIAL', 'opportunities', true, CURRENT_TIMESTAMP),
('ent-trial-5', 'TRIAL', 'activities', true, CURRENT_TIMESTAMP),
-- STARTER
('ent-starter-1', 'STARTER', 'kanban', true, CURRENT_TIMESTAMP),
('ent-starter-2', 'STARTER', 'tasks', true, CURRENT_TIMESTAMP),
('ent-starter-3', 'STARTER', 'quotes', true, CURRENT_TIMESTAMP),
('ent-starter-4', 'STARTER', 'reports', true, CURRENT_TIMESTAMP),
-- PROFESSIONAL
('ent-pro-1', 'PROFESSIONAL', 'outlook_email', true, CURRENT_TIMESTAMP),
('ent-pro-2', 'PROFESSIONAL', 'calendar_sync', true, CURRENT_TIMESTAMP),
('ent-pro-3', 'PROFESSIONAL', 'teams', true, CURRENT_TIMESTAMP),
('ent-pro-4', 'PROFESSIONAL', 'microsoft_365', true, CURRENT_TIMESTAMP),
('ent-pro-5', 'PROFESSIONAL', 'advanced_analytics', true, CURRENT_TIMESTAMP),
('ent-pro-6', 'PROFESSIONAL', 'automation', true, CURRENT_TIMESTAMP),
('ent-pro-7', 'PROFESSIONAL', 'api', true, CURRENT_TIMESTAMP),
('ent-pro-8', 'PROFESSIONAL', 'priority_support', true, CURRENT_TIMESTAMP),
-- ENTERPRISE
('ent-ent-1', 'ENTERPRISE', 'custom_integrations', true, CURRENT_TIMESTAMP),
('ent-ent-2', 'ENTERPRISE', 'enterprise_configuration', true, CURRENT_TIMESTAMP)
ON CONFLICT ("planCode", "feature") DO NOTHING;

-- Default organization: automatic 14-day trial so the current test account and
-- any legacy data keep working until the owner grants a paid plan.
INSERT INTO "Subscription" ("id", "organizationId", "planCode", "status", "source", "trialStartedAt", "trialEndsAt", "createdAt", "updatedAt")
VALUES ('sub-default', '00000000-0000-0000-0000-000000000001', 'TRIAL', 'TRIALING', 'TRIAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("organizationId") DO NOTHING;
