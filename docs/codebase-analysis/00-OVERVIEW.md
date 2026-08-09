# 00 — Overview

## What Twenty is

Twenty is an open-source CRM. Functionally it is a Salesforce/Attio-style customer relationship platform: companies, people, opportunities, tasks, notes, plus **user-defined custom objects and fields**, records views (table/kanban/calendar/list), a workflow automation engine, an AI agent/chat layer, email & calendar sync, and an app/marketplace extension system.

Architecturally the defining trait is that **Twenty is a metadata-driven, multi-tenant platform, not a fixed-schema CRM.** Almost everything a user sees (objects, fields, relations, views, layouts, permissions, even AI tools) is described by *metadata* stored in the database. From that metadata Twenty generates, at runtime and per workspace: the physical PostgreSQL schema, the GraphQL API, the REST API, the OpenAPI spec, the typed client SDK, and the entire frontend record UI.

If you understand one thing, understand this loop:

```
metadata (objects/fields)  →  per-workspace Postgres schema (DDL)
                           →  per-workspace GraphQL schema + auto CRUD resolvers
                           →  REST / MCP / OpenAPI surfaces
                           →  metadata-driven React UI (columns, cells, forms)
```

## Tech stack (verified from package.json)

**Backend (`twenty-server`)** — NestJS 11, TypeORM 0.3.31 (patched), PostgreSQL (`pg` 8), GraphQL via `graphql-yoga` 4 (`@graphql-yoga/nestjs`, code-first with `@nestjs/graphql` 13), Redis via `ioredis` 5 + `cache-manager`, BullMQ 5 for queues, Passport for auth, Stripe for billing, Sentry + OpenTelemetry for observability, Vercel AI SDK (`ai` 6) with `@ai-sdk/openai` / `@ai-sdk/anthropic` / `@ai-sdk/google` / `@ai-sdk/mistral` / `@ai-sdk/xai` / `@ai-sdk/amazon-bedrock` / `@ai-sdk/azure`.

**Frontend (`twenty-front`)** — React 19, TypeScript, react-router v6 (data router), **Jotai** for state (Recoil removed; a Recoil-shaped wrapper sits on top of Jotai), Apollo Client 4 (two clients), Linaria for styling, Lingui for i18n, `@xyflow/react` for the workflow editor, BlockNote for rich text, dnd-kit for drag-drop, Vite build.

**Shared / tooling** — Nx workspace, Yarn 4 (corepack), Node 24, oxlint + oxfmt (not ESLint/Prettier for source), `tsgo` for typecheck. ClickHouse optionally for analytics.

## Package snapshot

18 packages under `packages/`. Architectural core: `twenty-server`, `twenty-front`, `twenty-shared`, `twenty-ui`. Extension surface: `twenty-sdk` (SDK + CLI), `twenty-client-sdk`, `create-twenty-app`, `twenty-apps`, `twenty-front-component-renderer`. Supporting: `twenty-emails`, `twenty-zapier`, `twenty-docker`, `twenty-e2e-testing`, `twenty-website`, `twenty-docs`, `twenty-utils`, `twenty-oxlint-rules`, `twenty-codex-plugin`, `twenty-claude-skills`. Deprecated: `twenty-cli`. Full map in [02-MONOREPO-STRUCTURE.md](02-MONOREPO-STRUCTURE.md).

## Runtime processes

One server codebase runs as **three process types** (see [04-BACKEND.md](04-BACKEND.md)):
1. **HTTP app** (`src/main.ts` → `AppModule`) — the API (GraphQL/REST/MCP), auth, serving.
2. **Queue worker** (`src/queue-worker/` → `QueueWorkerModule`) — a headless NestJS context that runs BullMQ workers. Email/calendar sync, workflows, webhooks, AI streaming, crons, all require it.
3. **CLI commands** (`src/command/` → `CommandModule`, `nest-commander`) — `database:*`, cache, upgrade/instance-command runners.

## Multi-tenancy in one paragraph

Each workspace gets its **own PostgreSQL schema** named `workspace_<base36(uuid)>`. Core/system and metadata tables live in the shared `core` schema. A request authenticates, resolves a `workspaceId`, and everything downstream runs inside an `AsyncLocalStorage` scope; the ORM derives the schema path from that workspaceId, so cross-tenant access is structurally impossible through the ORM. Within a workspace, role-based object/field/row-level permissions further restrict access. Details in [11](11-WORKSPACES-MULTITENANCY.md) and [10](10-AUTH-PERMISSIONS.md).

## Where to go next

- Big picture & diagrams: [01-ARCHITECTURE.md](01-ARCHITECTURE.md)
- The metadata heart: [07-METADATA-ENGINE.md](07-METADATA-ENGINE.md)
- Condensed agent primer: [AI-CODEBASE-CONTEXT.md](AI-CODEBASE-CONTEXT.md)
