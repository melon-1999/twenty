# 25 — Risks & Complexity

Areas that are highly coupled, dynamically generated, migration-/security-/performance-sensitive, or upgrade-conflict prone. Read before making non-trivial changes.

## 1. The metadata → schema → API pipeline (highest coupling)

`metadata-modules/flat-*` + `metadata-side-effect/` + `workspace-manager/workspace-migration/` + the dynamic GraphQL schema generation are one tightly-linked machine. A change to flat metadata shape, a migration action handler, or a side-effect handler can ripple into physical DDL, GraphQL schema generation, permissions, and the frontend query builder simultaneously. **Blast radius is workspace-wide and per-tenant.** Test with integration tests + DB reset, and consider existing tenants (may need a workspace command backfill).

## 2. Dynamically generated code (hard to grep, hard to reason about)

- The workspace GraphQL schema, CRUD resolvers, OpenAPI, and client SDK do **not exist as source** — they are generated at runtime from metadata. You can't find `createCompany` by grep; it's synthesized by `WorkspaceResolverFactory` + `mapObjectMetadataToGraphQLQuery`. The "direct execution" hot-path bypass adds another layer (graphql-js is skipped for workspace fields).
- Standard objects are **not `@WorkspaceEntity` classes** — they're static flat-metadata builders (`twenty-standard-application/`). The `*.workspace-entity.ts` files are typing shapes only. Editing them does nothing to the schema by itself.

## 3. Migration / upgrade sensitivity

- Instance commands and workspace commands are **append-only**: never delete or rewrite committed `up`/`down` (enforced by convention + oxlint `no-data-mutation-in-fast-instance-command`, `upgrade-command-filename`). Legacy TypeORM migrations are frozen (`legacy-typeorm-migrations-do-not-add/`).
- Slow instance commands run data migrations; getting `up`/`down` wrong or non-idempotent breaks upgrades across all tenants.
- Startup migrations run in `entrypoint.sh` (server owns them; worker skips). `WORKSPACE_SCHEMA_DDL_LOCKED` gates DDL during hot upgrades.

## 4. Security-sensitive boundaries

- **Tenant isolation** rests on the schema path being derived from the authenticated `workspaceId` and never from user input. Any code that constructs a workspace schema/table name from request data, or bypasses `GlobalWorkspaceDataSource`'s `createQueryBuilder`/`query` guards (`shouldBypassPermissionChecks`), risks cross-tenant leakage.
- **WorkspaceScopedRepository** deliberately omits `softRemove`/`recover`/`remove` (PK-only WHERE could hit another tenant). Don't re-add them; use criteria-based `delete`/`softDelete`.
- **Permissions** are enforced in the ORM query builders (`permissions.utils.ts`) + RLS SQL, not just resolvers. New query paths must go through the permission-aware manager. oxlint enforces resolver/REST-method guarding.
- **Auth**: session tokens are cookie-only (rejected as Bearer); token renewal is de-duplicated. Impersonation is event-logged. Outbound HTTP must use `SecureHttpClientService` (SSRF guard); webhooks HMAC-sign.
- **AI/tools**: LLM tool execution runs under a role's permission config; `AI_PROVIDERS` custom-provider templates are intentionally NOT resolved (anti-exfiltration). Code-interpreter/logic-function sandboxing (e2b/Lambda) matters for untrusted code.

## 5. Performance-sensitive spots

- The **direct-execution** path exists because building/executing the full per-workspace GraphQL schema per request is expensive; the SDL is cached as a string and rehydrated only for introspection. Changes here affect every workspace request.
- **Caching**: heavy reliance on `WorkspaceCacheStorageService` (flat maps, permissions, SDL, resolver-name map). Incorrect invalidation → stale schema or permissions; over-invalidation → recompute storms. The metadata-version bump + selective invalidation in the migration runner is the control point.
- **Queues**: most run concurrency 1; `ai-stream-queue` (20) and `logic-function-queue` (10) are the parallel ones. Long-running workflow jobs re-chunk after 20 steps to avoid stalls. Messaging/calendar sync fan-out over all workspaces can be heavy.
- **N+1**: record relations use Dataloaders (GraphQL context) + `ProcessNestedRelationsHelper`; new relation-fetching code should reuse them.

## 6. Frontend complexity

- **State**: Jotai with a bespoke Recoil-shaped wrapper + component-instance scoping (`createAtomComponentState` + instance contexts). Getting instanceId resolution wrong (prop > context > throw) causes cross-instance state bleed. oxlint rules (`no-jotai-store-in-selector`, `matching-state-variable`) guard common mistakes.
- **Metadata-driven UI**: columns, queries, and cells derive from `objectMetadataItems` + permissions. A field that isn't in `readableFields` silently drops from queries. The offline metadata store (IndexedDB + SSE + collection hashes) adds a caching layer that can go stale.
- **Two Apollo clients** (`/graphql` vs `/metadata`) — using the wrong one is a common error.

## 7. Upgrade-conflict-prone areas (if you fork)

Anything under `engine/metadata-modules/`, `engine/twenty-orm/`, `engine/api/graphql/`, `workspace-manager/`, the field-type system, and the AI/tool layer changes frequently and is deeply interconnected. Forking these guarantees painful merges. Prefer the app/SDK route ([24](24-EXTENSION-VS-CORE.md)).

## 8. Known caveats from this analysis

- Physically there is **no separate `metadata` Postgres schema** — metadata tables live in `core` (inferred from entity decorators, not a live DB enumeration).
- Some deep internals were read at interface/structure level rather than line-by-line (logic-function Lambda packaging specifics, some RBAC cache builders, SAML/OIDC signature verification). Treat those specifics as "confirmed role, unconfirmed exact implementation."
