# 04 — Backend Architecture

Package `packages/twenty-server` (NestJS 11). Paths below are under `src/`.

## 1. Three process entry points

One codebase, three `bootstrap()`s / root modules:

- **HTTP app** — `main.ts` → `AppModule` (`app.module.ts`). `NestFactory.create<NestExpressApplication>(AppModule, {rawBody:true, ...})`, optional TLS from `SSL_KEY_PATH`/`SSL_CERT_PATH`. Registers `unhandledRejection` → `ExceptionHandlerService`, `trust proxy`, credentialed CORS, `express-session`, class-validator `useContainer`, body parsers, `graphql-upload` on `/graphql` and `/metadata`. `import './instrument'` runs first (line 25). Listens on `NODE_PORT`.
- **Queue worker** — `queue-worker/queue-worker.ts` → `QueueWorkerModule`. `NestFactory.createApplicationContext(...)` — **headless, no HTTP listener**, `enableShutdownHooks()`. Imports `CoreEngineModule`, `MessageQueueModule.registerExplorer()` (spins up BullMQ workers), `JobsModule`, `TwentyORMModule`, `GlobalWorkspaceDataSourceModule`.
- **CLI** — `command/command.ts` → `CommandModule` (`nest-commander`). Behind `database:*`, `cache:flush`, `upgrade`, workspace/instance commands.

**`instrument.ts`** (imported before Nest boots): Sentry init (if `EXCEPTION_HANDLER_DRIVER=sentry`) + OpenTelemetry metrics (`MeterProvider`, Prometheus:9464 / OTLP / Console via `METER_DRIVER`).

## 2. Module organization

| Layer | Dir | What |
|-------|-----|------|
| Platform/framework | `engine/` | GraphQL API generation (`engine/api/`), custom ORM (`engine/twenty-orm/`), middleware, guards, decorators, dataloaders, subscriptions, workspace-manager |
| Infra (mostly `@Global`) | `engine/core-modules/` | auth, jwt, twenty-config, logger, cache-storage, redis-client, message-queue, exception-handler, file-storage, i18n, email, billing, feature-flag, throttler, metrics, sentry, ai, tool, … Aggregated by `core-engine.module.ts` (~167 refs) |
| Metadata system | `engine/metadata-modules/` | object/field/index metadata, permissions/roles, views, page-layouts, webhooks, and the `flat-*` family. Served on a separate `/metadata` GraphQL schema |
| Domain logic | `modules/` | messaging, calendar, workflow, connected-account, standard objects (person/company/task/…), listeners, `@Processor` jobs. Aggregated by `modules.module.ts`. Record CRUD resolvers are NOT here (generated dynamically) |

## 3. Three GraphQL registrations (Yoga)

All on `YogaDriver`, each its own endpoint:
- **`/graphql`** — `GraphQLConfigService` (`engine/api/graphql/graphql-config/graphql-config.service.ts`), `resolverSchemaScope:'core'`. Static core schema (auth/billing/admin) + dynamic per-workspace record schema (see [05](05-API-GRAPHQL.md)).
- **`/metadata`** — `MetadataGraphQLApiModule` (`metadataModuleFactory`), `resolverSchemaScope:'metadata'`. Hand-written metadata resolvers.
- **admin panel** — `AdminPanelGraphQLApiModule`.

Yoga envelop plugins (not Nest interceptors): `useDirectExecution`, `useGraphQLErrorHandlerHook`, introspection gating for unauthenticated users, query-complexity validation (`GRAPHQL_MAX_FIELDS`/`GRAPHQL_MAX_ROOT_RESOLVERS`), conditional Sentry tracing. GraphQL context injects per-request Dataloaders.

## 4. Request lifecycle — middleware is the real auth entry

Auth happens in **Express middlewares** (`AppModule.configure`), not guards. Order for `/graphql`, `/metadata`, `/admin-panel`:
1. `CookieSessionCsrfMiddleware` — CSRF for cookie-session auth.
2. `GraphQLHydrateRequestFromTokenMiddleware` → `MiddlewareService.hydrateGraphqlRequest(req)`.
3. `WorkspaceAuthContextMiddleware` — builds the typed auth context, enters the ALS scope.

`MiddlewareService.hydrateGraphqlRequest` (`engine/middlewares/middleware.service.ts`): `accessTokenService.validateTokenByRequest(req)` (JWT bearer, API key, application, or user session cookie — session tokens are cookie-only, rejected as Bearer), resolves+caches metadata version, then `bindDataToRequestObject` (`engine/utils/bind-data-to-request-object.util.ts`) stamps `req.user/apiKey/application/workspace/workspaceId/workspaceMemberId/userWorkspaceId/workspaceMetadataVersion/authProvider/impersonationContext/locale`.

## 5. Workspace scoping via AsyncLocalStorage

`WorkspaceAuthContextMiddleware` → `buildAuthContext(req)` picks a builder (api-key / user / application / pending-activation) → `withWorkspaceAuthContext(ctx, () => next())`.

- `engine/core-modules/auth/storage/workspace-auth-context.storage.ts`: `workspaceAuthContextStorage = new AsyncLocalStorage()`; `getWorkspaceAuthContext()` throws if unset.
- The **dynamic record resolvers don't receive workspace via decorators** — they read it from ALS (`createQueryRunnerContext` → `getWorkspaceAuthContext()`), which supplies `workspaceId` + flat metadata maps to the ORM. This is the primary tenant-scoping mechanism.
- The ORM layer has a parallel ALS: `engine/twenty-orm/storage/orm-workspace-context.storage.ts` (`ORMWorkspaceContext`), entered by `GlobalWorkspaceOrmManager.executeInWorkspaceContext()` (see [06](06-DATABASE-DATA-MODEL.md)).

## 6. Guards, decorators, filters, interceptors

- **Guards** (`engine/guards/`), defense-in-depth after middleware: `WorkspaceAuthGuard` (`!!request.workspace`, on ~120 files), `JwtAuthGuard` (self-contained: validates + binds; used for REST/metadata/MCP controllers), `SettingsPermissionGuard(PermissionFlagType.X)` (factory, per-method), `CustomPermissionGuard`, `FeatureFlagGuard`, `PublicEndpointGuard`, `NoPermissionGuard`, `UserAuthGuard`, impersonation guards.
- **Decorators** (`engine/decorators/`): `createParamDecorator` accessors reading the hydrated request — `@AuthWorkspace()`, `@AuthUser`, `@AuthApiKey`, `@AuthApplication`, `@AuthWorkspaceMemberId`, `@AuthProvider`, `@AuthImpersonationContext`. Resolver-scope decorators `@CoreResolver`/`@MetadataResolver`/`@AdminResolver` tag which schema build includes a resolver.
- **Filters**: per-resolver `@UseFilters(...)` (domain `*-graphql-api-exception.filter.ts` / `*-rest-api-exception.filter.ts`); global `APP_FILTER` = `UnhandledExceptionFilter` (`src/filters/`) mainly re-attaches CORS headers on early failures. GraphQL error shaping is primarily the `useGraphQLErrorHandlerHook` Yoga plugin.

## 7. Error handling & logging

- `ExceptionHandlerService` (`engine/core-modules/exception-handler/`, `@Global`), driver-based (console/sentry via `EXCEPTION_HANDLER_DRIVER`), `captureExceptions([errors], {user, workspace})`. `shouldCaptureException` filters expected errors.
- `LoggerService` (`engine/core-modules/logger/`, `@Global`), delegates to `LOGGER_DRIVER`; installed via `app.useLogger(logger)` in all three bootstraps.
- Sentry: `instrument.ts` + `SentryModule.forRoot()`; per-request workspace context via `applyWorkspaceSentryContext` + `useSentryTracing`.

## 8. Caching

- `CacheStorageService` (`engine/core-modules/cache-storage/`, `@Global`): namespaced wrapper over `@nestjs/cache-manager`, one instance per `CacheStorageNamespace`, injected via `@InjectCacheStorage(ns)`. Redis (node-redis via `cache-manager-redis-yet`); rich Redis ops (SET NX locks, sets, sorted sets, `SCAN`-based `flushByPattern`). Requires `REDIS_URL`.
- `RedisClientService` (`@Global`): separate **ioredis** client — `getClient()`, `getQueueClient()` (BullMQ, `REDIS_QUEUE_URL ?? REDIS_URL`), `getPubSubClient()` (GraphQL subscriptions).
- `WorkspaceCacheStorageService` (`engine/workspace-cache-storage/`): per-workspace cache (TTL 1 week) — metadata version, GraphQL SDL/scalars (hash-keyed by `${workspaceId}:${metadataCacheHash}`), feature-flag maps, permission maps. Invalidation `flush(workspaceId)` + `SCAN`-pattern flush.

## 9. Configuration — TwentyConfigService

`engine/core-modules/twenty-config/twenty-config.service.ts`: typed façade `get<K extends keyof ConfigVariables>(key)`. Resolution: env-only vars → env; else DB driver (if `IS_CONFIG_VARIABLES_IN_DB_ENABLED`) → env → default. `ConfigVariables` (`config-variables.ts`, ~2300 lines) declares every var with a default and `@ConfigVariablesMetadata({group, description, type, isSensitive, isEnvOnly})`. Drivers: `EnvironmentConfigDriver` and `DatabaseConfigDriver` (in-memory `ConfigCacheService`, refreshed `@Cron('*/15s')`, persisted encrypted in `keyValuePair`). `@Global`, DB driver `@Optional()` so it degrades to env-only. See [16](16-CONFIGURATION.md).

## 10. Event system

- `WorkspaceEventEmitter` (`engine/workspace-event-emitter/`, `@Global`): thin wrapper over `EventEmitter2`. **Batch-only** methods: `emitDatabaseBatchEvent` (event name `${objectName}.${action}`, payload `WorkspaceEventBatch{workspaceId, objectMetadata, events[]}`) and `emitCustomBatchEvent`. Workspace scoping is by embedding `workspaceId` in payload.
- **Emission** originates in the ORM write path (`workspace-entity-manager.ts` + insert/update/delete builders) via `formatTwentyOrmEventToDatabaseBatchEvent` → `ObjectRecord{Create,Update,Delete,Destroy,Restore,Upsert}Event` (with before/after/diff; drops zero-change updates).
- **Consumption** via `@OnDatabaseBatchEvent(object, action)` (wrapper over `@OnEvent`, supports `'*'`). The central bridge `EntityEventsToDbListener` (`engine/api/graphql/workspace-query-runner/listeners/entity-events-to-db.listener.ts`): publishes to GraphQL subscriptions, enqueues `CallWebhookJobsJob` (webhookQueue), `CallDatabaseEventTriggerJobsJob` (triggerQueue → workflows), and (if `isAuditLogged`) event-log + timeline jobs. This is the **sync-event → async-job boundary**.

## 11. Background processing wiring

- Queues: `MessageQueue` enum (`engine/core-modules/message-queue/message-queue.constants.ts`) — 17 queues.
- Producer: `MessageQueueService` (`@InjectMessageQueue(MessageQueue.x)`, `.add(JobClass.name, data, {retryLimit})`), driver = BullMQ (`bullmq.driver.ts`) or Sync (tests).
- Consumer: `MessageQueueModule.registerExplorer()` → `MessageQueueExplorer` (`OnModuleInit`) discovers `@Processor(queue)`/`@Process(JobName)` classes via `DiscoveryService`, filters by `WORKER_ENABLED_QUEUES`/`WORKER_EXCLUDED_QUEUES`, and `queue.work(handler)` per enabled queue. Full detail in [15](15-BACKGROUND-JOBS.md).

## 12. End-to-end authenticated GraphQL query (files)

`main.ts` → `CookieSessionCsrfMiddleware` → `GraphQLHydrateRequestFromTokenMiddleware` (`MiddlewareService` → `AccessTokenService.validateTokenByRequest` → `bindDataToRequestObject`) → `WorkspaceAuthContextMiddleware` (`withWorkspaceAuthContext`) → Yoga plugins → dynamic workspace schema (`WorkspaceSchemaFactory`, cached) → resolver → `getWorkspaceAuthContext()` → twenty-orm (workspace schema + permissions) → response; writes additionally emit events → `EntityEventsToDbListener` → jobs.

**Anchor files:** `main.ts`, `app.module.ts`, `middleware.service.ts`, `bind-data-to-request-object.util.ts`, `workspace-auth-context.middleware.ts` + `workspace-auth-context.storage.ts`, `graphql-config.service.ts` + `workspace-schema.factory.ts`, `workspace-event-emitter.ts` + `entity-events-to-db.listener.ts`, `message-queue.explorer.ts`, `core-engine.module.ts`.
