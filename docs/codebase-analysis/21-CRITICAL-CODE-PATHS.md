# 21 — Critical Code Paths

~25 architectural anchor files/dirs. Read these first to understand Twenty. Paths under `packages/`.

| # | Path | Purpose | Why it matters | Connected systems |
|---|------|---------|----------------|-------------------|
| 1 | `twenty-server/src/main.ts` + `app.module.ts` | HTTP bootstrap + middleware wiring | Entry to the whole server; where auth middleware and GraphQL modules are registered | Auth, GraphQL, ORM |
| 2 | `twenty-server/src/engine/middlewares/middleware.service.ts` | `hydrateGraphqlRequest` — token validation + `bindDataToRequestObject` | The real per-request authentication entry | Auth, tokens, workspace scoping |
| 3 | `twenty-server/src/engine/core-modules/auth/storage/workspace-auth-context.storage.ts` | ALS store for `WorkspaceAuthContext` | Primary tenant-scoping mechanism; resolvers read workspace from here | Multi-tenancy, ORM |
| 4 | `twenty-server/src/engine/api/graphql/workspace-schema.factory.ts` | Builds the per-workspace GraphQL schema from metadata | The dynamic API — schema is generated, not authored | Metadata, resolvers, cache |
| 5 | `twenty-server/src/engine/api/graphql/workspace-resolver-builder/workspace-resolver.factory.ts` | Generates CRUD resolvers per object | Auto-CRUD; findMany/createOne/… | Common query runner |
| 6 | `twenty-server/src/engine/api/graphql/graphql-config/direct-execution/hooks/use-direct-execution.hook.ts` | Hot-path bypass of graphql-js | Perf-critical; explains why SDL is cached as a string | GraphQL, resolver-name map |
| 7 | `twenty-server/src/engine/api/common/common-query-runners/` | Shared CRUD execution | Where GraphQL + REST + MCP converge | ORM, permissions, filters |
| 8 | `twenty-server/src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.ts` + `global-workspace-orm.manager.ts` | Permission-aware, schema-per-tenant datasource | The custom ORM heart; blocks raw queries, enters workspace context | Multi-tenancy, permissions |
| 9 | `twenty-server/src/engine/twenty-orm/repository/permissions.utils.ts` | `validateQueryIsPermittedOrThrow` | Object/field permission enforcement at query time | RBAC |
| 10 | `twenty-server/src/engine/twenty-orm/factories/entity-schema.factory.ts` | Builds workspace-scoped TypeORM EntitySchemas from metadata | Binds metadata → physical schema at query time | Metadata, DDL |
| 11 | `twenty-server/src/engine/metadata-modules/object-metadata/object-metadata.service.ts` | Create/update/delete object metadata (returns flat metadata) | Entry to the metadata mutation pipeline | Migration, flat metadata |
| 12 | `twenty-server/src/engine/metadata-modules/flat-entity/` | Flat metadata maps + cache | The cacheable, diffable source of truth | Everything metadata-driven |
| 13 | `twenty-server/src/engine/metadata-modules/metadata-side-effect/services/metadata-side-effect-engine.service.ts` | Expands metadata ops with companion changes | System fields/indexes/search vector added automatically | Migration |
| 14 | `twenty-server/src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service.ts` + `workspace-migration-runner/` | Diff flat maps → actions → run (metadata rows + DDL in one tx) | The metadata → physical-schema pipeline | Metadata, DDL, cache |
| 15 | `twenty-server/src/engine/workspace-manager/workspace-manager.service.ts` | Workspace init (schema + standard-object seeding) | Tenant creation | Multi-tenancy, standard app |
| 16 | `twenty-server/src/engine/api/graphql/workspace-query-runner/listeners/entity-events-to-db.listener.ts` | Sync events → async jobs bridge | Webhooks, workflow triggers, audit all start here | Events, queues |
| 17 | `twenty-server/src/engine/core-modules/message-queue/message-queue.explorer.ts` | Discovers/registers BullMQ workers | How jobs get picked up | Worker, all async features |
| 18 | `twenty-server/src/modules/workflow/workflow-runner/jobs/run-workflow.job.ts` + `workflow-executor/workspace-services/workflow-executor.workspace-service.ts` | Workflow execution | Automation engine core | Queues, actions, AI |
| 19 | `twenty-server/src/engine/metadata-modules/ai/ai-chat/services/chat-execution.service.ts` | AI chat streamText loop | AI agent execution + tool calling | Providers, tools, streaming |
| 20 | `twenty-server/src/engine/core-modules/tool-provider/services/{tool-executor,tool-registry}.service.ts` | AI tool registration + dispatch | Meta-tool function-calling | AI, record-crud |
| 21 | `twenty-server/src/engine/metadata-modules/permissions/permissions.service.ts` | Compute effective permissions | RBAC resolution feeding ORM + UI | Roles, cache |
| 22 | `twenty-front/src/modules/object-metadata/utils/mapObjectMetadataToGraphQLQuery.ts` | Generates record GraphQL from metadata | The metadata-driven UI query builder | Records, permissions |
| 23 | `twenty-front/src/modules/object-record/record-field/ui/components/FieldDisplay.tsx` | Guard-based field-type → component dispatch | How the record UI renders any field type | Record store, field types |
| 24 | `twenty-front/src/modules/apollo/services/apollo.factory.ts` | Two Apollo clients + auth/renewal links | Frontend↔backend transport | Auth, GraphQL |
| 25 | `twenty-front/src/modules/ui/utilities/state/jotai/utils/createAtomComponentState.ts` | Component-instance-scoped state | How identical state is isolated per instance | All UI state |

Supporting anchors: `twenty-shared/src/types/FieldMetadataType.ts` + `composite-types/` (field type system), `twenty-sdk/src/sdk/define/index.ts` (app definition API), `twenty-docker/twenty/entrypoint.sh` (startup migrations).
