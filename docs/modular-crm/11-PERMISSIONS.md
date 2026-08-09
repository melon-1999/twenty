# 11 — Permissions

Capabilities and permissions are orthogonal (§7). We reuse Twenty's authorization system unchanged.

## Two different questions

- **Capability enabled?** → "Is this **workspace** using module X?" (per-workspace, the new layer)
- **User authorized?** → "May **this user** access X?" (per-user via role, existing `PermissionFlagType`/object/field/row permissions)

Both must pass. Neither replaces the other.

```
available (billing/config)  AND  enabled (workspace capability)  AND  authorized (user role/perms)  ⇒  usable
```

## What stays exactly as-is

- `PermissionFlagType` (24 flags), roles, `ObjectPermissionEntity`, `FieldPermissionEntity`, row-level predicates.
- `SettingsPermissionGuard`, ORM `permissions.utils.ts`, `useHasPermissionFlag`, `useObjectPermissions`.
- Object read/write/delete permissions continue to gate active objects; a capability being enabled does **not** grant a user access.

## How they compose per capability

Each catalog entry notes the user-permission that co-gates its settings (`effect.settingsPermission`), but the capability layer never enforces it — the existing guard does. Examples:
- **Automations** capability enabled + user has `WORKFLOWS` permission ⇒ user sees/uses workflows. Capability off ⇒ hidden for everyone; capability on but no `WORKFLOWS` ⇒ hidden for that user (existing behavior).
- **Email** capability enabled + `CONNECTED_ACCOUNTS` ⇒ user can connect/use email.
- **AI** capability enabled + `AI`/`AI_SETTINGS` ⇒ user uses AI.
- Object-backed (Deals): capability on + `canReadObjectRecords` on Opportunity ⇒ user sees Deals.

## Why not model capabilities as role flags

Considered and rejected: a capability is **per-workspace**, a role flag is **per-user**. Encoding "workspace has Email" as a flag applied to all roles is brittle (must sync across roles, breaks on new roles) and conflates the axes. Keep them separate.

## Guard composition (backend)

`@RequireCapability(key)` (enabled) sits **alongside** `SettingsPermissionGuard(flag)` (authorized) and `WorkspaceAuthGuard`. Order is independent; all must pass. The capability guard never short-circuits or replaces a permission check.
