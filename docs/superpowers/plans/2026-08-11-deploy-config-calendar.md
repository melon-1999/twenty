# Deploy-Config Module Provisioning — Calendar slice

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Gate the "Calendar" module behind a deploy-time, operator-set, customer-immutable config flag (`IS_CALENDAR_MODULE_ENABLED`), a clean mirror of the merged Email slice. Reuses the generic availability guard + clientConfig plumbing.

**Architecture:** Add the CALENDAR config flag; guard the calendar-pure resolvers; surface the flag on clientConfig; hide the Calendar nav item / route / timeline widget; and skip the shared `myCalendarChannels` query when CALENDAR is off. Shared email+calendar plumbing (ConnectedAccount, ChannelSync, IMAP/CalDAV, OAuth) and the Activities-timeline `TimelineCalendarEventResolver` are intentionally left ungated (Level A; must not break Email or the timeline).

**Tech Stack:** NestJS + TypeORM (twenty-server), React + Jotai (twenty-front), twenty-config, clientConfig REST, Jest.

## Global Constraints

- Named exports only; no `any`; `//` comments only; Lingui for user-facing strings; kebab-case files.
- Do NOT modify any `/* @license Enterprise */` file.
- `IS_CALENDAR_MODULE_ENABLED` default `true` → unconfigured deployment behaves exactly as today. `isEnvOnly: true`.
- Do NOT change the generic guard logic (`capability.guard.ts`) or `isCapabilityAvailable`.
- Do NOT touch the dormant `WorkspaceCapabilityEntity` / mutation / instance command.
- CALENDAR-off must NOT break Email or the Activities timeline: only gate calendar-pure surfaces. Do NOT guard `TimelineCalendarEventResolver`, `ConnectedAccountResolver`, `ChannelSyncResolver`, IMAP/CalDAV, or OAuth controllers.
- Commit after each task. No signatures/co-author tags.
- Reference spec: docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md. Mirror the merged Email slice patterns (on main).

---

### Task 1: Config var `IS_CALENDAR_MODULE_ENABLED` + catalog flag

**Files:** `config-variables.ts`; `packages/twenty-server/.env.example`; `packages/twenty-docker/.env.example`; `product-capability-catalog.constant.ts`

- [ ] **Step 1: Config var.** Mirror `IS_EMAIL_MODULE_ENABLED` (config-variables.ts ~line 133) exactly; same group `ConfigVariablesGroup.SERVER_CONFIG`, `isEnvOnly: true`, `ConfigVariableType.BOOLEAN`, `@IsOptional()`, default `true`:
```ts
  @ConfigVariablesMetadata({
    group: ConfigVariablesGroup.SERVER_CONFIG,
    description:
      'Enable the Calendar module for this deployment. When false, the connected-calendar feature is unavailable and hidden for all workspaces on this instance.',
    isEnvOnly: true,
    type: ConfigVariableType.BOOLEAN,
  })
  @IsOptional()
  IS_CALENDAR_MODULE_ENABLED = true;
```
- [ ] **Step 2: Env docs.** Add `IS_CALENDAR_MODULE_ENABLED=true` to both `.env.example` files next to `IS_EMAIL_MODULE_ENABLED`, matching its exact commented/uncommented convention.
- [ ] **Step 3: Catalog flag.** In product-capability-catalog.constant.ts, the `[ProductCapabilityKey.CALENDAR]` entry (~line 90-100) `availability: {}` → `availability: { configFlag: 'IS_CALENDAR_MODULE_ENABLED' }`. Touch ONLY the CALENDAR entry.
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): add IS_CALENDAR_MODULE_ENABLED deploy config var"`

---

### Task 2: Guard the calendar-pure resolvers with `@RequireCapability(CALENDAR)`

**Files:**
- `packages/twenty-server/src/engine/metadata-modules/calendar-channel/resolvers/calendar-channel.resolver.ts`
- `packages/twenty-server/src/engine/metadata-modules/calendar-channel/calendar-channel-metadata.module.ts`
- `packages/twenty-server/src/modules/calendar/calendar-event-creation-manager/resolvers/create-calendar-event.resolver.ts`
- `packages/twenty-server/src/modules/calendar/calendar-event-creation-manager/create-calendar-event.module.ts`

**Interfaces:** `CapabilityGuard`, `RequireCapability` (`src/engine/guards/capability.guard.ts`); `ProductCapabilityKey` from `twenty-shared/types`; `ProductCapabilityModule` (`src/engine/core-modules/product-capability/product-capability.module`).

- [ ] **Step 1: Guard CalendarChannelResolver.** On `myCalendarChannels` (Query, ~L24) and `updateCalendarChannel` (Mutation, ~L51), each currently `@UseGuards(NoPermissionGuard)` → `@UseGuards(NoPermissionGuard, CapabilityGuard)` and add `@RequireCapability(ProductCapabilityKey.CALENDAR)`. (Read the file first: confirm whether the class carries `@UseGuards(WorkspaceAuthGuard)` or `@MetadataResolver` supplies workspace context — either way, `CapabilityGuard` is deployment-scoped and safe appended to the method guards. Mirror `message-channel.resolver.ts`.)
- [ ] **Step 2: Guard CreateCalendarEventResolver.** The class has `@UseGuards(WorkspaceAuthGuard, SettingsPermissionGuard(PermissionFlagType.CREATE_CALENDAR_EVENT_TOOL))`; `createCalendarEvent` (~L42) has no method-level `@UseGuards`. Add `@UseGuards(CapabilityGuard)` + `@RequireCapability(ProductCapabilityKey.CALENDAR)` on the method (mirror `send-email.resolver.ts`'s `sendEmail`). Keep the class guards.
- [ ] **Step 3: Module imports.** Add `ProductCapabilityModule` to the `imports` of `calendar-channel-metadata.module.ts` and `create-calendar-event.module.ts` if absent (mirror `message-channel-metadata.module.ts` / `send-email.module.ts`).
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): gate Calendar module resolvers on deployment availability"`

---

### Task 3: Expose the flag on clientConfig (backend)

**Files:** `client-config.entity.ts`; `services/client-config.service.ts`; `client-config.controller.spec.ts`

- [ ] **Step 1: Entity field.** After `isEmailModuleEnabled`:
```ts
  @Field(() => Boolean)
  isCalendarModuleEnabled: boolean;
```
- [ ] **Step 2: Populate.** After the `isEmailModuleEnabled` populate line:
```ts
      isCalendarModuleEnabled: this.twentyConfigService.get(
        'IS_CALENDAR_MODULE_ENABLED',
      ),
```
- [ ] **Step 3: Controller spec mock.** Add `isCalendarModuleEnabled: true` next to `isEmailModuleEnabled: true`.
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): surface IS_CALENDAR_MODULE_ENABLED on clientConfig"`

---

### Task 4: Wire the flag into frontend clientConfig + availability map

**Files:** `client-config/types/ClientConfig.ts`; create `client-config/states/isCalendarModuleEnabledState.ts`; `client-config/hooks/useClientConfig.ts`; `testing/mock-data/config.ts`; `workspace/constants/productCapabilityAvailabilityAtoms.ts`; `workspace/hooks/useIsCapabilityEnabled.ts`; test `workspace/hooks/__tests__/useIsCapabilityEnabled.test.ts`

- [ ] **Step 1: Type.** Add `isCalendarModuleEnabled: boolean;` to ClientConfig.ts next to isEmailModuleEnabled.
- [ ] **Step 2: Atom.** Create isCalendarModuleEnabledState.ts mirroring isEmailModuleEnabledState.ts (Jotai `createAtomState<boolean>`, key `'isCalendarModuleEnabled'`, `defaultValue: true`).
- [ ] **Step 3: useClientConfig.** Mirror every isEmailModuleEnabled/setIsEmailModuleEnabled occurrence for Calendar (import, `const setIsCalendarModuleEnabled = useSetAtomState(isCalendarModuleEnabledState);`, `setIsCalendarModuleEnabled(clientConfig.isCalendarModuleEnabled);` on fetch, and add to the useCallback dep array).
- [ ] **Step 4: Mock.** Add `isCalendarModuleEnabled: true` to mock-data/config.ts.
- [ ] **Step 5: Availability map + hook.** In productCapabilityAvailabilityAtoms.ts add `[ProductCapabilityKey.CALENDAR]: isCalendarModuleEnabledState,`. In useIsCapabilityEnabled.ts read the new atom unconditionally (`const isCalendarModuleEnabled = useAtomStateValue(isCalendarModuleEnabledState);`) and add `[ProductCapabilityKey.CALENDAR]: isCalendarModuleEnabled,` to `availabilityByCapability`.
- [ ] **Step 6: Test.** Extend useIsCapabilityEnabled.test.ts with CALENDAR false/true cases (mirror EMAIL).
- [ ] **Step 7: Run + typecheck.** `cd packages/twenty-front && npx jest "useIsCapabilityEnabled"` PASS; `npx nx typecheck twenty-front` PASS. Verify `git status` clean after commit (mock file committed).
- [ ] **Step 8: Commit.** `git commit -m "feat(front): resolve Calendar module availability from clientConfig deploy flag"`

---

### Task 5: Hide the Calendar UI surfaces when the flag is off

**Files:** `settings/hooks/useSettingsNavigationItems.tsx`; `app/components/SettingsRoutes.tsx`; `page-layout/widgets/components/WidgetContentRenderer.tsx`; test (mirror the Email wrapper/nav test approach)

- [ ] **Step 1: Hide the Calendars nav sub-item.** In useSettingsNavigationItems.tsx, add `const isCalendarCapabilityEnabled = useIsCapabilityEnabled(ProductCapabilityKey.CALENDAR);` next to the existing `isEmailCapabilityEnabled` read (~L84-86). Change ONLY the Calendars sub-item (~L116-120) `isHidden` to `!isCalendarCapabilityEnabled || !permissionMap[PermissionFlagType.CONNECTED_ACCOUNTS]` (mirror the Emails sub-item). Do NOT touch Emails / Accounts parent.
- [ ] **Step 2: Gate the AccountsCalendars route.** In SettingsRoutes.tsx, wrap ONLY the `AccountsCalendars` `<Route>` (~L709-712) with `<SettingsProtectedRouteWrapper requiredCapability={ProductCapabilityKey.CALENDAR}>...</SettingsProtectedRouteWrapper>`, mirroring how `AccountsEmails` (~L697-708) is wrapped with `requiredCapability={ProductCapabilityKey.EMAIL}`. Do NOT touch the AccountsEmails wrapper, the Accounts parent, or shared connect routes.
- [ ] **Step 3: Gate the timeline Calendar widget.** In WidgetContentRenderer.tsx, add `const isCalendarModuleEnabled = useIsCapabilityEnabled(ProductCapabilityKey.CALENDAR);` at the top (next to the existing `isEmailModuleEnabled` read ~L13-15). Change `case WidgetType.CALENDAR:` (~L48) to `return isCalendarModuleEnabled ? <CalendarWidget widget={widget} /> : null;`. Leave all other cases (including EMAILS) unchanged.
- [ ] **Step 4: Test.** Extend/add a focused test asserting the AccountsCalendars route redirects when `isCalendarModuleEnabledState=false` and renders when true (mirror the existing SettingsProtectedRouteWrapper.test.tsx pattern) OR the Calendars nav-item isHidden flips with the atom. Seed the Jotai atom.
- [ ] **Step 5: Run + typecheck + lint.** New test PASS; `npx nx typecheck twenty-front` PASS; `npx nx lint:diff-with-main twenty-front` PASS (run --configuration=fix then re-check if needed).
- [ ] **Step 6: Commit.** `git commit -m "feat(front): hide Calendar settings route/nav/widget when deploy-disabled"`

---

### Task 6: Skip the shared `myCalendarChannels` query when Calendar is off

**Files:** `settings/accounts/hooks/useMyCalendarChannels.ts`; `pages/settings/accounts/SettingsAccountsConfiguration.tsx`; test `settings/accounts/hooks/__tests__/useMyCalendarChannels.test.tsx`

- [ ] **Step 1: Skip in the hook.** In useMyCalendarChannels.ts, mirror the merged useMyMessageChannels.ts exactly: add `const isCalendarModuleEnabled = useIsCapabilityEnabled(ProductCapabilityKey.CALENDAR);` and pass `skip: !isCalendarModuleEnabled` to the `useQuery`. Imports: `useIsCapabilityEnabled` from `@/workspace/hooks/useIsCapabilityEnabled`, `ProductCapabilityKey` (value) from `~/generated-metadata/graphql`. Returns `channels: data?.myCalendarChannels ?? []` (already `?? []`).
- [ ] **Step 2: Skip in the shared config page.** In SettingsAccountsConfiguration.tsx, add `const isCalendarModuleEnabled = useIsCapabilityEnabled(ProductCapabilityKey.CALENDAR);` (next to the existing `isEmailModuleEnabled` read) and change the `GET_MY_CALENDAR_CHANNELS` query's skip (~L58) to `skip: !connectedAccountId || !isCalendarModuleEnabled`. Do NOT change the message-channels query above it.
- [ ] **Step 2b:** Confirm `useMyConnectedAccounts` (the shared Accounts list) is NOT modified — the fix lives inside `useMyCalendarChannels`, which it consumes.
- [ ] **Step 3: Test.** Create useMyCalendarChannels.test.tsx mirroring useMyMessageChannels.test.tsx: with `isCalendarModuleEnabledState=false` the hook returns `channels: []` and does NOT fire the query (assert the mock unused / loading false, would fail if skip removed); with `=true` returns mocked channels. Seed the Jotai atom (JotaiProvider + store, mirror the message-channels test).
- [ ] **Step 4: Run + typecheck + lint.** `cd packages/twenty-front && npx jest "useMyCalendarChannels"` FAIL first, PASS after; `npx nx typecheck twenty-front` PASS; `npx nx lint:diff-with-main twenty-front` PASS.
- [ ] **Step 5: Commit.** `git commit -m "fix(front): skip myCalendarChannels query when Calendar module deploy-disabled"`

---

### Task 7: Integration test (enabled path)

**Files:** Create `packages/twenty-server/test/integration/graphql/suites/settings-permissions/calendar-capability-availability.integration-spec.ts`

- [ ] **Step 1: Integration test.** Mirror `email-capability-availability.integration-spec.ts` (on main). Default config (`IS_CALENDAR_MODULE_ENABLED` unset → true): query `myCalendarChannels` (guarded with `@RequireCapability(CALENDAR)`) via makeMetadataAPIRequest, select a minimal always-present field (read CalendarChannelDTO — e.g. `id`), assert `response.body.errors` is undefined. Empty list is fine. Top-of-file comment: config-false → FORBIDDEN covered by the generic guard unit test (`capability.guard.spec.ts`); env-only var can't be flipped per-test.
- [ ] **Step 2: Run.** `cd packages/twenty-server && NODE_ENV=test NODE_OPTIONS="--max-old-space-size=6144" npx jest --config ./jest-integration.config.ts calendar-capability-availability` — PASS. (If DB not seeded, run once via `npx nx run twenty-server:test:integration:with-db-reset` with the filename appended.) No auth bypass / forged tokens.
- [ ] **Step 3: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 4: Commit.** `git commit -m "test(server): deployment-availability gate for Calendar resolvers"`

---

### Task 8: Docs

**Files:** `docs/modular-crm/IMPLEMENTATION-STATUS.md`; `docs/modular-crm/12-MODULE-CATALOG.md`

- [ ] **Step 1: Record the slice.** Mirror the Email write-up: add a Calendar slice note (IS_CALENDAR_MODULE_ENABLED, guarded resolvers CalendarChannel + CreateCalendarEvent, hidden FE surfaces nav/route/widget, the myCalendarChannels skip hardening, and the accepted shared-plumbing + TimelineCalendarEventResolver-left-ungated limitation). Update the CALENDAR matrix row. Reference the spec.
- [ ] **Step 2: Commit.** `git commit -m "docs(modular-crm): record Calendar deploy-config gate"`

---

## Self-Review

- **Spec coverage:** config+catalog (T1), guard calendar-pure resolvers (T2), clientConfig backend (T3) + frontend + availability map (T4), UI hide route/nav/widget (T5), shared-query skip hardening (T6), integration (T7), docs (T8).
- **Email/timeline safety:** only calendar-pure surfaces gated; `TimelineCalendarEventResolver`, ConnectedAccount, ChannelSync, IMAP/CalDAV, OAuth left ungated; only the Calendars nav/route/widget hidden (Emails + Accounts parent untouched).
- **Zero behavior change:** `IS_CALENDAR_MODULE_ENABLED` defaults true; all atoms default true.
- **Type consistency:** `IS_CALENDAR_MODULE_ENABLED` string identical across config var / catalog / clientConfig service. `ProductCapabilityKey.CALENDAR` used as value on FE.
- **Hardening from the start:** unlike Email (added post-merge), the `myCalendarChannels` skip is T6 in-slice.
