# Deploy-Config Module Provisioning — Automations slice

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Gate the "Automations" (Workflows) module behind a deploy-time, operator-set, customer-immutable config flag (`IS_AUTOMATIONS_MODULE_ENABLED`). Automations is OBJECT-BACKED (root object `workflow` + system children workflowVersion/workflowRun/workflowAutomatedTrigger), so this mirrors the Dashboards pattern (object-nav hiding + discrete resolver guards) rather than the settings-only Email/Calendar pattern.

**Architecture:** Add the AUTOMATIONS config flag; catalog `availability.configFlag` + `effect.objectStandardIds:[workflow]`; guard the workflow-pure GraphQL resolvers with `@RequireCapability(AUTOMATIONS)`; ALSO close the AI-tool bypass (the 21 chat-invoked workflow tools reach `WorkflowToolWorkspaceService` without touching the guarded resolvers) by adding a capability check to `WorkflowToolProvider.isAvailable`; surface the flag on clientConfig; hide the `workflow` object from object-nav via `objectNameToCapabilityKey` + `useFilteredObjectMetadataItems`. Reuses the generic guard + `isCapabilityAvailable`.

**Accepted Level A limitations (documented, not fixed here):** the unauthenticated webhook trigger controller (`workflow-trigger.controller.ts`, `PublicEndpointGuard`) and the background cron/async workflow runners are NOT capability-guarded — when the module is deploy-off no workflows exist to trigger, and deploy is operator-controlled. Mirrors the accepted background-cron limitation of the Email/Calendar slices.

**Tech Stack:** NestJS + TypeORM (twenty-server), React + Jotai (twenty-front), twenty-config, clientConfig REST, Jest.

## Global Constraints

- Named exports only; no `any`; `//` comments only; Lingui; kebab-case files.
- Do NOT modify any `/* @license Enterprise */` file.
- `IS_AUTOMATIONS_MODULE_ENABLED` default `true` → unconfigured deployment behaves exactly as today. `isEnvOnly: true`.
- Do NOT change the generic guard logic (`capability.guard.ts`) or `isCapabilityAvailable`.
- Do NOT touch the dormant `WorkspaceCapabilityEntity` / mutation / instance command.
- Do NOT set FE display-catalog `objectBacked` for AUTOMATIONS — that field feeds only the dormant `useUpdateWorkspaceCapability` hook and its catalog test asserts DASHBOARDS-only; leave it.
- AUTOMATIONS-off must NOT break unrelated features. Only guard workflow-pure resolvers; do NOT guard shared plumbing.
- Commit after each task. No signatures/co-author tags.
- Reference spec: docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md. Mirror the merged Dashboards (object-backed) + Email/Calendar (clientConfig) slices on main.

---

### Task 1: Config var + catalog (availability + effect)

**Files:** `config-variables.ts`; both `.env.example`; `product-capability-catalog.constant.ts`

- [ ] **Step 1: Config var.** Mirror `IS_CALENDAR_MODULE_ENABLED` (config-variables.ts, near where IS_CALENDAR sits) exactly; same group `ConfigVariablesGroup.SERVER_CONFIG`, `isEnvOnly: true`, `ConfigVariableType.BOOLEAN`, `@IsOptional()`, default `true`:
```ts
  @ConfigVariablesMetadata({
    group: ConfigVariablesGroup.SERVER_CONFIG,
    description:
      'Enable the Automations (Workflows) module for this deployment. When false, the Workflows feature is unavailable and hidden for all workspaces on this instance.',
    isEnvOnly: true,
    type: ConfigVariableType.BOOLEAN,
  })
  @IsOptional()
  IS_AUTOMATIONS_MODULE_ENABLED = true;
```
- [ ] **Step 2: Env docs.** Add `IS_AUTOMATIONS_MODULE_ENABLED=true` to both `.env.example` files next to `IS_CALENDAR_MODULE_ENABLED`, matching its exact commented/uncommented convention.
- [ ] **Step 3: Catalog.** In product-capability-catalog.constant.ts, the `[ProductCapabilityKey.AUTOMATIONS]` entry (currently `availability: {}`, `effect: {}`): set
```ts
    availability: { configFlag: 'IS_AUTOMATIONS_MODULE_ENABLED' },
    effect: {
      objectStandardIds: [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflow],
    },
```
(`STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS` is already imported in the file; `.workflow` = '20202020-62be-406c-b9ca-8caa50d51392'.) Touch ONLY the AUTOMATIONS entry. Add a `//` comment mirroring the Dashboards entry's note (effect flips isActive per-workspace via the dormant path; the enforcement boundary is the discrete resolver guards).
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): add IS_AUTOMATIONS_MODULE_ENABLED deploy config var"`

---

### Task 2: Guard the workflow-pure resolvers with `@RequireCapability(AUTOMATIONS)`

**Files (all under `packages/twenty-server/src/engine/core-modules/workflow/resolvers/`):**
- `workflow-trigger.resolver.ts` (WorkflowTriggerResolver)
- `workflow-version.resolver.ts` (WorkflowVersionResolver)
- `workflow-version-step.resolver.ts` (WorkflowVersionStepResolver)
- `workflow-version-edge.resolver.ts` (WorkflowVersionEdgeResolver)
- `workflow-builder.resolver.ts` (WorkflowBuilderResolver)
- Plus the NestJS module(s) declaring these resolvers (add `ProductCapabilityModule` to `imports`). Find each with `grep -rl "WorkflowTriggerResolver\|WorkflowVersionResolver\|WorkflowVersionStepResolver\|WorkflowVersionEdgeResolver\|WorkflowBuilderResolver" packages/twenty-server/src | grep module.ts` (they likely share a module — add the import once per module file).

**Interfaces:** `CapabilityGuard`, `RequireCapability` (`src/engine/guards/capability.guard.ts`); `ProductCapabilityKey` from `twenty-shared/types`; `ProductCapabilityModule` (`src/engine/core-modules/product-capability/product-capability.module`).

- [ ] **Step 1: Read one merged example.** Read `src/modules/dashboard/resolvers/dashboard.resolver.ts` + `message-channel.resolver.ts` for the exact decorator order (existing class-level `@UseGuards(...)` stays; `CapabilityGuard` appended; `@RequireCapability(...)` per method).
- [ ] **Step 2: Guard each resolver class.** For EACH of the 5 resolvers: add `CapabilityGuard` to the class-level `@UseGuards(...)` list (each class already has `@UseGuards(WorkspaceAuthGuard, SettingsPermissionGuard(PermissionFlagType.WORKFLOWS), ...)` — append `CapabilityGuard`), and add `@RequireCapability(ProductCapabilityKey.AUTOMATIONS)` on EVERY `@Query`/`@Mutation` method in that class. (The guard reads capability metadata per handler via `reflector.get(CAPABILITY_KEY, context.getHandler())` — class-level `@RequireCapability` would NOT be seen, so it MUST be per-method. Class-level `CapabilityGuard` in `@UseGuards` applies to all methods.) Do NOT remove/reorder existing guards. Do NOT change method bodies.
  - Methods to decorate (confirm by reading each file; the set):
    - WorkflowTriggerResolver: `activateWorkflowVersion`, `deactivateWorkflowVersion`, `runWorkflowVersion`, `stopWorkflowRun`, `retryWorkflowRun`
    - WorkflowVersionResolver: `workflowVersionContent`, `createDraftFromWorkflowVersion`, `duplicateWorkflow`, `updateWorkflowVersionPositions`
    - WorkflowVersionStepResolver: `workflowStepConnectedAccountHandle`, `createWorkflowVersionStep`, `updateWorkflowVersionStep`, `updateWorkflowVersionTrigger`, `deleteWorkflowVersionStep`, `submitFormStep`, `updateWorkflowRunStep`, `duplicateWorkflowVersionStep`, `testHttpRequest`
    - WorkflowVersionEdgeResolver: `createWorkflowVersionEdge`, `deleteWorkflowVersionEdge`
    - WorkflowBuilderResolver: `computeStepOutputSchema`
- [ ] **Step 3: Module imports.** Add `ProductCapabilityModule` to the `imports` array of each module that declares these resolvers (if absent). Mirror `dashboard.module.ts`.
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): gate Automations module resolvers on deployment availability"`

---

### Task 3: Close the AI-tool bypass (capability check in WorkflowToolProvider)

**Files:**
- `packages/twenty-server/src/engine/core-modules/tool-provider/providers/workflow-tool.provider.ts`
- `packages/twenty-server/src/engine/core-modules/tool-provider/tool-provider.module.ts`
- Test: a focused unit test for `WorkflowToolProvider.isAvailable` (create if none nearby; mirror an existing tool-provider test if one exists — search `tool-provider` test dirs).

**Rationale:** The 21 workflow AI tools run through `WorkflowToolWorkspaceService`, bypassing the guarded GraphQL resolvers. `isAvailable` currently checks only `PermissionFlagType.WORKFLOWS`. A deploy with AUTOMATIONS off must also make these tools unavailable.

- [ ] **Step 1: Write the failing test.** Assert `isAvailable` returns `false` when `WorkspaceCapabilityService.isCapabilityAvailable(AUTOMATIONS)` is `false` (even if permission passes), and returns the permission result when availability is `true`. Mock `WorkspaceCapabilityService` (`{ isCapabilityAvailable: jest.fn() }`), `PermissionsService`, and the injected `workflowToolService` (non-null).
- [ ] **Step 1b: Run — expect FAIL.** `cd packages/twenty-server && npx jest "workflow-tool.provider"`.
- [ ] **Step 2: Implement.** Inject `WorkspaceCapabilityService` (from `src/engine/core-modules/product-capability/services/workspace-capability.service`) into `WorkflowToolProvider`. In `isAvailable`, after the `!this.workflowToolService` early return, add:
```ts
    if (
      !this.workspaceCapabilityService.isCapabilityAvailable(
        ProductCapabilityKey.AUTOMATIONS,
      )
    ) {
      return false;
    }
```
Keep the existing permission check as the final return. Import `ProductCapabilityKey` from `twenty-shared/types`. Add `ProductCapabilityModule` to `tool-provider.module.ts` imports if `WorkspaceCapabilityService` is not already resolvable there.
- [ ] **Step 3: Run tests — PASS.** `cd packages/twenty-server && npx jest "workflow-tool.provider"`.
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): gate workflow AI tools on Automations deployment availability"`

---

### Task 4: Expose the flag on clientConfig (backend)

**Files:** `client-config.entity.ts`; `services/client-config.service.ts`; `client-config.controller.spec.ts`

- [ ] **Step 1: Entity field.** After `isCalendarModuleEnabled`:
```ts
  @Field(() => Boolean)
  isAutomationsModuleEnabled: boolean;
```
- [ ] **Step 2: Populate.** After the `isCalendarModuleEnabled` populate block:
```ts
      isAutomationsModuleEnabled: this.twentyConfigService.get(
        'IS_AUTOMATIONS_MODULE_ENABLED',
      ),
```
- [ ] **Step 3: Controller spec mock.** Add `isAutomationsModuleEnabled: true` next to `isCalendarModuleEnabled: true`.
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): surface IS_AUTOMATIONS_MODULE_ENABLED on clientConfig"`

---

### Task 5: Wire the flag into frontend clientConfig

**Files:** `client-config/types/ClientConfig.ts`; create `client-config/states/isAutomationsModuleEnabledState.ts`; `client-config/hooks/useClientConfig.ts`; `testing/mock-data/config.ts`; `workspace/hooks/useIsCapabilityEnabled.ts`; test `workspace/hooks/__tests__/useIsCapabilityEnabled.test.ts`

- [ ] **Step 1: Type.** Add `isAutomationsModuleEnabled: boolean;` to ClientConfig.ts next to isCalendarModuleEnabled.
- [ ] **Step 2: Atom.** Create isAutomationsModuleEnabledState.ts mirroring isCalendarModuleEnabledState.ts (Jotai `createAtomState<boolean>`, key `'isAutomationsModuleEnabled'`, `defaultValue: true`).
- [ ] **Step 3: useClientConfig.** Mirror every isCalendarModuleEnabled/setIsCalendarModuleEnabled occurrence for Automations (import, setter, set-on-fetch, useCallback dep array).
- [ ] **Step 4: Mock.** Add `isAutomationsModuleEnabled: true` to mock-data/config.ts.
- [ ] **Step 5: Hook.** In useIsCapabilityEnabled.ts read the new atom unconditionally (`const isAutomationsModuleEnabled = useAtomStateValue(isAutomationsModuleEnabledState);`) and add `[ProductCapabilityKey.AUTOMATIONS]: isAutomationsModuleEnabled,` to `availabilityByCapability`. (The dead `productCapabilityAvailabilityAtoms.ts` registry was removed — do NOT recreate it.)
- [ ] **Step 6: Test.** Extend useIsCapabilityEnabled.test.ts with AUTOMATIONS false/true cases (mirror CALENDAR).
- [ ] **Step 7: Run + typecheck.** `cd packages/twenty-front && npx jest "useIsCapabilityEnabled"` PASS; `npx nx typecheck twenty-front` PASS. Verify `git status` clean after commit (mock committed).
- [ ] **Step 8: Commit.** `git commit -m "feat(front): resolve Automations module availability from clientConfig deploy flag"`

---

### Task 6: Hide the `workflow` object from object-nav when the flag is off

**Files:**
- `packages/twenty-front/src/modules/object-metadata/constants/objectNameToCapabilityKey.ts`
- `packages/twenty-front/src/modules/object-metadata/hooks/useFilteredObjectMetadataItems.ts`
- Test: `packages/twenty-front/src/modules/object-metadata/hooks/__tests__/useFilteredObjectMetadataItems.test.tsx`

- [ ] **Step 1: Mapping.** In objectNameToCapabilityKey.ts add `workflow: ProductCapabilityKey.AUTOMATIONS,` to `OBJECT_NAME_TO_CAPABILITY_KEY` (alongside the existing `dashboard: ProductCapabilityKey.DASHBOARDS`).
- [ ] **Step 2: Generalize the hook.** useFilteredObjectMetadataItems.ts currently reads only `isDashboardsAvailable` and builds `unavailableObjectNames` inside an `if (!isDashboardsAvailable)`. Generalize it so it also handles AUTOMATIONS (and any future entry) without a per-capability `if`:
```ts
  const isDashboardsAvailable = useIsCapabilityEnabled(ProductCapabilityKey.DASHBOARDS);
  const isAutomationsAvailable = useIsCapabilityEnabled(ProductCapabilityKey.AUTOMATIONS);

  const unavailableObjectNames = useMemo(() => {
    // Map each object-backed capability to whether it is available on this deploy.
    const availabilityByCapability: Partial<Record<ProductCapabilityKey, boolean>> = {
      [ProductCapabilityKey.DASHBOARDS]: isDashboardsAvailable,
      [ProductCapabilityKey.AUTOMATIONS]: isAutomationsAvailable,
    };

    const names = new Set<string>();
    Object.entries(OBJECT_NAME_TO_CAPABILITY_KEY).forEach(
      ([objectName, capabilityKey]) => {
        if (availabilityByCapability[capabilityKey] === false) {
          names.add(objectName);
        }
      },
    );
    return names;
  }, [isDashboardsAvailable, isAutomationsAvailable]);
```
Keep the rest (the two active-list filters already use `!unavailableObjectNames.has(nameSingular)`). Both hooks are called unconditionally at top level.
- [ ] **Step 3: Test.** Extend useFilteredObjectMetadataItems.test.tsx: seed a `workflow` object (nameSingular 'workflow', isActive:true, isSystem:false) — check the mock-objects fixture already has one; if not, the existing test harness seeds objects, add it. With `isAutomationsModuleEnabledState=false` assert the active lists EXCLUDE `workflow` (and a normal object remains); with true, INCLUDED. Keep the existing dashboard cases green.
- [ ] **Step 4: Run + typecheck + lint.** `cd packages/twenty-front && npx jest "useFilteredObjectMetadataItems"` PASS; `npx nx typecheck twenty-front` PASS; `npx nx lint:diff-with-main twenty-front` PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(front): hide Workflow object from nav when Automations deploy-disabled"`

---

### Task 7: Integration test (enabled path)

**Files:** Create `packages/twenty-server/test/integration/graphql/suites/settings-permissions/automations-capability-availability.integration-spec.ts`

- [ ] **Step 1: Integration test.** Mirror `calendar-capability-availability.integration-spec.ts` (on main). Default config (`IS_AUTOMATIONS_MODULE_ENABLED` unset → true): call a guarded workflow resolver that is a safe read/no-op — prefer a Query. Candidates: `workflowVersionContent` or `workflowStepConnectedAccountHandle` need args; the simplest guard proof is a mutation that will be rejected for OTHER reasons but NOT with a capability FORBIDDEN. To keep it clean, use `computeStepOutputSchema` (WorkflowBuilderResolver) or, if all workflow resolvers require complex args, assert on the ERROR SHAPE: call the resolver with minimal/empty args and assert the returned error (if any) is NOT the capability `ForbiddenException` message `Module "AUTOMATIONS" is not available on this deployment` (i.e. the availability gate passed; any other validation error is fine). Read the chosen resolver's args first. Top-of-file comment: config-false → FORBIDDEN covered by the generic guard unit test (`capability.guard.spec.ts`); env-only var can't be flipped per-test.
- [ ] **Step 2: Run.** `cd packages/twenty-server && NODE_ENV=test NODE_OPTIONS="--max-old-space-size=6144" npx jest --config ./jest-integration.config.ts automations-capability-availability` — PASS. (If DB not seeded, run once via `npx nx run twenty-server:test:integration:with-db-reset` with the filename appended.) No auth bypass / forged tokens.
- [ ] **Step 3: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 4: Commit.** `git commit -m "test(server): deployment-availability gate for Automations resolvers"`

---

### Task 8: Docs

**Files:** `docs/modular-crm/IMPLEMENTATION-STATUS.md`; `docs/modular-crm/12-MODULE-CATALOG.md`

- [ ] **Step 1: Record the slice.** Mirror the Calendar write-up: add an Automations slice note (IS_AUTOMATIONS_MODULE_ENABLED; object-backed like Dashboards — workflow object hidden from nav; guarded workflow resolvers; the AI-tool-provider capability check; accepted webhook/cron limitation) and update the Automations matrix row. Reference the spec. Note that AUTOMATIONS closed the AI-tool bypass that the Dashboards precedent still leaves open (flag `dashboard-tool.provider.ts` as a follow-up for backfill).
- [ ] **Step 2: Commit.** `git commit -m "docs(modular-crm): record Automations deploy-config gate"`

---

## Self-Review

- **Spec coverage:** config+catalog+effect (T1), workflow resolver guards (T2), AI-tool bypass closed (T3), clientConfig backend (T4) + frontend (T5), object-nav hiding generalized (T6), integration (T7), docs (T8).
- **Object-backed:** mirrors Dashboards — `workflow` hidden via objectNameToCapabilityKey + useFilteredObjectMetadataItems; system children (workflowVersion/Run/AutomatedTrigger) inherit via relation, not independently nav-visible.
- **Beyond a blind mirror:** T3 closes the AI-tool hole that the Dashboards precedent left open; webhook + cron accepted + documented.
- **Zero behavior change:** default true; all atoms default true; guard allows.
- **Type consistency:** `IS_AUTOMATIONS_MODULE_ENABLED` string identical across config var / catalog / clientConfig service. `ProductCapabilityKey.AUTOMATIONS` used as value on FE.
- **No dead-code revival:** do not recreate `productCapabilityAvailabilityAtoms.ts`; do not set FE display `objectBacked` (dormant-only field).
