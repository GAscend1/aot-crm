# AOT CRM Engineering Rules

You are working on an enterprise CRM built with:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Base UI
- TanStack Table

## Before writing code

Always follow this workflow:

1. Explore the repository.
2. Read existing implementations.
3. Understand the architecture.
4. Reuse shared components.
5. Never duplicate logic.
6. Follow existing naming conventions.
7. Match the existing UI and UX.

## Implementation Rules

- Never create a new component if a shared one already exists.
- Keep modules consistent.
- Use strict TypeScript.
- Use mock data unless asked to integrate APIs.
- Prefer composition over duplication.
- Keep files small and focused.
- Follow the current folder structure exactly.

## Before finishing

Always:

- Review your changes.
- Remove unused imports.
- Check for duplicated code.
- Ensure responsiveness.
- Ensure accessibility.
- Summarize files changed.
- List remaining work.

Never invent files, folders, or APIs that do not exist.