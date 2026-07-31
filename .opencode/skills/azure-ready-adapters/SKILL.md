---
name: azure-ready-adapters
description: Keep CRM functional today with local providers while ready for Azure SQL and Blob Storage: repository interfaces, mock implementations, Azure SQL adapters, storage interfaces, local storage, Azure Blob adapters, env-based selection, parameterized SQL, connection pooling, migration docs.
license: MIT
compatibility: opencode
metadata:
  domain: crm
  audience: all
  workflow: persistence
---

## What I do

I keep the CRM functional today while ready for Azure SQL and Azure Blob Storage later.

## Architecture rules

- Define repository interfaces in `repository/` for every data source
- Provide mock repository implementations for local development
- Azure SQL repository adapters implement the same interfaces
- Storage provider interfaces in `storage/` abstract file/document access
- Local development storage via file system or in-memory
- Azure Blob provider adapters implement the same interfaces
- Environment-based provider selection via `AZURE_STORAGE_CONNECTION_STRING` and similar env vars
- No hardcoded credentials anywhere
- No secrets in source control — use `.env.local`
- Parameterized SQL only — no string concatenation
- Connection pooling for Azure SQL
- Transaction and error handling for all persistence operations
- Blob metadata stored separately from file content
- Include migration documentation for each adapter

## When to use me

Trigger this for:
- repositories
- persistence
- files
- documents
- Azure SQL
- Blob Storage
- environment configuration
- migration preparation

## Prohibited

- Hardcoded credentials
- SQL string concatenation
- Secrets in source control
- Skipping mock implementations

## Validation

- Verify every repository has both mock and Azure SQL implementations
- Confirm environment-based provider selection works
- Check parameterized SQL usage
- Ensure no credentials in committed files
- Verify migration docs exist
