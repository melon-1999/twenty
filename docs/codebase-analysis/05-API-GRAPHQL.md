# 05 — API & GraphQL

Paths under `packages/twenty-server/src/`. Thesis: **object/field metadata is the single source of truth.** From it Twenty generates, at runtime and per workspace, (a) the GraphQL schema, (b) auto-CRUD resolvers, (c) OpenAPI/REST, (d) physical DDL. Modern implementation uses an immutable **flat metadata** representation.

## 1. Two GraphQL servers

| API | Path | Module | Scope | Style |
|-----|------|--------|-------|-------|
| Core / workspace data | `/graphql` | `core-engine.module.ts` via `graphql-config/graphql-config.service.ts` | `core` | `autoSchemaFile` (code-first) **+ dynamic per-workspace schema** |
| Metadata | `/metadata` | `api/graphql/metadata-graphql-api.module.ts` (`metadata.module-factory.ts`) | `metadata` | pure code-first NestJS resolvers |

Both `YogaDriver`, `GraphQLJSON` scalar, shared error-handler plugin, introspection gating, complexity validation. Scope enforced by `@CoreResolver`/`@MetadataResolver`/`@AdminResolver` decorators. The metadata API is conventional (e.g. `object-metadata.resolver.ts` with `createOneObject`/`updateOneObject`/`deleteOneObject`), cached via a `useCachedMetadata` Yoga plugin.

## 2. Dynamic workspace schema generation

Top-level entry `api/graphql/workspace-schema.factory.ts` — `WorkspaceSchemaFactory.createGraphQLSchema(workspace, applicationId?)`:
1. `WorkspaceGraphqlSchemaSDLService.getOrComputeSchemaSDL` → `{sdl, usedScalarNames, flatObjectMetadataMaps, flatFieldMetadataMaps, flatIndexMaps}`.
2. `WorkspaceResolverFactory.create(...)` → auto-CRUD resolver map.
3. `makeExecutableSchema({typeDefs: gql`${sdl}`, resolvers})`.

`workspace-graphql-schema-sdl/workspace-graphql-schema-sdl.service.ts` (caching coordinator): loads flat maps via `WorkspaceManyOrAllFlatEntityMapsCacheService`, optionally filters by `applicationId` (an app sees only standard objects + its own), computes a `metadataCacheHash`, tries `WorkspaceCacheStorageService.getGraphQLTypeDefs`; on miss runs `WorkspaceGraphQLSchemaGenerator.generateSchema`, `printSchema`s it, and **caches the SDL string** (not a live schema) in Redis, rehydrated with `buildSchema`.

Type factories (`workspace-schema-builder/graphql-type-generators/`, orchestrated by `GqlTypeGenerator.buildAndStore`): composite-field types (8 composites), per-object enum/object/Edge/Connection/GroupBy/create/update/filter/order-by/group-by input types + object-with-relations, root Query/Mutation. Field→GraphQL mapping in `services/type-mapper.service.ts` (UUID→custom UUIDScalar, NUMERIC→BigFloat, POSITION→Position, RAW_JSON→GraphQLJSON, …). Custom scalars in `graphql-types/scalars/`. Generated types keyed in `storages/gql-types.storage.ts`.

## 3. Auto-generated CRUD resolvers

`workspace-resolver-builder/workspace-resolver.factory.ts` iterates every object × method, gated by `WorkspaceResolverBuilderService.shouldBuildResolver`. Method set (`factories/factories.ts`):
- Queries: `findMany`, `findOne`, `findDuplicates`, `groupBy`
- Mutations: `createMany`, `createOne`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany` (soft), `destroyOne`, `destroyMany` (hard), `restoreOne`, `restoreMany`, `mergeMany`

Each factory returns a thin closure; real work is in the common layer.

## 4. Shared execution core (REST + GraphQL + MCP converge)

`api/common/common-query-runners/`. Base `CommonBaseQueryRunnerService` handles throttling (`ThrottlerService`), validation, settings-permission checks, arg processing (`QueryRunnerArgsFactory`, `FilterArgProcessorService`, `DataArgProcessorService`), pre/post hooks (`WorkspaceQueryHookService`), complexity limits, and executes via `GlobalWorkspaceOrmManager.executeInWorkspaceContext` with `resolveRolePermissionConfig`. `common-find-many-query-runner.service.ts`: builds `WorkspaceSelectQueryBuilder`, applies filter/order via `GraphqlQueryParser`, cursor filters, `take(limit+1)`, nested relations, aggregation.

## 5. Filtering, sorting, pagination

Parsers `api/graphql/graphql-query-runner/graphql-query-parsers/`:
- **Filter**: `ObjectRecordFilter` tree (`and`/`or`/`not`, per-field ops `eq`/`in`/`gt`/`ilike`/`startsWith`) → TypeORM WHERE. Per-scalar filter input types in `graphql-types/input/*-filter.input-type.ts`.
- **Order**: multi-column + relation-field ordering; `OrderByDirection` (AscNullsFirst/Last…).
- **Selected fields**: split into select/relations/aggregate.

Pagination is **Relay cursor connections**: `object-records-to-graphql-connection.helper.ts` builds `{edges:[{node,cursor}], pageInfo{hasNextPage,...}, totalCount}`. Cursors opaque (encode order-by values). Args `first/after`, `last/before`, `offset`. Ceilings `QUERY_MAX_RECORDS`, relations `QUERY_MAX_RECORDS_FROM_RELATION`.

## 6. "Direct execution" — the hot-path bypass

For `/graphql`, Twenty **does not run graphql-js execution against the full per-workspace schema on the hot path.** Yoga `onRequest` plugin `direct-execution/hooks/use-direct-execution.hook.ts`:
1. Parses the query AST, classifies top-level fields against a cached `graphQLResolverNameMap` (introspection / workspace / core).
2. Mixed core+workspace → `UserInputError`. Pure core → normal NestJS schema.
3. Else `DirectExecutionService.execute` invokes the matching resolver factory directly (bypassing graphql-js `execute`), builds a partial `GraphQLResolveInfo`, formats result from the selected-field set.

The **full `GraphQLSchema` is only built for genuine introspection** (`buildSchema(sdl)` + `execute`) and for SDK generation. This is why SDL is cached as a string and the resolver-name map is cached separately.

## 7. REST API (`api/rest/`)

One generic wildcard controller `core/controllers/rest-api-core.controller.ts` (`@Controller(ApiPath.Rest)`, guarded `JwtAuthGuard`/`WorkspaceAuthGuard`/`CustomPermissionGuard`). Express wildcard routes: `GET *path`, `POST batch/*path`, `POST *path/duplicates`, `GET *path/groupBy`, `PATCH restore/*path`, `PATCH *path/merge`. `RestApiCoreService` dispatches to per-verb handlers (`core/handlers/`, extend `RestApiBaseHandler`), parses REST query params, resolves permissions, and **calls the same common-query-runners as GraphQL**. Runtime metadata CRUD is served by the GraphQL metadata resolvers (no separate REST metadata controller).

## 8. MCP API (`api/mcp/`)

Single JSON-RPC 2.0 `@Post()` endpoint `mcp-core.controller.ts` (`@Controller(ApiPath.Mcp)`, guarded `McpAuthGuard`/`WorkspaceAuthGuard`/`NoPermissionGuard`). Supports JSON + SSE. `McpProtocolService.handleMCPCoreQuery` implements `initialize`, `ping`, `tools/list`, `tools/call`. Tools = meta tools (`get_tool_catalog`, `execute_tool`, `learn_tools`, `load_skill`) + `list_object_metadata_names`, `list_skills` + preloaded. Execution reaches data via `tool-registry.service.ts` → `DatabaseToolProvider` → `record-crud` services → **the same common-query-runners**. Writes attributed via `ActorMetadata` (`FieldActorSource.AGENT`).

## 9. OpenAPI (`core-modules/open-api/`)

Public `GET .../open-api/core` and `.../open-api/metadata`. `open-api.service.ts` generates the spec **dynamically per workspace** from flat metadata maps: paths `/{namePlural}`, `/batch/...`, `/{id}`, `/duplicates`, `/restore/...`, `/merge`, `/groupBy`, plus webhooks and components. Typed against `openapi-types` `OpenAPIV3_1`.

## 10. Error handling

- **GraphQL**: envelop plugin `use-graphql-error-handler.hook.ts` — metrics, normalize to `BaseGraphQLError`, capture to Sentry (adds `exceptionEventId`), i18n `userFriendlyMessage`. `onValidate` enforces `x-schema-version`/`x-app-version` (throws `SCHEMA_MISMATCH`/`APP_VERSION_MISMATCH`).
- **REST/MCP**: `rest-api-exception.filter.ts` → `HttpExceptionHandlerService` (non-HTTP → 400). MCP → JSON-RPC errors; tool failures return success with `result.isError:true`.

## 11. Is the API dynamic/metadata-generated?

**Yes, definitively.** The workspace GraphQL schema, its CRUD resolvers, the REST surface, and the OpenAPI spec are all generated at runtime from each workspace's object/field metadata (flat maps), cached, and invalidated by the metadata version bump. Only the `/metadata` API itself and a small set of core queries are statically defined. See [07-METADATA-ENGINE.md](07-METADATA-ENGINE.md) for the metadata → schema pipeline.
