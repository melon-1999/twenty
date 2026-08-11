# 05 — Workspace Configuration

Per-workspace enabled/disabled state — the one genuinely new store.

## Pivot: availability is deployment-scoped, not per-workspace-configurable

Module **availability** is now decided at deploy time by the operator via immutable, `isEnvOnly: true` config flags (`IS_<MODULE>_MODULE_ENABLED`), resolved through `TwentyConfigService` — not by workspace admins, and not stored per-workspace. Everything below this line (`WorkspaceCapabilityEntity`, `setEnabled`, the enable/disable mutation) describes the per-workspace store that predates this pivot; it is now DORMANT/deprecated — the code remains in the tree but is no longer read by `@RequireCapability`. See [docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md](../superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md).

## Storage decision (dormant)

**Chosen: `WorkspaceCapabilityEntity`** (`core.workspaceCapability`), columns `id`, `key: ProductCapabilityKey`, `isEnabled: boolean`, `workspaceId`, timestamps; unique `(key, workspaceId)`. Same shape as `FeatureFlagEntity` (proven pattern), semantically the product-capability layer.

**Alternative considered: `workspace.enabledCapabilities: string[]`** column on `WorkspaceEntity`, mirroring the existing `enabledAiModelIds`. Simpler (no new table, one fetch), but loses per-row audit and per-capability metadata. Either is acceptable; the entity is preferred for auditability and future per-capability fields. This is a reversible implementation detail.

**Not used:** `KeyValuePairEntity` (too generic, weak typing) as the primary store — though it could hold non-critical UI preferences.

## Reaching the frontend

Add `enabledCapabilities: [ProductCapabilityKey]` as a resolve-field on `currentWorkspace` (like `featureFlags`, `enabledAiModelIds`), populated from the cached `capabilitiesMap`. One fetch, stored in `currentWorkspaceState`.

## Cache

`capabilitiesMap` as a `@WorkspaceCache` provider (mirror `WorkspaceFeatureFlagsMapCacheService`): compute the per-workspace resolved enabled set (store × availability × dependencies), invalidate on `setEnabled`. No per-request DB query (§34).

## Setting state (dormant — no longer the availability gate)

`WorkspaceCapabilityService.setEnabled(ws, key, value)`:
1. Reject if capability `isCore` (cannot disable) or not `available`.
2. Validate dependencies ([10](10-DEPENDENCIES.md)) — enabling requires deps enabled (auto-enable with confirmation); disabling blocked if a dependent is enabled (or cascade-disable with confirmation).
3. Apply `effect`: for object-backed, set `ObjectMetadata.isActive` for the capability's standard objects; for guarded, nothing beyond the store.
4. Upsert the row, invalidate `capabilitiesMap`, invalidate `currentWorkspace` cache.
5. **Never delete data** (§24).
6. Guard the mutation with `SettingsPermissionGuard(WORKSPACE)` (workspace admin) — reuse the same boundary as the Lab flag mutation.

## Defaults & isolation

- New workspace: `initializeForWorkspace` seeds enabled = `defaultEnabled` for optional capabilities; core always on. Object-backed capabilities align with the objects already seeded active by the Standard app.
- **Isolation:** every row/lookup is `workspaceId`-scoped (like all Twenty per-workspace state); one workspace's config never affects another.

## Requirements checklist (§14)
- persisted ✅ (`core.workspaceCapability`)
- isolated per workspace ✅ (`workspaceId` unique key)
- validated server-side ✅ (`setEnabled` availability+deps+permission)
- accessible frontend-side ✅ (`currentWorkspace.enabledCapabilities`)
- safe defaults ✅ (`defaultEnabled` + migration = current state)
- migration strategy ✅ ([15](15-MIGRATION-STRATEGY.md))
- backward compatibility ✅ (all-enabled = today's behavior, §32)
- easy future extension ✅ (add a catalog entry + enum key)
