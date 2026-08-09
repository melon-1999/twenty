# 03 — Capability Model

How a product capability is represented. This is the only new abstraction.

## Shared enum (twenty-shared)

`ProductCapabilityKey` — one entry per human-meaningful module. Lives in `twenty-shared` so front + back + (future) SDK share it, mirroring `FeatureFlagKey`/`PermissionFlagType`.

```
CONTACTS · COMPANIES · DEALS · ACTIVITIES · DASHBOARDS ·
EMAIL · CALENDAR · AUTOMATIONS · AI_ASSISTANT
(+ future: PRODUCTS · REPORTS)
```

Core keys and optional keys are distinguished by the catalog, not the enum.

## Catalog entry (code, backend — source of truth)

```
type ProductCapabilityDefinition = {
  key: ProductCapabilityKey;
  name: string;                 // user-facing, translated
  description: string;          // user-facing
  category: 'CRM' | 'COMMUNICATION' | 'AUTOMATION' | 'INSIGHTS' | 'AI' | ...;
  isCore: boolean;              // true => always on, cannot be disabled
  defaultEnabled: boolean;      // for new/optional capabilities
  dependsOn: ProductCapabilityKey[];
  availability?: {              // omit => always available (SMB default)
    entitlementKey?: BillingEntitlementKey;  // consume hasEntitlement()
    configFlags?: string[];                  // require clientConfig flag(s), e.g. MESSAGING_PROVIDER_*
  };
  effect: {
    objectStandardIds?: string[];   // standard object ids to toggle isActive (object-backed)
    settingsPermission?: PermissionFlagType; // the user-permission that co-gates its settings
    // non-object gating is handled by @RequireCapability + hook usage; listed in docs, not data
  };
};
```

Deliberately **not** in the entry: pricing amounts (Stripe), user authorization (roles), UI wiring beyond object ids (kept in the small number of frontend integration points). Keeps the catalog declarative and stable.

## The three states of a capability (resolution)

For a `(workspace, capability)`:

```
available  = (!def.availability?.entitlementKey || billing.hasEntitlement(ws, key))   // hasEntitlement is true when billing disabled
          && (def.availability?.configFlags ?? []).every(f => clientConfig[f])
enabled    = def.isCore || (available && workspaceCapabilityStore.isEnabled(ws, capability)
                             && def.dependsOn.every(d => enabled(ws, d)))
authorized = user side, existing permission flags/object perms (NOT computed here)
usable     = available && enabled && authorized
```

- Core capabilities: `enabled = true` regardless of the store (locked on). Availability still computed but always true for core.
- Dependency chain evaluated recursively; catalog is validated for cycles at load.

## Backend surface

- `ProductCapabilityCatalogService` — exposes the catalog (validated), dependency graph.
- `WorkspaceCapabilityService` — `isEnabled(ws, key)`, `getEnabledMap(ws)` (cached `capabilitiesMap`), `setEnabled(ws, key, value)` (validates availability + deps, applies `effect`, invalidates cache, **never deletes data**), `initializeForWorkspace(ws)` (defaults / migration).
- `@RequireCapability(key)` guard (mirror `FeatureFlagGuard`) for non-object resolvers/jobs.

## Frontend surface

- `currentWorkspace.enabledCapabilities: ProductCapabilityKey[]` (single fetch, like `featureFlags`/`enabledAiModelIds`).
- `useIsCapabilityEnabled(key)` (mirror `useIsFeatureEnabled`) — pure client lookup.
- `useCapabilityCatalog()` — catalog + current enabled state for the Settings UI (catalog metadata delivered via clientConfig or a dedicated query).

## Relationship to the shape of existing systems

| Concern | Existing analog reused |
|---|---|
| Per-workspace boolean storage | `FeatureFlagEntity` shape (`(key, workspaceId)` unique) |
| Per-workspace "enabled list" on `currentWorkspace` | `workspace.enabledAiModelIds` precedent |
| Workspace cache map | `featureFlagsMap` (`@WorkspaceCache`) |
| Backend guard | `FeatureFlagGuard` / `@RequireFeatureFlag` |
| Frontend hook | `useIsFeatureEnabled` |
| Availability (commercial) | `BillingService.hasEntitlement` (consume) |
| Downstream effect (object-backed) | `ObjectMetadata.isActive` (existing propagation) |
| User authorization | roles / `useHasPermissionFlag` (unchanged) |

The model is intentionally a thin, catalog-driven coordinator over proven Twenty mechanisms — not a new framework.
