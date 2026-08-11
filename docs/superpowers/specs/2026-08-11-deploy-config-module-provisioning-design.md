# Deploy-Config Module Provisioning — Design

Date: 2026-08-11
Status: approved (brainstorming), pending spec review → implementation plan

## Problem

Twenty will be deployed per customer. The operator (vendor) wants to decide, per deployment, which optional product modules that customer has. The customer must not be able to enable, change, or view a module the deployment did not grant — the boundary must be server-side, not just UI hiding.

The existing capability layer (`docs/modular-crm`) is the wrong shape for this: it is a **per-workspace, in-app, customer-admin toggle** (a `WorkspaceCapabilityEntity` DB row flipped via the `updateWorkspaceCapability` mutation on a Settings → Features page). That lets the customer control their own modules. We need **per-deployment, operator-set, customer-immutable** control instead.

This is the **availability** axis that the capability design already anticipated (`availability.configFlag`) but never implemented. This spec implements it as the primary gate and demotes the per-workspace toggle to dormant.

## Decisions (from brainstorming)

- **Control model:** deploy-config only. The operator sets modules via environment variables at deploy time. No customer toggle.
- **Enforcement level:** config-gated + server guard. One image for all customers; the module code is present but the customer cannot reach it (guard denies the API, UI hides it). Not physically stripped from the build.
- **Object-backed exclusion strictness:** Level A. Guard denies the module's discrete endpoints + the UI (nav/routes/object-nav) hides it. Raw object CRUD via the generic dynamic resolver stays technically reachable (hand-crafted GraphQL only, no UI path) — accepted, since the deploy is operator-controlled and this is not a realistic customer attack vector. No `applicationId` schema exclusion, no per-customer builds.
- **Built customer-toggle UI:** converted to a **read-only "Your modules"** view (shows included/not-included from clientConfig). The `updateWorkspaceCapability` mutation is removed from the UI; it stays dormant server-side.
- **Reference through-stitch:** Dashboards (already guarded + object-backed) is implemented end-to-end first; the other modules follow the pattern.

## Architecture

Single source of truth = **deploy-config boolean flags**, not the per-workspace DB toggle.

### Config layer (backend)

- One boolean config variable per optional module in
  `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`, e.g.
  `IS_DASHBOARDS_MODULE_ENABLED`, decorated
  `@ConfigVariablesMetadata({ group, description, type: ConfigVariableType.BOOLEAN, isEnvOnly: true })`
  `@IsOptional()`, **default `true`**.
  - `isEnvOnly: true` (see `twenty-config/decorators/config-variables-metadata.decorator.ts`) makes the var settable only via environment, blocking admin-panel / DB overrides — the customer cannot change it.
  - Default `true` means an unconfigured deployment behaves exactly as today (zero behavior change).
- Read at runtime via `TwentyConfigService.get('IS_<MODULE>_ENABLED')`
  (`twenty-config/twenty-config.service.ts`). None of the config plumbing is `@license Enterprise`.

### Availability resolution + guard (backend)

- The catalog (`product-capability/constants/product-capability-catalog.constant.ts`) gains
  `availability.configFlag` per optional module (the `availability` field already exists in the shared
  `ProductCapabilityDefinition` type).
- A focused resolver `isCapabilityAvailable(key)`:
  `available = definition.availability.configFlag ? twentyConfigService.get(configFlag) : true`.
  This becomes the gate. It lives alongside the existing capability service (extends/replaces the DB-map
  gate). The per-workspace DB-map (`capabilitiesMap`) is no longer consulted for the gate.
- The existing `@RequireCapability(key)` guard (`engine/guards/capability.guard.ts`) is repointed to resolve
  through `isCapabilityAvailable` (config) instead of the DB toggle. Flag off → `ForbiddenException`.
  Mirror `google-provider-enabled.guard.ts` for reading config in a guard.
- `WorkspaceCapabilityEntity`, its instance-command table, `setEnabled`, and the `capabilitiesMap` cache
  remain in the tree but **dormant** (not the gate). No removal, no down-migration — avoids churn.

### Client exposure + hiding (frontend)

- Client exposure is manual (not a metadata flag): add a `@Field(() => Boolean)` per module to `ClientConfig`
  (`client-config.entity.ts`) populated from `twentyConfigService.get(...)` in `client-config.service.ts`;
  then hand-wire the field into the frontend `ClientConfig` type
  (`packages/twenty-front/src/modules/client-config/types/ClientConfig.ts`), a Recoil atom under
  `client-config/states/`, and the setter in `client-config/hooks/useClientConfig.ts` (mirror
  `isMultiWorkspaceEnabledState`). Transport is REST `GET /client-config`.
- `useIsCapabilityEnabled` (`modules/workspace/hooks/useIsCapabilityEnabled.ts`) is repointed to read the
  clientConfig availability flag for the capability instead of `currentWorkspace.enabledCapabilities`. One
  place; all consumers follow.
- Hiding when a module flag is off:
  - **Non-object modules** (Email/Calendar/Automations/AI): Settings routes hidden via
    `SettingsProtectedRouteWrapper`, nav items via `isHidden` in `useSettingsNavigationItems`, both using
    `useIsCapabilityEnabled`.
  - **Object-backed** (Dashboards, Level A): the object is filtered out of the object-nav by adding a
    config predicate to `useFilteredObjectMetadataItems` — an object whose module capability is
    config-disabled is excluded (independent of `isActive`, live, no provisioning coupling). The
    object→capability→configFlag mapping comes from the catalog on the frontend.
- Settings → Features becomes a **read-only "Your modules"** page: lists modules with an included /
  not-included status from clientConfig; no toggles, no mutation call. The customer sees what their plan
  includes and cannot change it. The `updateWorkspaceCapability` mutation is removed from the UI.

## Reference slice — Dashboards (end to end)

1. Config var `IS_DASHBOARDS_MODULE_ENABLED` (isEnvOnly, client-exposed, default true) + `.env.example` and
   `packages/twenty-docker/.env.example` entry.
2. Catalog `availability.configFlag` for DASHBOARDS.
3. `isCapabilityAvailable` + guard repoint (the DASHBOARDS endpoints — `duplicateDashboard`,
   `bar/line/pieChartData` — resolve against config).
4. clientConfig field (backend + frontend) + atom/hook + `useIsCapabilityEnabled` repointed.
5. Object-nav config predicate in `useFilteredObjectMetadataItems` (dashboard object hidden when flag off).
6. Settings → Features rebuilt read-only.

## Testing

- **Integration test** (mirror `test/integration/.../settings-permissions/workspace-capability.integration-spec.ts`):
  with `IS_DASHBOARDS_MODULE_ENABLED=false`, the guarded dashboard endpoints (duplicate, chart-data) return
  `FORBIDDEN`; with the flag true (default) they behave normally. If the harness can set config per test,
  assert both; otherwise assert the default-true path and add a targeted guard unit test that mocks
  `TwentyConfigService` returning false → guard denies.
- **Frontend unit tests:** `useIsCapabilityEnabled` returns false when the clientConfig flag is off;
  `useFilteredObjectMetadataItems` excludes the dashboard object when its module flag is off; the read-only
  "Your modules" page renders included/not-included from clientConfig.
- **Live smoke:** boot the backend with `IS_DASHBOARDS_MODULE_ENABLED=false`; verify a guarded endpoint
  returns 403, the dashboard object is absent from the nav list, and the rest of the app is unaffected;
  then default (true) restores it.

## Rollout (after Dashboards)

Email → Calendar → Automations → AI, each its own slice: add the config var, guard the module's discrete
resolvers/jobs, gate its Settings routes/nav via `useIsCapabilityEnabled`. No object predicate needed
(non-object).

## Docs

Update `docs/modular-crm` to record the deploy-config model: availability (deploy config) is the primary
gate; the per-workspace toggle (`WorkspaceCapabilityEntity` + mutation + Settings toggle) is dormant /
deprecated. Note the enforcement level (guard + UI-hide, Level A) and the accepted raw-CRUD limitation.

## Out of scope (YAGNI)

- `applicationId` schema exclusion / making Dashboards a separate app (Level C).
- Physically stripping module code from the build; per-customer build variants.
- Hardening raw object CRUD via the generic dynamic resolver against a disabled object-backed module.
- Removing the dormant `WorkspaceCapabilityEntity` / instance-command / mutation (left in place).

## Compatibility

All module flags default `true`. An unconfigured deployment (no env overrides) behaves exactly as today.
The operator sets a flag to `false` per customer to remove a module.
