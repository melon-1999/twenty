# Deploy-Config Module Provisioning — Email slice

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Gate the connected-inbox **Email** module behind a deploy-time, operator-set, customer-immutable config flag (`IS_EMAIL_MODULE_ENABLED`), reusing the generic availability guard + clientConfig plumbing landed in the Dashboards slice.

**Architecture:** Email is non-object. The generic `WorkspaceCapabilityService.isCapabilityAvailable` + `CapabilityGuard` already resolve any capability that has `availability.configFlag`; this slice only adds the EMAIL flag, guards the email-pure resolvers, surfaces the flag on clientConfig, and hides the email Settings nav item / route / timeline widget. Shared email+calendar plumbing (Accounts section, IMAP/CalDAV connect, OAuth, ChannelSync, ConnectedAccount) is intentionally left reachable so EMAIL-off does not break Calendar — the accepted Level A limitation (same class as raw-CRUD for Dashboards).

**Tech Stack:** NestJS + TypeORM (twenty-server), React + Jotai (twenty-front), twenty-config, clientConfig REST, Jest.

## Global Constraints

- Named exports only; Types over interfaces; No `any`; `//` comments only (WHY not WHAT); Lingui for user-facing strings; kebab-case files.
- Do NOT modify any `/* @license Enterprise */` file.
- `IS_EMAIL_MODULE_ENABLED` default `true` → unconfigured deployment behaves exactly as today (zero behavior change). `isEnvOnly: true`.
- Do NOT change the generic guard logic (`capability.guard.ts`) or `isCapabilityAvailable` — they already work for EMAIL.
- Do NOT touch the dormant `WorkspaceCapabilityEntity` / mutation / instance command.
- EMAIL-off must NOT break Calendar: only gate email-pure surfaces (below). Shared connect/OAuth/sync endpoints stay reachable (accepted).
- Commit after each task. No signatures/co-author tags in commits.
- Reference: docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md. Prior slice pattern (Dashboards) is on main — mirror it.

---

### Task 1: Config var `IS_EMAIL_MODULE_ENABLED` + catalog flag

**Files:**
- Modify: `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`
- Modify: `packages/twenty-server/.env.example`, `packages/twenty-docker/.env.example`
- Modify: `packages/twenty-server/src/engine/core-modules/product-capability/constants/product-capability-catalog.constant.ts`

- [ ] **Step 1: Config var.** Mirror `IS_DASHBOARDS_MODULE_ENABLED` (config-variables.ts ~line 115-123) exactly, same group (`ConfigVariablesGroup.SERVER_CONFIG`), `isEnvOnly: true`, `ConfigVariableType.BOOLEAN`, default `true`:
```ts
  @ConfigVariablesMetadata({
    group: ConfigVariablesGroup.SERVER_CONFIG,
    description:
      'Enable the Email module for this deployment. When false, the connected-inbox Email feature is unavailable and hidden for all workspaces on this instance.',
    isEnvOnly: true,
    type: ConfigVariableType.BOOLEAN,
  })
  @IsOptional()
  IS_EMAIL_MODULE_ENABLED = true;
```
- [ ] **Step 2: Env docs.** Add to both `.env.example` files next to `IS_DASHBOARDS_MODULE_ENABLED` (match the surrounding commented/uncommented convention):
```
IS_EMAIL_MODULE_ENABLED=true
```
- [ ] **Step 3: Catalog flag.** In product-capability-catalog.constant.ts, the `[ProductCapabilityKey.EMAIL]` entry (~line 79-89) `availability: {}` → `availability: { configFlag: 'IS_EMAIL_MODULE_ENABLED' }`.
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): add IS_EMAIL_MODULE_ENABLED deploy config var"`

---

### Task 2: Guard the email-pure resolvers with `@RequireCapability(EMAIL)`

**Files:**
- Modify: `packages/twenty-server/src/engine/metadata-modules/message-channel/resolvers/message-channel.resolver.ts`
- Modify: `packages/twenty-server/src/engine/metadata-modules/message-folder/resolvers/message-folder.resolver.ts`
- Modify: `packages/twenty-server/src/modules/messaging/message-outbound-manager/resolvers/send-email.resolver.ts`
- Modify: the NestJS module of each resolver above (add `ProductCapabilityModule` to `imports` if not already present — find each module file, e.g. `*message-channel*.module.ts`).

**Interfaces:**
- Consumes: `CapabilityGuard` (`src/engine/guards/capability.guard.ts`), `RequireCapability` (same file), `ProductCapabilityKey` from `twenty-shared/types`, `ProductCapabilityModule` (`src/engine/core-modules/product-capability/product-capability.module`).

- [ ] **Step 1: Guard MessageChannelResolver.** For EACH of these methods — `myMessageChannels` (Query, line ~81), `updateMessageChannel` (~108), `createEmailGroupChannel` (~171), `updateEmailGroupChannel` (~186), `deleteEmailGroupChannel` (~201) — append `CapabilityGuard` to the method's existing `@UseGuards(...)` list and add `@RequireCapability(ProductCapabilityKey.EMAIL)` directly below the `@UseGuards`. Examples:
  - `@UseGuards(NoPermissionGuard)` → `@UseGuards(NoPermissionGuard, CapabilityGuard)`
  - `@UseGuards(SettingsPermissionGuard(PermissionFlagType.WORKSPACE))` → `@UseGuards(SettingsPermissionGuard(PermissionFlagType.WORKSPACE), CapabilityGuard)`
  Mirror the Dashboards pattern (`src/modules/dashboard/resolvers/dashboard.resolver.ts:33-37`): class-level `@UseGuards(WorkspaceAuthGuard)` stays; method-level guards run after it.
- [ ] **Step 2: Guard MessageFolderResolver.** Same treatment on `myMessageFolders` (~27), `updateMessageFolder` (~52), `updateMessageFolders` (~72): `@UseGuards(NoPermissionGuard, CapabilityGuard)` + `@RequireCapability(ProductCapabilityKey.EMAIL)`.
- [ ] **Step 3: Guard SendEmailResolver.** On `sendEmail` (~46): append `CapabilityGuard` to the class/method `@UseGuards` and add `@RequireCapability(ProductCapabilityKey.EMAIL)` on the method. (The class has a multi-guard `@UseGuards(...)` at line ~32 — add `CapabilityGuard` to the method-level guard, or if there is no method-level `@UseGuards`, add `@UseGuards(CapabilityGuard)` + `@RequireCapability` on the method. Keep existing guards intact.)
- [ ] **Step 4: Module imports.** For each of the three resolvers' NestJS modules, add `ProductCapabilityModule` to `imports` if absent (mirror `dashboard.module.ts:5,24`). Find the module that declares each resolver in its `providers`.
- [ ] **Step 5: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 6: Boot smoke (DI).** Confirm the app boots with the new guards wired (no DI/guard resolution error). If a full boot is impractical in the subagent, at minimum typecheck must pass; the controller will run a boot smoke after this slice. Note the result.
- [ ] **Step 7: Commit.** `git commit -m "feat(server): gate Email module resolvers on deployment availability"`

---

### Task 3: Expose the flag on clientConfig (backend)

**Files:**
- Modify: `packages/twenty-server/src/engine/core-modules/client-config/client-config.entity.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/client-config/services/client-config.service.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/client-config/client-config.controller.spec.ts` (add the field to the expected mock object)

- [ ] **Step 1: Entity field.** Directly after `isDashboardsModuleEnabled` (the field added in the Dashboards slice), mirror it:
```ts
  @Field(() => Boolean)
  isEmailModuleEnabled: boolean;
```
- [ ] **Step 2: Populate.** In client-config.service.ts, next to `isDashboardsModuleEnabled`:
```ts
      isEmailModuleEnabled: this.twentyConfigService.get('IS_EMAIL_MODULE_ENABLED'),
```
- [ ] **Step 3: Controller spec mock.** Add `isEmailModuleEnabled: true` to the expected clientConfig object in client-config.controller.spec.ts (mirror the `isDashboardsModuleEnabled: true` line).
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): surface IS_EMAIL_MODULE_ENABLED on clientConfig"`

---

### Task 4: Wire the flag into frontend clientConfig + availability map

**Files:**
- Modify: `packages/twenty-front/src/modules/client-config/types/ClientConfig.ts`
- Create: `packages/twenty-front/src/modules/client-config/states/isEmailModuleEnabledState.ts`
- Modify: `packages/twenty-front/src/modules/client-config/hooks/useClientConfig.ts`
- Modify: `packages/twenty-front/src/testing/mock-data/config.ts`
- Modify: `packages/twenty-front/src/modules/workspace/constants/productCapabilityAvailabilityAtoms.ts`
- Modify: `packages/twenty-front/src/modules/workspace/hooks/useIsCapabilityEnabled.ts`

- [ ] **Step 1: Type.** Add `isEmailModuleEnabled: boolean;` to `ClientConfig.ts` next to `isDashboardsModuleEnabled`.
- [ ] **Step 2: Atom.** Create `isEmailModuleEnabledState.ts` mirroring `isDashboardsModuleEnabledState.ts` (Jotai `createAtomState<boolean>`, key `'isEmailModuleEnabled'`, `defaultValue: true`).
- [ ] **Step 3: useClientConfig wiring.** Mirror every `isDashboardsModuleEnabled`/`setIsDashboardsModuleEnabled` occurrence for Email: import the atom, `const setIsEmailModuleEnabled = useSetAtomState(isEmailModuleEnabledState);`, `setIsEmailModuleEnabled(clientConfig.isEmailModuleEnabled);` on fetch, and add `setIsEmailModuleEnabled` to the `useCallback` dep array.
- [ ] **Step 4: Mock.** Add `isEmailModuleEnabled: true` to `mock-data/config.ts` (next to the dashboards mock).
- [ ] **Step 5: Availability map.** In `productCapabilityAvailabilityAtoms.ts` add `[ProductCapabilityKey.EMAIL]: isEmailModuleEnabledState,` (import the atom). In `useIsCapabilityEnabled.ts` read the new atom unconditionally and add it to the `availabilityByCapability` map:
```ts
  const isEmailModuleEnabled = useAtomStateValue(isEmailModuleEnabledState);
  ...
  const availabilityByCapability: Partial<Record<ProductCapabilityKey, boolean>> = {
    [ProductCapabilityKey.DASHBOARDS]: isDashboardsModuleEnabled,
    [ProductCapabilityKey.EMAIL]: isEmailModuleEnabled,
  };
```
- [ ] **Step 6: Extend the hook test.** In `useIsCapabilityEnabled.test.ts` add cases: EMAIL false when `isEmailModuleEnabledState=false`, true when true. (Mirror the DASHBOARDS cases.)
- [ ] **Step 7: Run + typecheck.** `cd packages/twenty-front && npx jest "useIsCapabilityEnabled"` PASS; `npx nx typecheck twenty-front` PASS. Verify `git status` clean after commit (no stray mock file left uncommitted).
- [ ] **Step 8: Commit.** `git commit -m "feat(front): resolve Email module availability from clientConfig deploy flag"`

---

### Task 5: Hide the Email UI surfaces when the flag is off

**Files:**
- Modify: `packages/twenty-front/src/modules/settings/components/SettingsProtectedRouteWrapper.tsx`
- Modify: `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx`
- Modify: `packages/twenty-front/src/modules/settings/hooks/useSettingsNavigationItems.tsx`
- Modify: `packages/twenty-front/src/modules/page-layout/widgets/components/WidgetContentRenderer.tsx`
- Test: extend/create a test for the wrapper's capability gate (mirror an existing SettingsProtectedRouteWrapper test if present; otherwise a focused nav-hide test).

**Interfaces:**
- Consumes: `useIsCapabilityEnabled(ProductCapabilityKey.EMAIL)`.

- [ ] **Step 1: Extend the route wrapper.** Add an optional `requiredCapability?: ProductCapabilityKey` prop to `SettingsProtectedRouteWrapper` mirroring `requiredFeatureFlag`:
```ts
  requiredCapability?: ProductCapabilityKey;
```
Read it with the hook (unconditional; the hook accepts null): `const isCapabilityEnabled = useIsCapabilityEnabled(requiredCapability ?? null);` and add `(requiredCapability && !isCapabilityEnabled)` to the redirect condition:
```ts
  if (
    (requiredFeatureFlag && !requiredFeatureFlagEnabled) ||
    (requiredCapability && !isCapabilityEnabled) ||
    !hasPermission
  ) {
    return <Navigate to={getSettingsPath(SettingsPath.ProfilePage)} replace />;
  }
```
Import `ProductCapabilityKey` (value, from `~/generated-metadata/graphql`). Note: `useIsCapabilityEnabled(null)` returns `false`, so guard with `requiredCapability && ...` (only redirect when a capability is required AND unavailable).
- [ ] **Step 2: Gate the AccountsEmails route.** In `SettingsRoutes.tsx`, wrap ONLY the `AccountsEmails` route (currently ~line 694-697, inside the shared Accounts wrapper block) with an inner `SettingsProtectedRouteWrapper requiredCapability={ProductCapabilityKey.EMAIL}`. Do NOT add the capability to the outer block that also wraps `AccountsCalendars`/`Accounts`/connect routes — those stay reachable for Calendar. (If the cleanest expression is a nested wrapper around just the AccountsEmails `<Route>`, do that; keep the existing `settingsPermission` wrapper intact.)
- [ ] **Step 3: Hide the Emails nav sub-item.** In `useSettingsNavigationItems.tsx`, the `Emails` sub-item (~line 100-106): add `const isEmailCapabilityEnabled = useIsCapabilityEnabled(ProductCapabilityKey.EMAIL);` near the other capability/flag reads and set its `isHidden` to also require it, mirroring the Communication item's shape (line ~183-190):
```ts
  isHidden: !isEmailCapabilityEnabled || !permissionMap[PermissionFlagType.CONNECTED_ACCOUNTS],
```
Do NOT change the `Calendars` sub-item or the `Accounts` parent.
- [ ] **Step 4: Gate the timeline Emails widget.** In `WidgetContentRenderer.tsx`, the `case WidgetType.EMAILS` (~line 59-60): return `null` (or the existing empty/hidden state) when `useIsCapabilityEnabled(ProductCapabilityKey.EMAIL)` is false. Call the hook unconditionally at the top of the component (not inside the switch) and branch in the EMAILS case. Keep other widget cases unchanged.
- [ ] **Step 5: Test.** Add a focused test: wrapper redirects when `requiredCapability={EMAIL}` and `isEmailModuleEnabledState=false`, renders children when true. Mirror an existing wrapper/nav test harness (search `SettingsProtectedRouteWrapper` tests; if none, test the nav hook's Emails-item `isHidden` toggling with the atom). Seed the Jotai atom.
- [ ] **Step 6: Run + typecheck + lint.** `cd packages/twenty-front && npx jest` for the new test PASS; `npx nx typecheck twenty-front` PASS; `npx nx lint:diff-with-main twenty-front` PASS (run `--configuration=fix` then re-check if needed).
- [ ] **Step 7: Commit.** `git commit -m "feat(front): hide Email settings route/nav/widget when deploy-disabled"`

---

### Task 6: Integration test (enabled path) + boot smoke

**Files:**
- Create: `packages/twenty-server/test/integration/graphql/suites/settings-permissions/email-capability-availability.integration-spec.ts`

- [ ] **Step 1: Integration test (default path).** Mirror `capability-availability.integration-spec.ts` (the Dashboards one on main). With default config (`IS_EMAIL_MODULE_ENABLED` unset → true), call a guarded email resolver — `myMessageChannels` (Query on MessageChannelResolver) — and assert `errors` is undefined (the availability gate does NOT block the enabled path). Top-of-file comment: the config-false → FORBIDDEN path is covered by the generic guard unit test (`capability.guard.spec.ts`); the env-only var cannot be flipped per-test.
- [ ] **Step 2: Run.** `cd packages/twenty-server && NODE_ENV=test NODE_OPTIONS="--max-old-space-size=6144" npx jest --config ./jest-integration.config.ts email-capability-availability` — PASS. (If DB not seeded, run once via `npx nx run twenty-server:test:integration:with-db-reset` with the filename filter appended.) Do NOT bypass auth or forge tokens.
- [ ] **Step 3: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 4: Commit.** `git commit -m "test(server): deployment-availability gate for Email resolvers"`

---

### Task 7: Docs

**Files:**
- Modify: `docs/modular-crm/12-MODULE-CATALOG.md` and/or `docs/modular-crm/IMPLEMENTATION-STATUS.md` — record that EMAIL is now deploy-config gated (`IS_EMAIL_MODULE_ENABLED`), listing the gated surfaces (3 resolvers + Emails nav/route + timeline widget) and the accepted shared-plumbing limitation (Accounts/OAuth/ChannelSync reachable so Calendar is unaffected).

- [ ] **Step 1: Targeted edit.** Add a short EMAIL entry under the deploy-config availability model (reference the spec). Note Level A + the shared email+calendar plumbing left reachable by design.
- [ ] **Step 2: Commit.** `git commit -m "docs(modular-crm): record Email deploy-config gate"`

---

## Self-Review

- **Spec coverage:** config+catalog (T1), backend guard on email-pure resolvers (T2), clientConfig backend (T3) + frontend + availability map (T4), UI hide route/nav/widget (T5), integration+smoke (T6), docs (T7). Generic guard/`isCapabilityAvailable` reused unchanged.
- **Calendar safety:** only email-pure surfaces gated; shared Accounts/IMAP-CalDAV/OAuth/ChannelSync/ConnectedAccount untouched (accepted Level A limitation). AccountsEmails route + Emails nav sub-item gated in isolation; Calendars sibling untouched.
- **Zero behavior change:** `IS_EMAIL_MODULE_ENABLED` defaults true; all atoms default true; guard allows when true.
- **Type consistency:** `IS_EMAIL_MODULE_ENABLED` string identical across config var / catalog / clientConfig service. `ProductCapabilityKey.EMAIL` used as value on FE.
