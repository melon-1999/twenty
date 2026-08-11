# Deploy-Config Module Provisioning — Implementation Plan (Dashboards reference slice)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the Dashboards module by a deploy-time, operator-set, customer-immutable config flag (`IS_DASHBOARDS_MODULE_ENABLED`), enforced server-side by the existing `@RequireCapability` guard and hidden client-side via clientConfig — as the reference through-stitch for the other modules.

**Architecture:** A per-module boolean config var (`isEnvOnly`, default `true`) is the single source of truth. The backend `@RequireCapability(DASHBOARDS)` guard resolves availability from config (not the per-workspace DB toggle, which becomes dormant). The flag is surfaced via clientConfig so the frontend hides the module's nav/routes/object-nav. Settings → Features becomes a read-only "Your modules" view.

**Tech Stack:** NestJS + TypeORM (twenty-server), React + Recoil/Jotai (twenty-front), Twenty config system (`twenty-config`), clientConfig REST (`GET /client-config`), Jest.

## Global Constraints

- Named exports only; no default exports. Types over interfaces. No `any`. `//` comments only, WHY not WHAT. Lingui for user-facing strings. kebab-case files.
- Do NOT modify any `/* @license Enterprise */` file. (The config/clientConfig plumbing is all AGPL — safe.)
- `IS_DASHBOARDS_MODULE_ENABLED` default is `true` → an unconfigured deployment behaves exactly as today. Every new module flag defaults `true`.
- `isEnvOnly: true` on the config var (operator-set only; no admin-panel/DB override).
- Do NOT remove the dormant `WorkspaceCapabilityEntity`, its instance command, or the `updateWorkspaceCapability` mutation — leave them in place, just no longer the gate.
- Spec: `docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md`. Recon: `scratchpad/config-mechanism-map.md` (config→clientConfig mechanism, file:line).
- Commit after each task. No signatures/co-author tags in commits.

---

### Task 1: Add the `IS_DASHBOARDS_MODULE_ENABLED` config variable

**Files:**
- Modify: `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`
- Modify: `packages/twenty-server/.env.example`
- Modify: `packages/twenty-docker/.env.example`

**Interfaces:**
- Produces: config var `IS_DASHBOARDS_MODULE_ENABLED: boolean` (default `true`), readable via `twentyConfigService.get('IS_DASHBOARDS_MODULE_ENABLED')`.

- [ ] **Step 1: Add the config var.** In `config-variables.ts`, add a new property mirroring the existing `WORKSPACE_SCHEMA_DDL_LOCKED` boolean/`isEnvOnly` shape (around line 105-113). Choose a fitting `ConfigVariablesGroup` (e.g. a new/existing feature group; use the same group as other deployment feature toggles). Default `true`:

```ts
  @ConfigVariablesMetadata({
    group: ConfigVariablesGroup.SERVER_CONFIG,
    description:
      'Enable the Dashboards module for this deployment. When false, the Dashboards feature is unavailable and hidden for all workspaces on this instance.',
    isEnvOnly: true,
    type: ConfigVariableType.BOOLEAN,
  })
  @IsOptional()
  IS_DASHBOARDS_MODULE_ENABLED = true;
```
(Use the actual `ConfigVariablesGroup` member that matches sibling deployment toggles — read the enum and pick the closest; do not invent one.)

- [ ] **Step 2: Document the env var.** Add to both `.env.example` files, near other `IS_*` flags:

```
# Enable/disable optional modules for this deployment (operator-only)
IS_DASHBOARDS_MODULE_ENABLED=true
```

- [ ] **Step 3: Typecheck.** Run: `npx nx typecheck twenty-server` — Expected: PASS.

- [ ] **Step 4: Commit.**
```bash
git add packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts packages/twenty-server/.env.example packages/twenty-docker/.env.example
git commit -m "feat(server): add IS_DASHBOARDS_MODULE_ENABLED deploy config var"
```

---

### Task 2: Catalog `configFlag` + `isCapabilityAvailable` resolution

**Files:**
- Modify: `packages/twenty-server/src/engine/core-modules/product-capability/constants/product-capability-catalog.constant.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/product-capability/services/workspace-capability.service.ts`
- Test: `packages/twenty-server/src/engine/core-modules/product-capability/services/__tests__/workspace-capability.service.spec.ts`

**Interfaces:**
- Consumes: `TwentyConfigService.get(key)` (`twenty-config/twenty-config.service.ts`).
- Produces: `WorkspaceCapabilityService.isCapabilityAvailable(key: ProductCapabilityKey): boolean` — `true` when the catalog entry has no `availability.configFlag`; otherwise `Boolean(twentyConfigService.get(configFlag))`.

- [ ] **Step 1: Set the catalog flag.** In the catalog, change the DASHBOARDS entry `availability: {}` to:
```ts
    availability: { configFlag: 'IS_DASHBOARDS_MODULE_ENABLED' },
```
(The shared `ProductCapabilityDefinition.availability.configFlag?: string` field already exists.)

- [ ] **Step 2: Write the failing test.** Add to the service spec:
```ts
describe('isCapabilityAvailable', () => {
  it('returns true for a capability with no configFlag', () => {
    // CONTACTS has availability: {}
    expect(service.isCapabilityAvailable(ProductCapabilityKey.CONTACTS)).toBe(true);
  });

  it('returns the config value for a capability with a configFlag', () => {
    twentyConfigService.get.mockReturnValue(false);
    expect(service.isCapabilityAvailable(ProductCapabilityKey.DASHBOARDS)).toBe(false);
    expect(twentyConfigService.get).toHaveBeenCalledWith('IS_DASHBOARDS_MODULE_ENABLED');

    twentyConfigService.get.mockReturnValue(true);
    expect(service.isCapabilityAvailable(ProductCapabilityKey.DASHBOARDS)).toBe(true);
  });
});
```
Add a mocked `TwentyConfigService` (`{ get: jest.fn() }`) to the testing module providers (token `TwentyConfigService`).

- [ ] **Step 2b: Run it — expect FAIL** (`isCapabilityAvailable is not a function`). Run: `cd packages/twenty-server && npx jest "workspace-capability.service"`.

- [ ] **Step 3: Implement.** Inject `TwentyConfigService` into `WorkspaceCapabilityService` (import from `twenty-config/twenty-config.service`; add `TwentyConfigModule` to `product-capability.module.ts` imports if not transitively available — check and add). Add:
```ts
  isCapabilityAvailable(key: ProductCapabilityKey): boolean {
    const configFlag = PRODUCT_CAPABILITY_CATALOG[key].availability.configFlag;

    if (!isDefined(configFlag)) {
      return true;
    }

    return Boolean(
      this.twentyConfigService.get(configFlag as keyof ConfigVariables),
    );
  }
```
(Import `ConfigVariables` type for the cast. Do NOT use `any`.)

- [ ] **Step 4: Run tests — expect PASS.** Run: `cd packages/twenty-server && npx jest "workspace-capability.service"`.

- [ ] **Step 5: Typecheck.** Run: `npx nx typecheck twenty-server` — Expected: PASS.

- [ ] **Step 6: Commit.**
```bash
git add packages/twenty-server/src/engine/core-modules/product-capability
git commit -m "feat(server): resolve Dashboards capability availability from deploy config"
```

---

### Task 3: Repoint `CapabilityGuard` to availability (config)

**Files:**
- Modify: `packages/twenty-server/src/engine/guards/capability.guard.ts`
- Test: `packages/twenty-server/src/engine/guards/__tests__/capability.guard.spec.ts`

**Interfaces:**
- Consumes: `WorkspaceCapabilityService.isCapabilityAvailable(key)`.

- [ ] **Step 1: Update the failing tests.** In the guard spec, change the enabled/disabled cases to drive `isCapabilityAvailable` instead of `isCapabilityEnabled`:
```ts
it('returns true when the capability is available', () => {
  reflector.get.mockReturnValue(ProductCapabilityKey.DASHBOARDS);
  workspaceCapabilityService.isCapabilityAvailable.mockReturnValue(true);
  expect(guard.canActivate(context)).toBe(true);
});

it('throws ForbiddenException when the capability is not available', () => {
  reflector.get.mockReturnValue(ProductCapabilityKey.DASHBOARDS);
  workspaceCapabilityService.isCapabilityAvailable.mockReturnValue(false);
  expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
});
```
Keep the "no metadata → true (pass-through)" test. The no-workspace test is no longer meaningful for a deployment-scoped gate — replace it with a test that pass-through still holds without workspace context (availability does not depend on workspace).

- [ ] **Step 1b: Run — expect FAIL.** Run: `cd packages/twenty-server && npx jest "capability.guard"`.

- [ ] **Step 2: Implement.** In `capability.guard.ts` `canActivate`: after reading the capability metadata (`reflector.get(CAPABILITY_KEY, context.getHandler())`; no metadata → `return true`), replace the workspace-toggle resolution with:
```ts
    if (!this.workspaceCapabilityService.isCapabilityAvailable(capability)) {
      throw new ForbiddenException(
        `Module "${capability}" is not available on this deployment`,
      );
    }

    return true;
```
`isCapabilityAvailable` is synchronous, so `canActivate` can drop `async`/`await` on this path if nothing else awaits (check; keep signature returning `boolean | Promise<boolean>` if the base requires). Remove the now-unused `req.workspace?.id` read only if nothing else uses it.

- [ ] **Step 3: Run tests — expect PASS.** Run: `cd packages/twenty-server && npx jest "capability.guard"`.

- [ ] **Step 4: Typecheck.** Run: `npx nx typecheck twenty-server` — Expected: PASS.

- [ ] **Step 5: Commit.**
```bash
git add packages/twenty-server/src/engine/guards
git commit -m "feat(server): gate @RequireCapability on deployment availability"
```

---

### Task 4: Expose the flag on clientConfig (backend)

**Files:**
- Modify: the clientConfig entity/DTO (`packages/twenty-server/src/engine/core-modules/client-config/*client-config*.entity.ts` — find via `scratchpad/config-mechanism-map.md` §3)
- Modify: the clientConfig service that populates it (`client-config.service.ts`)

**Interfaces:**
- Produces: `ClientConfig.isDashboardsModuleEnabled: boolean` over `GET /client-config`.

- [ ] **Step 1: Add the field.** In the ClientConfig entity/`@ObjectType`, add mirroring an existing boolean flag (e.g. `isMultiWorkspaceEnabled`):
```ts
  @Field(() => Boolean)
  isDashboardsModuleEnabled: boolean;
```

- [ ] **Step 2: Populate it.** In `client-config.service.ts`, where the config is assembled, set:
```ts
      isDashboardsModuleEnabled: this.twentyConfigService.get(
        'IS_DASHBOARDS_MODULE_ENABLED',
      ),
```
(Mirror the exact assembly pattern used for a sibling flag in that file.)

- [ ] **Step 3: Typecheck.** Run: `npx nx typecheck twenty-server` — Expected: PASS.

- [ ] **Step 4: Commit.**
```bash
git add packages/twenty-server/src/engine/core-modules/client-config
git commit -m "feat(server): surface IS_DASHBOARDS_MODULE_ENABLED on clientConfig"
```

---

### Task 5: Wire the flag into frontend clientConfig

**Files:**
- Modify: `packages/twenty-front/src/modules/client-config/types/ClientConfig.ts`
- Create: `packages/twenty-front/src/modules/client-config/states/isDashboardsModuleEnabledState.ts`
- Modify: `packages/twenty-front/src/modules/client-config/hooks/useClientConfig.ts`

**Interfaces:**
- Produces: Recoil atom `isDashboardsModuleEnabledState` (boolean), set from the fetched clientConfig.

- [ ] **Step 1: Add to the type.** In `ClientConfig.ts` add `isDashboardsModuleEnabled: boolean;` (mirror `isMultiWorkspaceEnabled`).

- [ ] **Step 2: Create the atom.** Mirror `isMultiWorkspaceEnabledState.ts` exactly (same `createState`/`atom` helper, name `isDashboardsModuleEnabledState`, default `true`).

- [ ] **Step 3: Set it on fetch.** In `useClientConfig.ts`, where sibling flags are set from the response, add `setIsDashboardsModuleEnabled(data.isDashboardsModuleEnabled)` and its `useSetRecoilState(isDashboardsModuleEnabledState)` (mirror the exact setter pattern; update any dependency array).

- [ ] **Step 4: Typecheck.** Run: `npx nx typecheck twenty-front` — Expected: PASS.

- [ ] **Step 5: Commit.**
```bash
git add packages/twenty-front/src/modules/client-config
git commit -m "feat(front): read isDashboardsModuleEnabled from clientConfig"
```

---

### Task 6: Repoint `useIsCapabilityEnabled` to clientConfig availability

**Files:**
- Create: `packages/twenty-front/src/modules/workspace/constants/productCapabilityAvailabilityAtoms.ts`
- Modify: `packages/twenty-front/src/modules/workspace/hooks/useIsCapabilityEnabled.ts`
- Modify: `packages/twenty-front/src/modules/workspace/utils/checkIfCapabilityIsEnabledOnWorkspace.ts` (if it becomes unused, note it; otherwise leave)
- Test: `packages/twenty-front/src/modules/workspace/hooks/__tests__/useIsCapabilityEnabled.test.ts` (create if none)

**Interfaces:**
- Produces: `useIsCapabilityEnabled(key)` returns the deployment availability for the capability (from clientConfig); capabilities with no config flag return `true`.

- [ ] **Step 1: Availability map.** Create `productCapabilityAvailabilityAtoms.ts`:
```ts
import { type RecoilValueReadOnly } from 'recoil';
import { isDashboardsModuleEnabledState } from '@/client-config/states/isDashboardsModuleEnabledState';
import { ProductCapabilityKey } from '~/generated-metadata/graphql';

// Maps a capability to the clientConfig availability atom that gates it.
// Capabilities absent from this map are always available (no deploy flag).
export const PRODUCT_CAPABILITY_AVAILABILITY_ATOM: Partial<
  Record<ProductCapabilityKey, RecoilValueReadOnly<boolean>>
> = {
  [ProductCapabilityKey.DASHBOARDS]: isDashboardsModuleEnabledState,
};
```

- [ ] **Step 2: Write the failing test.** Test that `useIsCapabilityEnabled(DASHBOARDS)` is `false` when `isDashboardsModuleEnabledState` is `false`, `true` when `true`, and that a capability with no atom (e.g. CONTACTS) returns `true`, and `null` returns `false`. Use a Recoil test wrapper setting the atom (mirror an existing Recoil hook test).

- [ ] **Step 2b: Run — expect FAIL.** Run: `cd packages/twenty-front && npx jest "useIsCapabilityEnabled"`.

- [ ] **Step 3: Implement.** Replace `useIsCapabilityEnabled.ts` body:
```ts
import { useRecoilValue } from 'recoil';
import { PRODUCT_CAPABILITY_AVAILABILITY_ATOM } from '@/workspace/constants/productCapabilityAvailabilityAtoms';
import { isDefined } from 'twenty-shared/utils';
import { type ProductCapabilityKey } from '~/generated-metadata/graphql';

export const useIsCapabilityEnabled = (
  capabilityKey: ProductCapabilityKey | null,
): boolean => {
  const availabilityAtom = isDefined(capabilityKey)
    ? PRODUCT_CAPABILITY_AVAILABILITY_ATOM[capabilityKey]
    : undefined;

  // A capability with no deploy flag is always available; a null key is not.
  const isAvailable = useRecoilValue(
    availabilityAtom ?? alwaysAvailableSelector,
  );

  if (!isDefined(capabilityKey)) {
    return false;
  }

  return isAvailable;
};
```
Because hooks cannot be called conditionally, resolve the atom to a constant selector when absent. Add a module-level `const alwaysAvailableSelector = selector({ key: 'alwaysAvailableCapability', get: () => true });` (import `selector` from recoil), or if the codebase has an existing constant-true atom, reuse it. Keep it a single stable selector instance (module scope), never created in render.

- [ ] **Step 4: Run tests — expect PASS.** Run: `cd packages/twenty-front && npx jest "useIsCapabilityEnabled"`.

- [ ] **Step 5: Typecheck.** Run: `npx nx typecheck twenty-front` — Expected: PASS.

- [ ] **Step 6: Commit.**
```bash
git add packages/twenty-front/src/modules/workspace
git commit -m "feat(front): resolve capability availability from clientConfig deploy flags"
```

---

### Task 7: Hide the object from object-nav when its module flag is off

**Files:**
- Create: `packages/twenty-front/src/modules/object-metadata/constants/objectNameToCapabilityKey.ts`
- Modify: `packages/twenty-front/src/modules/object-metadata/hooks/useFilteredObjectMetadataItems.ts`
- Test: `packages/twenty-front/src/modules/object-metadata/hooks/__tests__/useFilteredObjectMetadataItems.test.tsx` (extend or create)

**Interfaces:**
- Consumes: `useIsCapabilityEnabled`, and a mapping object `nameSingular → ProductCapabilityKey`.

- [ ] **Step 1: Mapping.** Create `objectNameToCapabilityKey.ts`:
```ts
import { ProductCapabilityKey } from '~/generated-metadata/graphql';

// Object-backed capabilities: an object hidden from nav when its module is
// unavailable on this deployment.
export const OBJECT_NAME_TO_CAPABILITY_KEY: Record<string, ProductCapabilityKey> = {
  dashboard: ProductCapabilityKey.DASHBOARDS,
};
```

- [ ] **Step 2: Write the failing test.** Render `useFilteredObjectMetadataItems` with a `dashboard` object present and `isActive: true`; with `isDashboardsModuleEnabledState=false`, assert the returned active lists EXCLUDE the `dashboard` object; with it `true`, assert it is INCLUDED. Mirror the existing filtered-items test harness (Recoil + object-metadata state seeding).

- [ ] **Step 2b: Run — expect FAIL.** Run: `cd packages/twenty-front && npx jest "useFilteredObjectMetadataItems"`.

- [ ] **Step 3: Implement.** In `useFilteredObjectMetadataItems.ts`, compute a set of unavailable object names and filter them out of the active lists. Because `useIsCapabilityEnabled` is a hook, evaluate each mapped capability once at the top:
```ts
// Object-backed capabilities disabled by deploy config are hidden from nav.
const isDashboardsAvailable = useIsCapabilityEnabled(ProductCapabilityKey.DASHBOARDS);

const unavailableObjectNames = useMemo(() => {
  const names = new Set<string>();
  if (!isDashboardsAvailable) {
    names.add('dashboard');
  }
  return names;
}, [isDashboardsAvailable]);
```
Then add `&& !unavailableObjectNames.has(nameSingular)` (destructure `nameSingular`) to the `activeNonSystemObjectMetadataItems` and `activeObjectMetadataItems` filters, threading `unavailableObjectNames` into their `useMemo` deps. (Keep it explicit per capability for now — the reference slice only wires Dashboards; the generic loop over `OBJECT_NAME_TO_CAPABILITY_KEY` can come when a second object-backed module is added. Use `OBJECT_NAME_TO_CAPABILITY_KEY` to document intent even if only Dashboards is looped today.)

- [ ] **Step 4: Run tests — expect PASS.** Run: `cd packages/twenty-front && npx jest "useFilteredObjectMetadataItems"`.

- [ ] **Step 5: Typecheck.** Run: `npx nx typecheck twenty-front` — Expected: PASS.

- [ ] **Step 6: Commit.**
```bash
git add packages/twenty-front/src/modules/object-metadata
git commit -m "feat(front): hide object-backed module from nav when deploy-disabled"
```

---

### Task 8: Rebuild Settings → Features as read-only "Your modules"

**Files:**
- Modify: `packages/twenty-front/src/modules/settings/product-capability/components/SettingsFeaturesContent.tsx`
- Modify/Delete: `packages/twenty-front/src/modules/settings/product-capability/components/SettingsProductCapabilityToggleRow.tsx` (replace toggle with a read-only status row) and its test
- Leave dormant: `useUpdateWorkspaceCapability.ts` (no longer imported by the UI)
- Test: update `SettingsProductCapabilityToggleRow.test.tsx` (or a new `SettingsFeaturesContent.test.tsx`)

**Interfaces:**
- Consumes: `useIsCapabilityEnabled` (availability), the FE display catalog.

- [ ] **Step 1: Write the failing test.** Assert the page renders each optional module with an "included"/"not included" status derived from `useIsCapabilityEnabled`, and that NO toggle/switch is rendered and `useUpdateWorkspaceCapability` is not called. (Mock `useIsCapabilityEnabled`; assert a status label, e.g. via `t\`Included\`` / `t\`Not included\``, and `queryByRole('switch')` is null.)

- [ ] **Step 1b: Run — expect FAIL.**

- [ ] **Step 2: Implement.** Replace the toggle row with a read-only status row (module label + description + an "Included/Not included" chip/text from `useIsCapabilityEnabled(capability.key)`). Remove the `useUpdateWorkspaceCapability` import and the `onChange` wiring from the row. Update the section copy ("Your modules" / "Modules included in your plan" — Lingui). Keep the core-features section (always included).

- [ ] **Step 3: Run tests — expect PASS.**

- [ ] **Step 4: Typecheck + lint.** Run: `npx nx typecheck twenty-front` and `npx nx lint:diff-with-main twenty-front` — Expected: PASS.

- [ ] **Step 5: Commit.**
```bash
git add packages/twenty-front/src/modules/settings/product-capability
git commit -m "feat(front): make Settings > Features a read-only modules view"
```

---

### Task 9: Integration test + live smoke

**Files:**
- Create: `packages/twenty-server/test/integration/graphql/suites/settings-permissions/capability-availability.integration-spec.ts`

- [ ] **Step 1: Guard unit coverage (fast).** Confirm Task 3's guard spec already asserts config-false → `ForbiddenException`. If the integration harness cannot vary config per test, this unit coverage is the authoritative guard proof — note it in the spec file.

- [ ] **Step 2: Integration test (default path).** Mirror `workspace-capability.integration-spec.ts`. With the default deployment (`IS_DASHBOARDS_MODULE_ENABLED` unset → true), assert the guarded dashboard endpoints (`duplicateDashboard`, `barChartData`) succeed/behave normally (i.e. are NOT forbidden by availability). This locks that the repointed guard does not regress the enabled path.

- [ ] **Step 3: Run.** Run: `npx nx run twenty-server:test:integration:with-db-reset` (or the single-suite integration command). Expected: PASS. If the harness supports overriding the config var to false in a test, add an assertion that the endpoints then return `FORBIDDEN`; otherwise rely on Task 3's unit test and note it.

- [ ] **Step 4: Live smoke.** Start the backend with the flag off:
```bash
IS_DASHBOARDS_MODULE_ENABLED=false npx nx start twenty-server
```
Verify (authenticated or via the guard on a discrete endpoint) that a guarded dashboard resolver returns a Forbidden/`403`-style error, and that with the flag default/true it works. Stop the server. Document the result. (Do not wipe the dev DB.)

- [ ] **Step 5: Commit.**
```bash
git add packages/twenty-server/test/integration/graphql/suites/settings-permissions/capability-availability.integration-spec.ts
git commit -m "test(server): deployment-availability gate for Dashboards endpoints"
```

---

### Task 10: Update `docs/modular-crm` to the deploy-config model

**Files:**
- Modify: `docs/modular-crm/IMPLEMENTATION-STATUS.md`, `docs/modular-crm/04-PLANS-AND-ENTITLEMENTS.md` (availability section), `docs/modular-crm/05-WORKSPACE-CONFIGURATION.md`, `docs/modular-crm/09-BACKEND-ENFORCEMENT.md`, `README.md` — the sections describing the per-workspace toggle as the primary control.

- [ ] **Step 1: Record the pivot.** Add a short section (and adjust the affected docs) stating: availability via deploy-time `isEnvOnly` config flags (`IS_<MODULE>_MODULE_ENABLED`) is the PRIMARY, operator-set, customer-immutable gate; `@RequireCapability` resolves against it; the per-workspace `WorkspaceCapabilityEntity` + mutation + Settings toggle are DORMANT/deprecated. Note enforcement Level A (guard + UI-hide; raw generic-resolver CRUD accepted). Reference the spec.

- [ ] **Step 2: Commit.**
```bash
git add docs/modular-crm
git commit -m "docs(modular-crm): record deploy-config availability model"
```

---

## Self-Review

- **Spec coverage:** config var (T1), catalog+availability resolution (T2), guard repoint (T3), clientConfig backend (T4) + frontend (T5), useIsCapabilityEnabled repoint (T6), object-nav hiding (T7), read-only Settings (T8), tests+smoke (T9), docs (T10). All spec sections covered.
- **Placeholder scan:** each task carries concrete file paths, code, commands. Mechanical clientConfig wiring (T4/T5) points to the exact mirror flag (`isMultiWorkspaceEnabled`) and the recon map for file:line — the implementer clones a real, named pattern.
- **Type consistency:** `isCapabilityAvailable(key): boolean` (T2) is consumed by T3 (guard) and mirrored FE-side by `useIsCapabilityEnabled` (T6) reading `isDashboardsModuleEnabledState` (T5) sourced from `ClientConfig.isDashboardsModuleEnabled` (T4). Config key string `IS_DASHBOARDS_MODULE_ENABLED` consistent across T1/T2/T4.
- **Rollout note:** Email/Calendar/Automations/AI repeat T1+T2(catalog flag)+T3(already generic)+T4/T5(clientConfig)+T6(add atom to availability map)+route/nav gate; no object predicate (non-object). Each its own plan/slice after this reference slice lands.
