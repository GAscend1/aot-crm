-- Phase 11 entitlement matrix sync.
--
-- The runtime source of truth is lib/entitlements.ts (pure module). These
-- seeded rows are the auditable mirror shown to Platform Owners; update them
-- to match the v1 product spec:
--   TRIAL:      companies, contacts, leads, opportunities, kanban, tasks, activities
--   STARTER:    + quotes, invoices, reports
--   PROFESSIONAL: + outlook_email, calendar_sync, teams, microsoft_365,
--                 advanced_analytics, automation, api, priority_support
--   ENTERPRISE:   + custom_integrations, enterprise_configuration

-- 1. Update Plan.features JSON (used for display in platform tooling).
UPDATE "Plan" SET "features" = '["companies","contacts","leads","opportunities","kanban","tasks","activities"]'
WHERE "code" = 'TRIAL' AND "features" IS NOT NULL;

UPDATE "Plan" SET "features" = '["kanban","tasks","quotes","invoices","reports"]'
WHERE "code" = 'STARTER' AND "features" IS NOT NULL;

-- 2. Rebuild the Entitlement mirror rows from the new matrix (idempotent).
DELETE FROM "Entitlement";

INSERT INTO "Entitlement" ("id", "planCode", "feature", "enabled", "createdAt") VALUES
-- TRIAL
('ent-trial-1', 'TRIAL', 'companies', true, CURRENT_TIMESTAMP),
('ent-trial-2', 'TRIAL', 'contacts', true, CURRENT_TIMESTAMP),
('ent-trial-3', 'TRIAL', 'leads', true, CURRENT_TIMESTAMP),
('ent-trial-4', 'TRIAL', 'opportunities', true, CURRENT_TIMESTAMP),
('ent-trial-5', 'TRIAL', 'kanban', true, CURRENT_TIMESTAMP),
('ent-trial-6', 'TRIAL', 'tasks', true, CURRENT_TIMESTAMP),
('ent-trial-7', 'TRIAL', 'activities', true, CURRENT_TIMESTAMP),
-- STARTER
('ent-starter-1', 'STARTER', 'quotes', true, CURRENT_TIMESTAMP),
('ent-starter-2', 'STARTER', 'invoices', true, CURRENT_TIMESTAMP),
('ent-starter-3', 'STARTER', 'reports', true, CURRENT_TIMESTAMP),
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
