# Deploy-Config Module Provisioning — AI Assistant slice (final module)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Gate the "AI Assistant" module behind a deploy-time, operator-set, customer-immutable config flag (`IS_AI_ASSISTANT_MODULE_ENABLED`). AI Assistant is NOT object-backed (agent/chat are core-schema entities via dedicated resolvers, not object-metadata) and is entirely AGPL — so this mirrors the settings/nav Email/Calendar pattern: guard the AI-pure resolvers, hide the AI settings nav/route, and hide the Ask-AI trigger surfaces.

**Architecture:** Add the AI_ASSISTANT config flag; catalog `availability.configFlag` (effect stays `{}` — no standard object); guard the 4 AI-pure GraphQL resolvers (AgentChat incl. the streaming Subscription, Agent CRUD, AgentRun) with `@RequireCapability(AI_ASSISTANT)` — this is the enforcement choke point (tools run only through an agent chat, so denying the chat denies tool use); surface the flag on clientConfig; hide the AI settings nav item + route and the Ask-AI trigger surfaces via `useIsCapabilityEnabled`. Reuses the generic guard + `isCapabilityAvailable`.

**Accepted Level A limitations (documented, not fixed):** the shared `ai-generate-text.controller.ts` (`rest/ai`, generic text-gen used by field-AI etc.) and the workflow `ai-agent.workflow-action.ts` (already covered by AUTOMATIONS) are NOT gated on AI_ASSISTANT — they are not AI-Assistant-pure. Background agent-run jobs run only after a resolver-guarded entrypoint created the work.

**Tech Stack:** NestJS + TypeORM (twenty-server), React + Jotai (twenty-front), twenty-config, clientConfig REST, Jest.

## Global Constraints

- Named exports only; no `any`; `//` comments only; Lingui; kebab-case files.
- Do NOT modify any `/* @license Enterprise */` file. (Recon confirmed the AI module is fully AGPL — none present — but still never touch one if encountered.)
- `IS_AI_ASSISTANT_MODULE_ENABLED` default `true` → unconfigured deployment behaves exactly as today. `isEnvOnly: true`.
- Do NOT change the generic guard logic (`capability.guard.ts`) or `isCapabilityAvailable`.
- Do NOT touch the dormant `WorkspaceCapabilityEntity` / mutation / instance command.
- Only guard AI-Assistant-pure resolvers; do NOT gate `ai-generate-text.controller.ts` or the workflow ai-agent action.
- Compose with, do not remove, existing permission guards (PermissionFlagType.AI / AI_SETTINGS) — append CapabilityGuard, keep the rest.
- Commit after each task. No signatures/co-author tags. Only `git add` the files you edit (never `git add -A`, nothing under scratchpad/).
- Reference spec: docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md. Mirror the merged Email/Calendar slices on main.

---

### Task 1: Config var + catalog

**Files:** `config-variables.ts`; both `.env.example`; `product-capability-catalog.constant.ts`

- [ ] **Step 1: Config var.** Mirror `IS_AUTOMATIONS_MODULE_ENABLED` (config-variables.ts) exactly; same group `ConfigVariablesGroup.SERVER_CONFIG`, `isEnvOnly: true`, `ConfigVariableType.BOOLEAN`, `@IsOptional()`, default `true`:
```ts
  @ConfigVariablesMetadata({
    group: ConfigVariablesGroup.SERVER_CONFIG,
    description:
      'Enable the AI Assistant module for this deployment. When false, the AI chat/agent feature is unavailable and hidden for all workspaces on this instance.',
    isEnvOnly: true,
    type: ConfigVariableType.BOOLEAN,
  })
  @IsOptional()
  IS_AI_ASSISTANT_MODULE_ENABLED = true;
```
- [ ] **Step 2: Env docs.** Add `IS_AI_ASSISTANT_MODULE_ENABLED=true` to both `.env.example` files next to `IS_AUTOMATIONS_MODULE_ENABLED`, matching its exact commented/uncommented convention.
- [ ] **Step 3: Catalog.** In product-capability-catalog.constant.ts, the `[ProductCapabilityKey.AI_ASSISTANT]` entry (currently `availability: {}`, `effect: {}`): set `availability: { configFlag: 'IS_AI_ASSISTANT_MODULE_ENABLED' }` and leave `effect: {}` (no standard object). Add a `//` comment mirroring the AUTOMATIONS entry's note (enforcement boundary = the discrete AI resolver guards via @RequireCapability(AI_ASSISTANT); no object effect). Touch ONLY the AI_ASSISTANT entry.
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): add IS_AI_ASSISTANT_MODULE_ENABLED deploy config var"`

---

### Task 2: Guard the AI-pure resolvers with `@RequireCapability(AI_ASSISTANT)`

**Files:**
- `packages/twenty-server/src/engine/metadata-modules/ai/ai-chat/resolvers/agent-chat.resolver.ts` (AgentChatResolver)
- `packages/twenty-server/src/engine/metadata-modules/ai/ai-chat/resolvers/agent-chat-subscription.resolver.ts` (AgentChatSubscriptionResolver)
- `packages/twenty-server/src/engine/metadata-modules/ai/ai-agent/agent.resolver.ts` (AgentResolver)
- `packages/twenty-server/src/engine/metadata-modules/ai/ai-agent-execution/resolvers/agent-run.resolver.ts` (AgentRunResolver)
- Modules (add `ProductCapabilityModule` to `imports`): `ai-chat/ai-chat.module.ts`, `ai-agent/ai-agent.module.ts`, `ai-agent-execution/ai-agent-execution.module.ts`.

**Interfaces:** `CapabilityGuard`, `RequireCapability` (`src/engine/guards/capability.guard.ts`); `ProductCapabilityKey` from `twenty-shared/types`; `ProductCapabilityModule` (`src/engine/core-modules/product-capability/product-capability.module`).

- [ ] **Step 1: Read a merged example** (`src/modules/dashboard/resolvers/dashboard.resolver.ts` or the merged workflow resolvers) for decorator order.
- [ ] **Step 2: Guard each of the 4 resolver classes.** Append `CapabilityGuard` to each class-level `@UseGuards(...)` (keep WorkspaceAuthGuard / UserAuthGuard / SettingsPermissionGuard(AI|AI_SETTINGS) intact and in order), and add `@RequireCapability(ProductCapabilityKey.AI_ASSISTANT)` on EVERY `@Query`/`@Mutation`/`@Subscription` method in that class (per-method — the guard reads handler metadata; class-level @RequireCapability is not seen). Read each file and enumerate the methods:
  - AgentChatResolver: chatThreads, chatThread, chatMessages, chatStreamCatchupChunks, createChatThread, sendChatMessage, retryChatMessage, answerAgentChatQuestion, stopAgentChatStream, renameChatThread, archiveChatThread, unarchiveChatThread, deleteChatThread, deleteQueuedChatMessage, getAiSystemPromptPreview
  - AgentChatSubscriptionResolver: onAgentChatEvent (`@Subscription` — guard it; keep its method-level SettingsPermissionGuard(AI))
  - AgentResolver: findManyAgents, findOneAgent, createOneAgent, updateOneAgent, deleteOneAgent (keep the extra AI_SETTINGS guards on create/update/delete)
  - AgentRunResolver: runAgent
  Do NOT guard `AgentMessagePartResolver.fileUrl` (a `@ResolveField`, not an entrypoint) or `ai-generate-text.controller.ts`.
- [ ] **Step 3: Module imports.** Add `ProductCapabilityModule` to the `imports` of the 3 modules above (if absent).
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): gate AI Assistant module resolvers on deployment availability"`

---

### Task 3: Expose the flag on clientConfig (backend)

**Files:** `client-config.entity.ts`; `services/client-config.service.ts`; `client-config.controller.spec.ts`

- [ ] **Step 1: Entity field.** After `isAutomationsModuleEnabled`:
```ts
  @Field(() => Boolean)
  isAiAssistantModuleEnabled: boolean;
```
- [ ] **Step 2: Populate.** After the `isAutomationsModuleEnabled` populate block:
```ts
      isAiAssistantModuleEnabled: this.twentyConfigService.get(
        'IS_AI_ASSISTANT_MODULE_ENABLED',
      ),
```
- [ ] **Step 3: Controller spec mock.** Add `isAiAssistantModuleEnabled: true` next to `isAutomationsModuleEnabled: true`.
- [ ] **Step 4: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(server): surface IS_AI_ASSISTANT_MODULE_ENABLED on clientConfig"`

---

### Task 4: Wire the flag into frontend clientConfig

**Files:** `client-config/types/ClientConfig.ts`; create `client-config/states/isAiAssistantModuleEnabledState.ts`; `client-config/hooks/useClientConfig.ts`; `testing/mock-data/config.ts`; `workspace/hooks/useIsCapabilityEnabled.ts`; test `workspace/hooks/__tests__/useIsCapabilityEnabled.test.ts`

- [ ] **Step 1: Type.** Add `isAiAssistantModuleEnabled: boolean;` to ClientConfig.ts next to isAutomationsModuleEnabled.
- [ ] **Step 2: Atom.** Create isAiAssistantModuleEnabledState.ts mirroring isAutomationsModuleEnabledState.ts (Jotai `createAtomState<boolean>`, key `'isAiAssistantModuleEnabled'`, `defaultValue: true`).
- [ ] **Step 3: useClientConfig.** Mirror every isAutomationsModuleEnabled/setIsAutomationsModuleEnabled occurrence for AiAssistant (import, setter, set-on-fetch, useCallback dep array).
- [ ] **Step 4: Mock.** Add `isAiAssistantModuleEnabled: true` to mock-data/config.ts.
- [ ] **Step 5: Hook.** In useIsCapabilityEnabled.ts read the new atom unconditionally (`const isAiAssistantModuleEnabled = useAtomStateValue(isAiAssistantModuleEnabledState);`) and add `[ProductCapabilityKey.AI_ASSISTANT]: isAiAssistantModuleEnabled,` to `availabilityByCapability`.
- [ ] **Step 6: Test.** Extend useIsCapabilityEnabled.test.ts with AI_ASSISTANT false/true cases (mirror AUTOMATIONS).
- [ ] **Step 7: Run + typecheck.** `cd packages/twenty-front && npx jest "useIsCapabilityEnabled"` PASS; `npx nx typecheck twenty-front` PASS. Verify `git status` clean after commit (mock committed).
- [ ] **Step 8: Commit.** `git commit -m "feat(front): resolve AI Assistant module availability from clientConfig deploy flag"`

---

### Task 5: Hide the AI settings nav item + route when off

**Files:** `settings/hooks/useSettingsNavigationItems.tsx`; `app/components/SettingsRoutes.tsx`; test (mirror the Email/Calendar wrapper test)

- [ ] **Step 1: Nav item.** In useSettingsNavigationItems.tsx add `const isAiAssistantCapabilityEnabled = useIsCapabilityEnabled(ProductCapabilityKey.AI_ASSISTANT);` next to the existing capability reads (near isEmailCapabilityEnabled/isCalendarCapabilityEnabled). Change ONLY the `AI` nav item (~line 191-196) `isHidden` to `!isAiAssistantCapabilityEnabled || !permissionMap[PermissionFlagType.AI_SETTINGS]` (mirror the Email/Calendar sub-items). Do NOT touch other items.
- [ ] **Step 2: Route.** In SettingsRoutes.tsx, the AI settings routes are wrapped in one `<SettingsProtectedRouteWrapper settingsPermission={PermissionFlagType.AI_SETTINGS} />` (~line 799-804). Add `requiredCapability={ProductCapabilityKey.AI_ASSISTANT}` to that SAME wrapper (it already supports the prop). This gates all AI settings routes at once. (ProductCapabilityKey is already imported in this file.)
- [ ] **Step 3: Test.** Extend/add a focused test asserting the wrapper redirects when `requiredCapability={AI_ASSISTANT}` and isAiAssistantModuleEnabledState=false, renders when true (mirror the merged SettingsProtectedRouteWrapper.test.tsx EMAIL/CALENDAR cases). Seed the Jotai atom.
- [ ] **Step 4: Run + typecheck + lint.** New test PASS; `npx nx typecheck twenty-front` PASS; `npx nx lint:diff-with-main twenty-front` PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(front): hide AI settings nav/route when AI Assistant deploy-disabled"`

---

### Task 6: Hide the Ask-AI trigger surfaces when off

**Files (read each first — gate with `useIsCapabilityEnabled(ProductCapabilityKey.AI_ASSISTANT)`):**
- `packages/twenty-front/src/modules/side-panel/components/SidePanelTopBarRightCornerIcon.tsx` (the new-chat / Ask-AI trigger icon — hide it when unavailable)
- `packages/twenty-front/src/modules/command-menu/hooks/useCommandMenuHotKeys.ts` (the hotkey that opens Ask AI — make the open path a no-op when unavailable)
- `packages/twenty-front/src/modules/side-panel/pages/ask-ai/components/SidePanelAskAiPage.tsx` (defense: render an unavailable/empty state or nothing when the module is off, so a stale route/state cannot show the chat)

**Interfaces:** `useIsCapabilityEnabled(ProductCapabilityKey.AI_ASSISTANT)`.

- [ ] **Step 1: Gate the trigger icon.** In SidePanelTopBarRightCornerIcon.tsx, call `const isAiAssistantEnabled = useIsCapabilityEnabled(ProductCapabilityKey.AI_ASSISTANT);` at the top and return `null` (or skip rendering the Ask-AI icon) when false. Read the file to place it correctly without breaking other icons it may render.
- [ ] **Step 2: Gate the hotkey.** In useCommandMenuHotKeys.ts, guard the "open Ask AI" handler so it does nothing when `useIsCapabilityEnabled(ProductCapabilityKey.AI_ASSISTANT)` is false (early return in the handler; keep the hook registration unconditional to respect hooks rules).
- [ ] **Step 3: Defense on the page.** In SidePanelAskAiPage.tsx, if the module is unavailable, render nothing / a minimal unavailable state (do not call chat hooks that would hit the now-guarded resolvers). Keep any hooks unconditional (call useIsCapabilityEnabled at top, branch on the return for render).
- [ ] **Step 4: Test.** Add a focused test for the most testable surface (prefer the icon component: renders the Ask-AI trigger when AI_ASSISTANT enabled, hides it when disabled; seed isAiAssistantModuleEnabledState). If a surface is impractical to unit test cleanly, note it in the report and cover the icon at minimum.
- [ ] **Step 5: Run + typecheck + lint.** Test PASS; `npx nx typecheck twenty-front` PASS; `npx nx lint:diff-with-main twenty-front` PASS.
- [ ] **Step 6: Commit.** `git commit -m "feat(front): hide Ask-AI trigger surfaces when AI Assistant deploy-disabled"`

---

### Task 7: Integration test (enabled path)

**Files:** Create `packages/twenty-server/test/integration/graphql/suites/settings-permissions/ai-assistant-capability-availability.integration-spec.ts`

- [ ] **Step 1: Integration test.** Mirror `automations-capability-availability.integration-spec.ts` (on main). Default config (`IS_AI_ASSISTANT_MODULE_ENABLED` unset → true): call a guarded AI resolver whose args are simplest and whose non-capability failure is distinct from the capability FORBIDDEN — prefer a Query like `chatThreads` (AgentChatResolver, likely no required args) or `findManyAgents` (AgentResolver). Read the resolver to confirm args. Assert `response.body.errors` has no entry with the exact message `Module "AI_ASSISTANT" is not available on this deployment` (the availability gate passed; other errors acceptable; empty result fine). Top-of-file comment: config-false → FORBIDDEN covered by the generic guard unit test (capability.guard.spec.ts); env-only var can't be flipped per-test.
- [ ] **Step 2: Run.** `cd packages/twenty-server && NODE_ENV=test NODE_OPTIONS="--max-old-space-size=6144" npx jest --config ./jest-integration.config.ts ai-assistant-capability-availability` — PASS. (If DB not seeded, run once via `npx nx run twenty-server:test:integration:with-db-reset` with the filename appended.) If a DI/circular-dependency boot error appears (the 3 new module imports), report it VERBATIM. No auth bypass / forged tokens.
- [ ] **Step 3: Typecheck.** `npx nx typecheck twenty-server` — PASS.
- [ ] **Step 4: Commit.** `git commit -m "test(server): deployment-availability gate for AI Assistant resolvers"`

---

### Task 8: Docs

**Files:** `docs/modular-crm/IMPLEMENTATION-STATUS.md`; `docs/modular-crm/12-MODULE-CATALOG.md`

- [ ] **Step 1: Record the slice.** Mirror the Automations write-up: add an AI Assistant slice note (IS_AI_ASSISTANT_MODULE_ENABLED; settings/nav-gated, not object-backed; guarded AI resolvers incl. the streaming subscription; hidden AI settings nav/route + Ask-AI trigger surfaces; accepted shared ai-generate-text/workflow-ai-agent limitation) and update the AI Assistant matrix row. Note this COMPLETES the modular-CRM rollout (Dashboards/Email/Calendar/Automations/AI Assistant all deploy-config gated). Reference the spec.
- [ ] **Step 2: Commit.** `git commit -m "docs(modular-crm): record AI Assistant deploy-config gate"`

---

## Self-Review

- **Spec coverage:** config+catalog (T1), AI resolver guards incl. subscription (T2), clientConfig backend (T3) + frontend (T4), settings nav/route hide (T5), Ask-AI trigger hide (T6), integration (T7), docs (T8).
- **Not object-backed:** no objectNameToCapabilityKey/useFilteredObjectMetadataItems change (agent/chat are core-schema, not object-metadata).
- **Choke point:** guarding AgentChat/AgentRun denies the assistant entrypoints; tools run only through an agent, so no separate tool-registry gate needed.
- **Zero behavior change:** default true; all atoms default true; guard allows.
- **Type consistency:** `IS_AI_ASSISTANT_MODULE_ENABLED` string identical across config var / catalog / clientConfig service. `ProductCapabilityKey.AI_ASSISTANT` used as value on FE.
- **Scope discipline:** shared ai-generate-text controller + workflow ai-agent action NOT gated on AI_ASSISTANT (accepted). No Enterprise file touched.
