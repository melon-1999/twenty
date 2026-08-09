# Modular CRM — Implementation Plan

Status: **PLAN / DECISION phase. No application source code changed yet** (the task gates implementation behind a documented, validated decision — §28/§30). This document is the decision to validate before any code.

Derived from a targeted investigation of Twenty's existing feature/pricing/app/permission systems (not a fresh repo scan). Evidence: [01-EXISTING-TWENTY-FEATURE-SYSTEMS.md](01-EXISTING-TWENTY-FEATURE-SYSTEMS.md) and [TWENTY-CURRENT-FEATURE-MATRIX.md](TWENTY-CURRENT-FEATURE-MATRIX.md).

---

## Existing Twenty systems (summary)

Twenty already has **five** relevant mechanisms. Full detail in [01](01-EXISTING-TWENTY-FEATURE-SYSTEMS.md); condensed here:

| System | Scope | Storage | Purpose | Non-destructive toggle? |
|--------|-------|---------|---------|--------------------------|
| **Feature flags** (`FeatureFlagKey`, `core.featureFlag`) | **per-workspace** boolean | DB row unique `(key, workspaceId)`, cached `featureFlagsMap` | experiments / rollout / a small "Lab" opt-in set (5 public flags) | yes (toggle) |
| **Billing entitlements** (`BillingEntitlementKey`, `core.billingEntitlement`) | **per-workspace** boolean, **commercial** | DB, Stripe-synced via webhook; 4 keys (SSO, CUSTOM_DOMAIN, RLS, AUDIT_LOGS) | commercial capability availability | via subscription |
| **Applications** (`ApplicationEntity`, `SyncableEntity.applicationId`) | **per-workspace** bundle | DB row per install; every object/field/view/nav/role belongs to one app | packaging + install/uninstall; **core CRM is the "Standard" app** | **no** — only destructive install/uninstall |
| **Permissions/roles** (`PermissionFlagType`, roles, object/field/row perms) | **per-user (role)** | DB; on `currentUserWorkspace` | who may do what | yes (per user) |
| **Object metadata activation** (`ObjectMetadata.isActive`) | **per-workspace**, object-granular | metadata; drives nav/quick-create/command-menu (UI only — object stays in the GraphQL schema) | show/hide a data object | **yes — data-preserving** |
| **Deployment config** (`twenty-config` `IS_*`, `clientConfig`) | **instance/deployment** | env / config store → clientConfig → ~37 Jotai atoms | cloud vs self-hosted, provider availability | n/a (global) |

**Key facts that drive the design:**
1. There is **no "product module / capability" concept** and **no per-workspace "enabled modules" store** today. The closest precedents are `FeatureFlagEntity` (per-workspace boolean, but experiment-semantics) and `workspace.enabledAiModelIds: string[]` (a real per-workspace enabled-list column).
2. **`ObjectMetadata.isActive` already gives data-preserving, per-workspace hiding** that propagates to navigation, quick-create and the command menu (via `useFilteredObjectMetadataItems`). Go/no-go RESOLVED: inactive objects are **not** excluded from the generated per-workspace GraphQL schema, so `isActive` provides **no backend enforcement** — object-backed capabilities need `@RequireCapability` on their resolvers/controllers/jobs, same as non-object capabilities. `isActive` remains the single most reusable lever for UI-hide + data preservation.
3. **Billing, enterprise, SSO, RLS, audit-logs code is `@license Enterprise` (commercial)**, not AGPL. Our capability layer must live in AGPL core and only *consume* `BillingService.hasEntitlement(...)` — it must **not modify** Enterprise files.
4. Command-menu/record actions are **metadata-driven** (`CommandMenuItem.conditionalAvailabilityExpression`, an `expr-eval-fork` expression) and the frontend filter pipelines are explicitly designed to accept additional `.filter()` predicates — a minimal-invasive extension point.

---

## Existing flow (availability → workspace → backend → frontend)

- **Availability (commercial/deployment):** Stripe entitlement webhook → `core.billingEntitlement` (or `IS_BILLING_ENABLED=false` ⇒ `hasEntitlement` returns true). Deployment `IS_*` config → `clientConfig` → frontend atoms.
- **Enabled (workspace):** today only feature flags (`core.featureFlag`) + object `isActive`. Reaches frontend via `currentWorkspace.featureFlags` and `objectMetadataItems`.
- **Backend:** `FeatureFlagGuard`/`@RequireFeatureFlag`; imperative `BillingService.hasEntitlement`; ORM permission checks; inactive objects remain present in the schema — no schema-level enforcement from `isActive`.
- **Frontend:** `useIsFeatureEnabled`, `useHasPermissionFlag`, clientConfig atoms; nav from `useFilteredObjectMetadataItems`; settings nav `useSettingsNavigationItems` (inline `isHidden`); routes `SettingsProtectedRouteWrapper`.

---

## Architecture decision (§29)

### Did Twenty already have a usable module/feature architecture?
**PARTIALLY.** It has two per-workspace boolean-capability systems (feature flags, billing entitlements) and a per-workspace, data-preserving object-hiding lever (`isActive`), plus an app-bundle boundary (`applicationId`). None of them is a *product-capability catalog* with human-meaningful modules, dependencies, and coordinated enable/disable across nav+routes+backend. So the foundation exists; the coordinating layer does not.

### What existing mechanism are we using as the foundation?
- **Downstream UI + data preservation for object-backed capabilities:** reuse **`ObjectMetadata.isActive`** (already propagates to nav/quick-create/command-menu; does **not** exclude inactive objects from the workspace GraphQL schema — go/no-go RESOLVED false). Data-preserving by construction; enforcement is a separate `@RequireCapability` guard, uniform with non-object capabilities.
- **Commercial availability:** reuse **`BillingService.hasEntitlement` + `BillingEntitlementKey`** and deployment `clientConfig` flags — **consumed, not modified** (Enterprise license).
- **User authorization:** reuse **roles + `PermissionFlagType`** unchanged.
- **Per-workspace enabled state storage:** follow the **`workspace.enabledAiModelIds`** precedent (a per-workspace list/table), not a new parallel framework.

### Are we creating a new capability layer?
**Yes — a small one (Option C + D hybrid).** A **Product Capability layer** that *consumes* the systems above. It is the only genuinely new abstraction. Existing systems are insufficient because: feature flags carry experiment/Lab semantics and no catalog/dependencies; billing entitlements are commercial-only, 4 fixed keys, Enterprise-licensed; applications have no non-destructive disable; object `isActive` is object-granular (not a human-meaningful "module") and has no dependency/availability model. The new layer supplies exactly the missing coordination: a **code-defined catalog** (source of truth) + a **per-workspace enabled store** + a **resolver** that expands a capability into its existing downstream effects (activate/deactivate objects, gate routes/nav/backend for non-object capabilities).

### Are pricing plans and modules using the same capability definitions?
**No — deliberately separated, but linked by key.** A capability's *availability* can optionally reference a `BillingEntitlementKey` (or be always-available). Its *enabled* state is a separate per-workspace toggle. The catalog maps capability → optional entitlement, so future plans map cleanly without the module system depending on billing. (§6)

### Are permissions separate?
**Yes.** Capabilities answer "is this workspace using module X"; permissions answer "may this user use X". Both must pass. We do not move any authorization into the capability layer. (§7)

### Are apps separate?
**Yes, but related.** Third-party installed **Applications** remain a distinct concept (install/uninstall lifecycle). Core product capabilities are NOT modeled as installable apps (apps lack non-destructive disable and uninstall is destructive). However, because core CRM objects already belong to the "Standard" application, an object-backed capability is implemented by toggling `isActive` on that app's objects — we reuse the app-owned metadata without using the app install/uninstall lifecycle. An installed app MAY, later, declare capabilities it provides. (§9)

---

## Proposed architecture

```
Deployment config (clientConfig IS_*)  ─┐
Commercial entitlement (BillingEntitlementKey / hasEntitlement) ─┤→  AVAILABILITY  (may the workspace use it?)
                                         │
Product Capability Catalog (code, source of truth: key, name, category,
   default, dependencies, availability ref, downstream effects)      │
Workspace Capability store (per-workspace enabled set)  ────────────→  ENABLED   (is it turned on for this workspace?)
                                         │
Roles / PermissionFlagType (per user)  ─────────────────────────────→  AUTHORIZED (may this user access it?)
                                         ▼
     Capability Resolver  →  effects: object isActive · route guard · nav filter · backend guard
```

**Three independent questions, three existing-or-new sources:** availability (existing billing+config), enabled (new thin store+catalog), authorized (existing roles). A feature is usable only when all three pass.

## Capability model

- **`ProductCapabilityKey`** (new enum, twenty-shared) — human-meaningful modules (see [12-MODULE-CATALOG.md](12-MODULE-CATALOG.md)).
- **Catalog** (code constant, backend): per capability `{ key, name, description, category, isCore (never disable), defaultEnabled, dependsOn[], availability: { entitlementKey?, configFlag? }, effect: { objectStandardIds[]?, gatesRoutes[]?, navKeys[]? } }`. Single source of truth (§13).
- **Per-workspace enabled state:** a `WorkspaceCapabilityEntity` (`core.workspaceCapability`, unique `(key, workspaceId)`, `isEnabled boolean`) — same shape/patterns as `FeatureFlagEntity`, but semantically the product-capability layer. (Alternative considered: a `enabledCapabilities: string[]` column mirroring `enabledAiModelIds` — see Alternatives.)
- **Resolution + cache:** a `capabilitiesMap` in the workspace cache (mirrors `featureFlagsMap`); exposed on `currentWorkspace.enabledCapabilities` for the frontend (one fetch). A `WorkspaceCapabilityService.isCapabilityEnabled(workspaceId, key)` with availability+enabled resolution.

## Plan relationship
Availability of a capability = `(no entitlementKey) OR hasEntitlement(entitlementKey) OR !isBillingEnabled` AND `(no configFlag) OR clientConfig[configFlag]`. Enabled = availability AND workspace toggle. Plans (PRO/ENTERPRISE) already map to entitlements via Stripe; new plans add entitlement keys, no capability-layer rewrite. Most SMB capabilities will have **no** entitlement (freely available); commercial gating is opt-in per capability. (§21)

## Workspace configuration
`WorkspaceCapabilityService.setEnabled(workspaceId, key, enabled)` — validates availability + dependencies, applies effects (toggle object `isActive`, invalidate cache), never deletes data. Admin UI in Settings (§20, [13-SETTINGS-UX.md](13-SETTINGS-UX.md)). Safe defaults: on migration, every currently-active capability is enabled (compatibility baseline, §32).

## Permissions
Unchanged. Capability enabled + object read permission both required; the resolver never grants user access. (§7, [11-PERMISSIONS.md](11-PERMISSIONS.md))

## Apps
Installed applications stay separate; capability layer can consume app-provided objects. No core capability becomes an installable app. (§9, [07-APPS-AND-MODULES.md](07-APPS-AND-MODULES.md))

## Dependencies
Declared in the catalog; resolver blocks enabling without deps (auto-enable required dep with confirmation) and blocks disabling a depended-on capability (or offers cascade-disable with confirmation). Real deps derived from code in [10-DEPENDENCIES.md](10-DEPENDENCIES.md).

## Frontend integration
Object-backed capabilities need **no new nav/route code** — `isActive` already hides them. Non-object capabilities (Email/Calendar/Automations/AI/Reports settings + routes) add one predicate to the existing pipelines: a `useIsCapabilityEnabled(key)` hook (mirrors `useIsFeatureEnabled`), used in `useSettingsNavigationItems` inline `isHidden`, `SettingsProtectedRouteWrapper` (new optional `requiredCapability` prop), and — where needed — a new `.filter()` in the command-menu pipeline / a `conditionalAvailabilityExpression` term. (§16-17, [08](08-FRONTEND-INTEGRATION.md))

## Backend enforcement
Object-backed and non-object capabilities both enforce the same way: a `@RequireCapability(key)` guard (mirrors `FeatureFlagGuard`) on the relevant resolvers/controllers/jobs, resolving via the cached `capabilitiesMap`. (Go/no-go RESOLVED: `isActive` does not remove an inactive object from the workspace GraphQL schema, so it is not an enforcement mechanism — only UI-hide + data preservation.) (§18, [09](09-BACKEND-ENFORCEMENT.md))

## Migration
One instance/workspace command seeds `WorkspaceCapability` rows for existing workspaces from current object `isActive` state (all currently-usable capabilities enabled) → preserves behavior. (§15, [15](15-MIGRATION-STRATEGY.md))

## Data preservation
Disabling never deletes: object rows persist under `isActive=false`; workflow/message data untouched; re-enable restores visibility. (§24, [14](14-DATA-PRESERVATION.md))

## Upgrade strategy (upstream compatibility)
Additive: new enum (shared), new entity + service + guard (server), new hook + settings section (front), plus **small edits** to a handful of existing files (workspace cache key list, `currentWorkspace` fragment, settings-nav hook, `SettingsProtectedRouteWrapper`, one nav filter). No Enterprise files touched. Tracked in [17](17-UPSTREAM-UPGRADE-STRATEGY.md).

## Risks
- Object `isActive` schema-exclusion assumption — **RESOLVED = false**, decision = guard-only. Go/no-go confirmed inactive objects are **not** excluded from the workspace GraphQL schema; re-activation *is* lossless (true), but that no longer matters for enforcement since enforcement was never actually resting on schema exclusion. Object-backed capabilities use `@RequireCapability`, uniform with non-object capabilities; `isActive` is retained only for UI-hide + data preservation. (See Risks in [02-ARCHITECTURE.md](02-ARCHITECTURE.md).)
- Capability↔entitlement asymmetry (backend `hasEntitlement` vs frontend list) already exists in Twenty; document, don't inherit bugs.
- Over-coupling to Enterprise billing — mitigated by consume-only.
- Metadata-version churn when toggling object `isActive` (regenerates schema/cache) — acceptable but note performance; still valid for the UI/data toggle.

## Alternatives considered
- **A) Extend billing entitlements** — rejected: Enterprise-licensed, commercial-only, 4 fixed keys, ties modules to pricing.
- **B) Extend applications (install/uninstall)** — rejected as primary: no non-destructive disable, uninstall is destructive (deletes data), heavy for a toggle. (Reused indirectly via app-owned object `isActive`.)
- **Repurpose feature flags** — rejected: experiment/Lab semantics, no catalog/deps/availability; would conflate temporary and permanent. (Pattern reused for storage shape only.)
- **`enabledCapabilities: string[]` column on workspace (mirror `enabledAiModelIds`)** — viable and simplest; chosen `WorkspaceCapabilityEntity` instead for per-capability rows (audit, partial availability, future per-capability metadata) — decision revisited in [05](05-WORKSPACE-CONFIGURATION.md).

## Differences from the prompt's examples (§28 required)
See [02-ARCHITECTURE.md](02-ARCHITECTURE.md) §"Differences from prompt examples". Headlines: we do **not** create a generic `enabledModules: string[]` as the primary store; we do **not** build a standalone module registry disconnected from metadata (we reuse `isActive`); we do **not** make modules pricing-dependent; the illustrative module list (Leads/Products) is trimmed because **Leads and Products do not exist as objects in Twenty today** — they are future capabilities, not migratable now.

---

## Implementation sequence (after this plan is validated — §30/§31)
1. Foundation (shared enum + catalog + entity + service + cache + guard + `currentWorkspace` field + hook). No behavior change (all default enabled).
2. Migrate ONE low-risk object-backed capability first — candidate: **Dashboards** or **Notes** (real, isolated, object-backed) rather than the prompt's Products/Leads (which don't exist). Verify the full checklist ([16](16-TESTING.md)).
3. Settings UI.
4. Migrate non-object capabilities (Email, Calendar, Automations, AI) one at a time.

Progress tracked in [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md).
