# 06 — Database & Data Model

Paths under `packages/twenty-server/`. PostgreSQL is the primary store; the ORM is a **custom permission-aware, schema-per-tenant layer on top of TypeORM** (`engine/twenty-orm/`).

> **Correction to older docs:** the `@WorkspaceEntity` decorator system no longer exists (`grep "@WorkspaceEntity"` = 0 hits). Standard objects are defined as **static flat-metadata builders**; the `*.workspace-entity.ts` files are decorator-free TypeScript *typing shapes* only.

## 1. Two datasources, one database

Both point at the same Postgres DB (`PG_DATABASE_URL`), different schemas:

1. **Core datasource** — `src/database/typeorm/core/core.datasource.ts`. Fixed `schema:'core'`, `synchronize:false`. Loads entities from `engine/core-modules/**/*.entity.ts` and `engine/metadata-modules/**/*.entity.ts`. The standard `@InjectDataSource()` one.
2. **GlobalWorkspaceDataSource** — `engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.ts`. Custom TypeORM `DataSource` subclass built once at boot with `entities:[]` (entities supplied dynamically per request). Serves **all workspaces** from a single pool; optional read replica from `PG_DATABASE_REPLICA_URL`.

## 2. GlobalWorkspaceDataSource forces permission-aware access

Overrides:
- `createEntityManager()` → returns `WorkspaceEntityManager` (not plain `EntityManager`).
- `createQueryBuilder()` → **throws `PermissionsException`** unless `calledByWorkspaceEntityManager:true`.
- `query()` → throws unless `shouldBypassPermissionChecks:true`.
- Context read from ALS `getWorkspaceContext()` (not constructor state).

## 3. Request-scoped ORM context

`engine/twenty-orm/storage/orm-workspace-context.storage.ts`: `workspaceContextStorage = new AsyncLocalStorage<ORMWorkspaceContext>()`. Carries `authContext`, flat metadata maps (`flatObjectMetadataMaps`, `flatFieldMetadataMaps`, `flatIndexMaps`), `entityMetadatas` (the workspace's `EntityMetadata[]`), `permissionsPerRoleId`, `featureFlagsMap`, RLS predicate maps.

`GlobalWorkspaceOrmManager.executeInWorkspaceContext()` (`global-workspace-orm.manager.ts`) is the entry point: loads context via `WorkspaceCacheService.getOrRecompute(workspaceId, [...])` and runs the callback inside `withWorkspaceContext(context, fn)`. Variants: full `loadWorkspaceContext` vs metadata-only `loadLiteWorkspaceContext`.

## 4. WorkspaceEntityManager & WorkspaceRepository

- `entity-manager/workspace-entity-manager.ts` extends TypeORM `EntityManager`; wires permission checks (`validateOperationIsPermittedOrThrow`), event emission, composite-field formatting (`formatData`/`formatResult`), files-field sync, nested-relation queries. Accepts `PermissionOptions {shouldBypassPermissionChecks, objectRecordsPermissions}`.
- `repository/workspace.repository.ts` — returned by `dataSource.getRepository(target, permissionOptions, authContext)`.
- Custom builders: `workspace-select/insert/update/delete/soft-delete-query-builder.ts`. The select builder applies **row-level permission (RLS) predicates in SQL** (`apply-row-level-permission-predicates.util.ts`, `render-row-level-permission-filter-to-sql.util.ts`).

## 5. WorkspaceScopedRepository (separate — for core shared tables)

`workspace-scoped-repository/workspace-scoped-repository.ts` wraps a plain `Repository<T>` for **core-schema tables carrying a `workspaceId` column** (e.g. `RoleEntity`). Every method takes `workspaceId` first and merges `workspace_id = ?`; `assertWorkspaceId` rejects empty (TypeORM drops `undefined` from WHERE = would emit unscoped query). Security note in source: `softRemove`/`recover`/`remove` are **intentionally omitted** (PK-only WHERE could hit another tenant's row); callers must use criteria-based `delete`/`softDelete`. Injected via `@InjectWorkspaceScopedRepository(Entity)`.

## 6. Per-workspace Postgres schemas

- **Schema name**: `engine/workspace-datasource/utils/get-workspace-schema-name.util.ts` → `workspace_${uuidToBase36(workspaceId)}` (e.g. `workspace_adhj7eaegq93fzpgbfpdm8ok3`).
- **Lifecycle**: `engine/workspace-datasource/workspace-datasource.service.ts` — `createWorkspaceDBSchema` (`CREATE SCHEMA`), `deleteWorkspaceDBSchema` (`DROP SCHEMA`), both gated by `assertDDLNotLocked()` (`WORKSPACE_SCHEMA_DDL_LOCKED`). `checkSchemaExists` reads `workspace.databaseSchema`.
- **Entity→schema binding**: `engine/twenty-orm/factories/entity-schema.factory.ts` builds a TypeORM `EntitySchema` with `schema: getWorkspaceSchemaName(workspaceId)`, `tableName: computeTableName(nameSingular, isCustom)`, columns/relations from sibling factories. Compiled to `EntityMetadata[]`, cached (`workspace-orm-entity-metadatas-cache.service.ts`), injected as `entityMetadatas`. The schema-qualified path (`workspace_<id>.company`) baked into entity metadata is what isolates tenants.
- **Table/column naming**: `engine/utils/compute-table-name.util.ts` — standard objects use `nameSingular` verbatim; custom objects get a `_` prefix. Composite fields expand columns (e.g. `name` → `nameFirstName`/`nameLastName`, `amount` CURRENCY → `amountMicros`/`amountCurrencyCode`).
- **DDL managers**: `engine/twenty-orm/workspace-schema-manager/` — `WorkspaceSchemaManagerService` composes `tableManager`, `columnManager`, `indexManager`, `enumManager`, `foreignKeyManager`. Raw DDL guarded by `escapeIdentifier`/`removeSqlDDLInjection`.

## 7. Core (non-tenant) entities

Live under `engine/core-modules/**/*.entity.ts` and `engine/metadata-modules/**/*.entity.ts`. Examples: `workspace.entity.ts` (`@Entity({name:'workspace', schema:'core'})` with `databaseSchema`, `activationStatus`, `defaultRoleId`), `user-workspace.entity.ts`, `object-metadata.entity.ts` (`@Entity('objectMetadata')`), `field-metadata.entity.ts`.

**Schema-placement finding:** metadata entities declare `@Entity('name')` **without an explicit schema**, so they inherit `core`. There is **no separate physical `metadata` schema** — metadata tables (`objectMetadata`, `fieldMetadata`, roles, views…) and system tables (`workspace`, `user`, billing) all live in `core`. (Conceptually metadata is distinct; physically it's in `core`.)

## 8. Migrations & the upgrade-command system

- **Legacy TypeORM migrations are frozen**: `core.datasource.ts` loads them only from `src/database/typeorm/core/legacy-typeorm-migrations-do-not-add/`. A comment forbids adding files there.
- **New system = Instance Commands + Workspace Commands** (`src/database/commands/upgrade-version-command/<version>/`, docs `docs/UPGRADE_COMMANDS.md`):
  - **Instance commands** (`FastInstanceCommand`/`SlowInstanceCommand`, `@RegisteredInstanceCommand(version, timestamp, {type})`) run once at instance level. Fast = immediate schema change with `up`/`down`; Slow adds `runDataMigration(dataSource)` before `up` (only with `--include-slow`). Auto-registered in `instance-commands.constant.ts` — never edit manually; generate via `nx run twenty-server:database:migrate:generate --name <n> --type <fast|slow>`.
  - **Workspace commands** (`@RegisteredWorkspaceCommand`, extend `ActiveOrSuspendedWorkspaceCommandRunner`) iterate active/suspended workspaces via `WorkspaceIteratorService`, with `--dry-run`/`--verbose`/workspace-filter.
  - **Order**: instance-fast → instance-slow → workspace, sorted by timestamp; resumable via the `upgradeMigration` table. Never delete/rewrite committed `up`/`down`.
- **ClickHouse** analytics has its own SQL migrations `src/database/clickHouse/migrations/`.

## 9. Custom objects/fields lifecycle (summary)

The modern path replaces `@WorkspaceEntity` seeding: **static flat-metadata builders → metadata diff → workspace-migration runner → metadata rows in `core` + physical tables in `workspace_<id>`.** All in one core-DB transaction. Full detail in [07-METADATA-ENGINE.md](07-METADATA-ENGINE.md). Standard-object modules present: `company`, `person`, `opportunity`, `task`, `note`, `attachment`, `blocklist`, `call-recording`, `dashboard`, `emailing`, `timeline`, `workspace-member` (under `src/modules/*/standard-objects/`).

## 10. Naming conventions (DB)

- Workspace schema: `workspace_<base36(uuid)>`.
- Standard tables: bare `nameSingular` (`company`, `person`); custom tables: `_`-prefixed.
- FK columns: `${name}Id` (e.g. `companyId`); enum types: `${tableName}_${columnName}_enum`.
- Composite columns: `${field}${SubField}` (e.g. `nameFirstName`).

**Anchor files:** `engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.ts`, `.../global-workspace-orm.manager.ts`, `.../storage/orm-workspace-context.storage.ts`, `.../entity-manager/workspace-entity-manager.ts`, `.../repository/workspace.repository.ts` + `permissions.utils.ts`, `.../factories/entity-schema.factory.ts`, `.../workspace-scoped-repository/workspace-scoped-repository.ts`, `.../workspace-schema-manager/`, `engine/workspace-datasource/workspace-datasource.service.ts`, `src/database/typeorm/core/core.datasource.ts`, `src/database/commands/upgrade-version-command/`.
