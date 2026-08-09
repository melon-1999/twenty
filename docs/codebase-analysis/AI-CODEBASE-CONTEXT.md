# AI Codebase Context — Twenty CRM

Dense single-file primer for an AI coding agent about to modify Twenty. Read this, then jump to the numbered docs for depth. Verify anything you're unsure of against source (this reflects branch `main`, ~Aug 2026).

## What Twenty is

Open-source CRM. **Metadata-driven, multi-tenant platform**, not a fixed-schema app. Objects, fields, relations, views, layouts, permissions, AI tools are all *metadata* in the DB. From it Twenty generates at runtime, per workspace: the Postgres schema (DDL), the GraphQL API + CRUD resolvers, REST/MCP/OpenAPI, the client SDK, and the entire React record UI. **This generation loop is the single most important thing to understand.**

## Stack

- Server (`packages/twenty-server`): NestJS 11, TypeORM 0.3.31 (patched, custom permission-aware schema-per-tenant ORM), Postgres, GraphQL via graphql-yoga 4 (code-first), Redis (ioredis + cache-manager), BullMQ 5, Vercel AI SDK (`ai@6`) + `@ai-sdk/*`, Stripe, Sentry/OTel.
- Front (`packages/twenty-front`): React 19, react-router v6 data router, **Jotai** (Recoil removed; Recoil-shaped wrapper over Jotai), Apollo Client 4 (two clients), Linaria, Lingui, `@xyflow/react` (workflow editor), Vite.
- Tooling: Nx, Yarn 4, Node 24, **oxlint + oxfmt** (not ESLint/Prettier), `tsgo` typecheck.

## Package map (18 packages)

Core: `twenty-server`, `twenty-front`, `twenty-shared` (types/utils front+back), `twenty-ui`. Extension: `twenty-sdk` (**SDK + working CLI**), `twenty-client-sdk`, `create-twenty-app`, `twenty-front-component-renderer`, `twenty-apps`. Supporting: `twenty-emails`, `twenty-zapier`, `twenty-docker`, `twenty-e2e-testing`, `twenty-website`, `twenty-docs`, `twenty-utils`, `twenty-oxlint-rules`, `twenty-codex-plugin`, `twenty-claude-skills`. **`twenty-cli` is DEPRECATED** (tombstone). Full map: [02](02-MONOREPO-STRUCTURE.md).

## Server runtime = 3 processes

1. **HTTP app** `src/main.ts` → `AppModule` — API (GraphQL/REST/MCP), auth.
2. **Queue worker** `src/queue-worker/` → `QueueWorkerModule` — headless; BullMQ workers. **Email/calendar sync, workflows, webhooks, AI streaming, crons all require it.**
3. **CLI** `src/command/` → `CommandModule` — `database:*`, cache, upgrade commands.

## Backend request lifecycle (critical)

Auth is in **Express middlewares**, not guards: `CookieSessionCsrf` → `GraphQLHydrateRequestFromToken` (`MiddlewareService.hydrateGraphqlRequest` → `AccessTokenService.validateTokenByRequest` → `bindDataToRequestObject` stamps `req.workspace/user/...`) → `WorkspaceAuthContextMiddleware` (`withWorkspaceAuthContext` enters **AsyncLocalStorage**). **Workspace scoping is via ALS, not decorators** — resolvers read `workspaceId` from `getWorkspaceAuthContext()`. The ORM has a parallel ALS entered by `GlobalWorkspaceOrmManager.executeInWorkspaceContext`. Details: [04](04-BACKEND.md).

## Two GraphQL APIs

- **`/graphql`** — workspace record data. Schema **generated at runtime from metadata**, cached as SDL string in Redis. CRUD resolvers auto-generated (`WorkspaceResolverFactory`). A **direct-execution** Yoga plugin bypasses graphql-js on the hot path (full schema built only for introspection/SDK). `findMany/findOne/groupBy/createOne/updateOne/deleteOne/destroyOne/restoreOne/mergeMany` etc.
- **`/metadata`** — the metadata API (create objects/fields/views/roles). Conventional code-first NestJS resolvers.

REST (`/rest`, one generic wildcard controller) and MCP (`/mcp`, JSON-RPC) are thin adapters into the **same common query runners** (`engine/api/common/common-query-runners/`) as GraphQL. Pagination is Relay cursor connections. Details: [05](05-API-GRAPHQL.md).

## Database & multi-tenancy

**Schema-per-tenant.** Each workspace → its own Postgres schema `workspace_<base36(uuid)>`. Core/system + **all metadata tables live in the shared `core` schema** (no separate physical `metadata` schema). Two datasources: core (`schema:'core'`) and `GlobalWorkspaceDataSource` (one pool, entities supplied dynamically per request, schema path derived from ALS workspaceId → tenant isolation is structural). `GlobalWorkspaceDataSource` **blocks raw `createQueryBuilder`/`query`** unless routed through the permission-aware `WorkspaceEntityManager`. `WorkspaceScopedRepository` handles core tables that carry `workspaceId` (forces `workspace_id=?`; omits PK-only delete/remove). Details: [06](06-DATABASE-DATA-MODEL.md), [11](11-WORKSPACES-MULTITENANCY.md).

## Metadata engine (the heart)

- `FieldMetadataType` (twenty-shared): 25 types incl. 8 composites (LINKS, CURRENCY, FULL_NAME, ADDRESS, ACTOR, EMAILS, PHONES, RICH_TEXT) — composite columns expand (e.g. `name`→`nameFirstName/nameLastName`). Relations are **paired `FieldMetadataEntity` rows** (`RELATION`/`MORPH_RELATION`), not a separate entity.
- **Flat metadata** = immutable, serializable, `universalIdentifier`-keyed snapshots (`flat-*` modules), Redis-cached, diffable. ~30 flat kinds.
- **Standard objects are static flat-metadata builders** (`twenty-standard-application/`), **NOT `@WorkspaceEntity` classes** (that decorator system no longer exists; `*.workspace-entity.ts` are typing shapes only).
- Metadata mutation pipeline: **side-effect expansion** (adds system fields/indexes/search vector) → **build/diff** (from→to flat maps → universal actions) → **migration runner** (one core-DB transaction that writes metadata rows AND emits physical DDL via `WorkspaceSchemaManagerService`) → **cache invalidation + metadata version bump** (regenerates GraphQL schema + ORM entity metadata). Clients poll `metadataVersion`. Details: [07](07-METADATA-ENGINE.md).

## Events → async jobs

Record writes emit batched domain events (`${object}.${action}`). `entity-events-to-db.listener.ts` is the **sync→async bridge**: enqueues webhooks (`webhookQueue`), workflow triggers (`triggerQueue`), audit/timeline (`entityEventsToDbQueue`), publishes GraphQL subscriptions. 17 BullMQ queues; workers registered by `MessageQueueExplorer` discovering `@Processor`/`@Process`. Details: [15](15-BACKGROUND-JOBS.md).

## Workflows

Workspace entities: `WorkflowWorkspaceEntity`, `WorkflowVersionWorkspaceEntity` (`trigger` + `steps[]` JSON graph via `nextStepIds`; edit only on DRAFT, one ACTIVE per workflow), `WorkflowRunWorkspaceEntity` (`state.stepInfos` = authoritative execution state). Triggers: DATABASE_EVENT / MANUAL / CRON / WEBHOOK. Actions implement `WorkflowAction` (`WorkflowActionFactory.get(type)`): record-crud, mail, code/logic-function, ai-agent, http-request, filter, if-else, iterator, form, delay. Runner: `RunWorkflowJob` (workflowQueue) → `WorkflowExecutor` runs steps in parallel, patches `state` under `@WithLock`, re-chunks after 20 steps, pauses on form/delay (`pendingEvent`). Editor: `@xyflow/react`; live run via SSE. Details: [08](08-WORKFLOWS.md).

## AI

Vercel AI SDK. Providers via `SdkProviderFactoryService` (OpenAI/Anthropic/Google/Mistral/xAI/Bedrock/Azure), catalog `ai-providers.json`, registry `AiModelRegistryService`. **Agents are a synced metadata type** (`AgentEntity`); skills are on-demand instruction docs. **Two-tier tool exposure**: only a few tools passed to `streamText`; the model discovers the rest via meta-tools `learn_tools`/`execute_tool`/`load_skill` (full catalog rendered as text into the system prompt). Tool dispatch `ToolExecutorService` → database_crud / static / logic_function. Chat: `sendChatMessage` → enqueue `aiStreamQueue` → `StreamAgentChatJob` → `streamText` loop → chunks **tee'd** to DB checkpoints + Redis events → **SSE (graphql-sse)** to the client. DB tools run under a role's `RolePermissionConfig`; billing credits gate every turn. No local model — external LLM API required. Details: [09](09-AI-SYSTEM.md).

## Auth & permissions

Tokens: ACCESS (workspace-scoped), REFRESH (AppToken row), LOGIN (redirect bridge), WORKSPACE_AGNOSTIC (pre-workspace), API_KEY (JWT, validated vs cached map), APPLICATION_*. JWT strategy dispatches by `payload.type`. Session tokens cookie-only (rejected as Bearer). SSO: Google/Microsoft/OIDC/SAML. 2FA: TOTP. **RBAC**: `RoleEntity` (grant-all flags) + `ObjectPermissionEntity` + `FieldPermissionEntity` + row-level predicates (Enterprise) + `RolePermissionFlagEntity`; assigned via `RoleTargetEntity` (userWorkspace/agent/apiKey). **Enforcement is in the ORM query builders** (`permissions.utils.ts` + RLS SQL), not resolvers; settings mutations gated by `SettingsPermissionGuard(flag)`. Effective permissions ride on `currentUserWorkspace` → front `useHasPermissionFlag`/`useObjectPermissions`. Details: [10](10-AUTH-PERMISSIONS.md).

## Frontend

Bootstrap `index.tsx` (hydrate metadata store first) → `App.tsx` provider shell → `DomainShell` → `WorkspaceApp`/`RootApp`. Two Apollo clients (`/graphql` core via `useApolloCoreClient`, `/metadata`). **Metadata-driven UI**: `objectMetadataItemsWithFieldsSelector` (applies permissions → readable/updatable fields) → `useColumnDefinitionsFromObjectMetadata` → `mapObjectMetadataToGraphQLQuery` (generates record GraphQL, expands composites) → `useFindManyRecords` → record store → `FieldContext` per cell → `FieldDisplay`/`FieldInput` (**guard-based dispatch by field type**, not a map). State: Jotai + `createAtomComponentState` (component-instance-scoped via instance contexts). context-store coordinates current object/view/records. Views copy persisted view state into component-scoped current-record states. Settings routes permission-gated via `SettingsProtectedRouteWrapper`. **Never hand-write record GraphQL** — reuse `useFindManyRecords`/`useUpdateOneRecord`/`usePersistField`. Details: [03](03-FRONTEND.md).

## Extensibility (app vs core)

Build a **Twenty App** (npm package via `twenty-sdk`, installed per workspace, zero core changes) for: custom objects/fields/views/layouts, nav/command items, sandboxed front components (Remote DOM + iframe + worker), logic functions (HTTP/cron/db-event/webhook/tool/workflow-action, Lambda/local drivers), AI agents/skills, roles/permission flags, OAuth connection providers, integrations (`twenty-client-sdk`). **Fork core** only for: new field types, front-component host primitives, execution drivers, manifest kinds/sync engine, core auth/billing. Apps defined in pure TS via `define*()` with stable `universalIdentifier`s; installed by CLI tarball upload → server manifest sync. CLI is in `twenty-sdk` (`twenty` binary). Details: [12](12-APPS-SDK-EXTENSIBILITY.md), [13](13-CLI.md), [24](24-EXTENSION-VS-CORE.md).

## Dev commands (real)

```bash
bash packages/twenty-utils/setup-dev-env.sh        # infra + env + db init (idempotent)
yarn start                                          # server + front + worker
npx nx start twenty-server | twenty-front           # individual
npx nx run twenty-server:worker                     # worker
npx nx run twenty-front:graphql:generate [--configuration=metadata]   # after schema changes
npx nx lint:diff-with-main twenty-front [--configuration=fix]         # fast lint (oxlint)
npx nx typecheck twenty-front                        # tsgo
npx jest path/to/x.test.ts --config=packages/PROJECT/jest.config.mjs  # single test
npx nx run twenty-server:database:migrate:generate --name <n> --type <fast|slow>
```

## Conventions (enforced)

Functional components only; **named exports only** (no default exports); types over interfaces; string literals over enums (except GraphQL enums); **no `any`**; event handlers over `useEffect`; kebab-case files with suffixes (`.service.ts`, `.entity.ts`, `.component.tsx`); Linaria `styled` prefixed `Styled`, no hardcoded colors (from `themeCssVariables`); Lingui macros for strings; `isDefined`/`isNonEmptyString` from twenty-shared; short `//` comments explaining WHY. Custom oxlint rules enforce guarding resolvers/REST methods and workspace-scoped repositories. Details: [20](20-CODE-CONVENTIONS.md).

## Dangerous areas (be careful)

1. **Metadata/migration pipeline** — workspace-wide blast radius; test with integration + DB reset; consider existing tenants (workspace command backfill).
2. **Dynamically generated code** — the workspace GraphQL schema/resolvers/OpenAPI/SDK don't exist as source; standard objects are flat builders, not entity classes.
3. **Tenant isolation** — schema path must come from authenticated workspaceId, never user input; don't bypass `GlobalWorkspaceDataSource` guards; don't re-add PK-only mutations to `WorkspaceScopedRepository`.
4. **Permissions** — enforce in the ORM path, not just resolvers; oxlint enforces guarding.
5. **Instance/workspace commands** are append-only — never edit committed `up`/`down`.
6. **Caching/metadata-version** — incorrect invalidation → stale schema/permissions.
7. **Frontend instance-scoped state** — wrong instanceId resolution → cross-instance bleed; wrong Apollo client (`/graphql` vs `/metadata`).

Details: [25](25-RISKS-AND-COMPLEXITY.md). Anchor files: [21](21-CRITICAL-CODE-PATHS.md). End-to-end traces: [22](22-FEATURE-FLOWS.md). "Where do I change X": [23](23-MODIFICATION-GUIDE.md).

## Architectural rules to respect

- Metadata is the source of truth; don't hardcode what should be metadata-driven.
- Go through the permission-aware ORM; never raw-query a workspace schema.
- Record CRUD is auto-generated; extend via metadata/apps, not hand-written resolvers.
- Sync boundary: mutate `workflowRun.state` / metadata via the provided services (locks, transactions), not directly.
- Prefer building an app over forking core.
