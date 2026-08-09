# Twenty CRM — Codebase Analysis

Deep technical documentation of the Twenty repository, written from the source code (not just READMEs). The goal: another engineer or AI coding agent can understand the architecture, core systems, data flows, conventions and extension points without rediscovering the whole repo.

Reference: https://github.com/twentyhq/twenty

## How to read this

- **Start here:** [00-OVERVIEW.md](00-OVERVIEW.md) then [01-ARCHITECTURE.md](01-ARCHITECTURE.md).
- **Single-file agent primer:** [AI-CODEBASE-CONTEXT.md](AI-CODEBASE-CONTEXT.md) — condensed, information-dense; read this first if you are about to modify Twenty.
- **The three most important systems** to understand Twenty: the [Metadata engine](07-METADATA-ENGINE.md), the [Data model / multi-tenancy](06-DATABASE-DATA-MODEL.md) + [11-WORKSPACES-MULTITENANCY.md](11-WORKSPACES-MULTITENANCY.md), and the [dynamic GraphQL API](05-API-GRAPHQL.md).

## Index

| # | Doc | Covers |
|---|-----|--------|
| 00 | [Overview](00-OVERVIEW.md) | What Twenty is, stack, mental model |
| 01 | [Architecture](01-ARCHITECTURE.md) | Component interaction, request lifecycle, diagrams |
| 02 | [Monorepo structure](02-MONOREPO-STRUCTURE.md) | Package map, dependencies |
| 03 | [Frontend](03-FRONTEND.md) | React app, routing, Jotai, Apollo, metadata-driven UI |
| 04 | [Backend](04-BACKEND.md) | NestJS processes, modules, middleware, events |
| 05 | [API & GraphQL](05-API-GRAPHQL.md) | Dynamic schema, resolvers, REST, MCP, OpenAPI |
| 06 | [Database & data model](06-DATABASE-DATA-MODEL.md) | twenty-orm, schemas, migrations, upgrade commands |
| 07 | [Metadata engine](07-METADATA-ENGINE.md) | Flat metadata, side-effects, migration runner |
| 08 | [Workflows](08-WORKFLOWS.md) | Triggers, actions, executor, runner |
| 09 | [AI system](09-AI-SYSTEM.md) | Agents, tools, providers, chat streaming |
| 10 | [Auth & permissions](10-AUTH-PERMISSIONS.md) | Tokens, SSO, RBAC, enforcement |
| 11 | [Workspaces & multi-tenancy](11-WORKSPACES-MULTITENANCY.md) | Schema-per-tenant, isolation |
| 12 | [Apps, SDK & extensibility](12-APPS-SDK-EXTENSIBILITY.md) | Applications, twenty-sdk, front components |
| 13 | [CLI](13-CLI.md) | twenty-sdk CLI, create-twenty-app |
| 14 | [Integrations](14-INTEGRATIONS.md) | Email/calendar, webhooks, Zapier, storage, Stripe |
| 15 | [Background jobs](15-BACKGROUND-JOBS.md) | Message-queue abstraction, BullMQ, worker, crons |
| 16 | [Configuration](16-CONFIGURATION.md) | Env vars, feature flags |
| 17 | [Deployment](17-DEPLOYMENT.md) | Docker, Helm/k8s, topology |
| 18 | [Testing](18-TESTING.md) | Unit, integration, E2E, storybook |
| 19 | [Development workflow](19-DEVELOPMENT-WORKFLOW.md) | Setup and daily commands |
| 20 | [Code conventions](20-CODE-CONVENTIONS.md) | Naming, lint rules, patterns |
| 21 | [Critical code paths](21-CRITICAL-CODE-PATHS.md) | ~25 anchor files |
| 22 | [Feature flows](22-FEATURE-FLOWS.md) | End-to-end traces |
| 23 | [Modification guide](23-MODIFICATION-GUIDE.md) | "If I want to change X, where do I look" |
| 24 | [Extension vs core](24-EXTENSION-VS-CORE.md) | App/SDK vs fork decision table |
| 25 | [Risks & complexity](25-RISKS-AND-COMPLEXITY.md) | Coupled / sensitive areas |

## Confidence & caveats

This analysis was produced by reading source directly. Where a claim is inferred rather than confirmed line-by-line, the doc says so. Two notable findings that contradict older documentation:

1. **The `@WorkspaceEntity` decorator system no longer exists.** Standard objects are now defined as static "flat metadata" builders (see [07](07-METADATA-ENGINE.md), [06](06-DATABASE-DATA-MODEL.md)).
2. **`twenty-cli` is deprecated** (a tombstone package). The working CLI ships inside `twenty-sdk` (see [13](13-CLI.md)).

Verified against the repo state on branch `main` (commit around `32117c8560`, Aug 2026).
