# 15 — Migration Strategy

Existing workspaces must be migrated safely with the compatibility baseline: **all currently-usable capabilities remain enabled** (§32) so behavior is unchanged.

## Migration command (per Twenty's upgrade system)

A **workspace command** (`@RegisteredWorkspaceCommand`, iterates active/suspended workspaces — see codebase-analysis/06) that, for each workspace, calls `WorkspaceCapabilityService.initializeForWorkspace(ws)`:

1. For **core** capabilities → ensure enabled (locked on).
2. For **object-backed optional** capabilities (Dashboards, custom objects) → set enabled = current `ObjectMetadata.isActive` of the capability's object(s). If the object is already active in that workspace, the capability is enabled (preserves current visibility).
3. For **guarded** capabilities (Email, Calendar, Automations, AI) → set enabled = **available** (i.e. today they are effectively on wherever the instance/config allows). Baseline = "on where it currently works", so no user loses a feature on upgrade.
4. Seed a `WorkspaceCapabilityEntity` row per capability.

Idempotent (safe to re-run); resumable via the upgrade-command framework.

## New workspaces

`initializeForWorkspace` runs during workspace creation (alongside `enableFeatureFlags(DEFAULT_FEATURE_FLAGS)` and standard-app seeding): core on, optional = `defaultEnabled` from the catalog. Object-backed defaults align with which standard objects the Standard app seeds active.

## Safe defaults

- No capability is disabled by the migration that was usable before → **zero behavior change on upgrade** when nothing is toggled (compatibility baseline, §32).
- If the catalog later changes a `defaultEnabled`, that affects only new workspaces, not migrated ones (which carry their explicit rows).

## Backward compatibility

- Absence of a `WorkspaceCapabilityEntity` row for a capability resolves to: core → on; optional → `defaultEnabled`. So even pre-migration reads are safe. The migration makes state explicit but the resolver degrades gracefully.
- The `currentWorkspace.enabledCapabilities` field is additive; older clients ignore it.

## Rollback

- Because disabling preserves data ([14](14-DATA-PRESERVATION.md)) and the migration only *enables* current state, rolling back the feature = ignoring the new field / dropping the new table; no data loss. Object `isActive` values are untouched by the migration except to derive initial enabled state.

## Instance vs workspace command

- Schema (create `core.workspaceCapability`) → a **fast instance command** (`database:migrate:generate --type fast`).
- Data backfill (seed rows per workspace) → a **workspace command** (iterates workspaces). See codebase-analysis/06 UPGRADE_COMMANDS.
