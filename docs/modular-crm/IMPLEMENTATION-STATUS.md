# Implementation Status

Phase: **FOUNDATION BUILT + integration-verified** on branch `feat/product-capability-layer` (7 commits, final whole-branch review: READY TO MERGE, zero-behavior-change invariant verified). Object-backed enforcement go/no-go RESOLVED (isActive is not a schema boundary → guard-only). Remaining: Settings UI + per-capability migration (Dashboards → Email/Calendar/Automations/AI).

## Pivot: deploy-config availability model (branch `feat/deploy-config-module-provisioning`)

Availability is now resolved from **deploy-time, operator-set, customer-immutable config flags** — `IS_<MODULE>_MODULE_ENABLED` (e.g. `IS_DASHBOARDS_MODULE_ENABLED`), declared in `config-variables.ts` with `isEnvOnly: true` (env-only, no admin-panel/DB override) and default `true` (unconfigured deployment = today's behavior). `WorkspaceCapabilityService.isCapabilityAvailable(key)` resolves via the catalog's `availability.configFlag` through `TwentyConfigService`, and the `@RequireCapability` guard now checks this **deployment-scoped** availability, not the per-workspace DB toggle. The flag is surfaced on `ClientConfig.isDashboardsModuleEnabled`; the frontend hides the module accordingly (object-nav filtering in `useFilteredObjectMetadataItems`), and Settings → Features is now a **read-only** "Your modules" view.

The per-workspace `WorkspaceCapabilityEntity`, the `updateWorkspaceCapability` mutation, its instance command, and the old Settings toggle described throughout this doc set are now **DORMANT/deprecated** — left in the tree but no longer the gate. Enforcement is Level A (guard denies discrete endpoints + UI hides nav/routes/object-nav; raw object CRUD via the generic dynamic resolver remains technically reachable via hand-crafted GraphQL only — accepted, since deploy is operator-controlled). See [docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md](../superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md).

### Email slice (implemented)

Email is the second deploy-config slice (after Dashboards), following the same pattern: `IS_EMAIL_MODULE_ENABLED` (`isEnvOnly`, default `true`) gates the EMAIL catalog entry's `availability.configFlag`. `@RequireCapability(ProductCapabilityKey.EMAIL)` guards the email-pure resolvers: `MessageChannelResolver` (`myMessageChannels`, `updateMessageChannel`, `createEmailGroupChannel`, `updateEmailGroupChannel`, `deleteEmailGroupChannel`), `MessageFolderResolver` (`myMessageFolders`, `updateMessageFolder`, `updateMessageFolders`), and `SendEmailResolver` (`sendEmail`). `ClientConfig.isEmailModuleEnabled` is surfaced to the frontend, which hides the Emails settings nav sub-item, the `AccountsEmails` settings route (via `SettingsProtectedRouteWrapper`'s `requiredCapability`), and the record timeline `WidgetType.EMAILS` widget when the flag is off.

**Accepted limitation (Level A):** the shared email+calendar plumbing — the Accounts settings section, the IMAP/CalDAV connect flow, the Google/Microsoft OAuth controllers, `ChannelSyncResolver`, `ConnectedAccountResolver`, and the background message-sync cron jobs — is intentionally left reachable when `IS_EMAIL_MODULE_ENABLED=false`, so disabling Email does not break Calendar (which shares the same connected-account infrastructure). Background message-sync crons are not guarded. See [docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md](../superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md).

### Calendar slice (implemented)

Calendar is the third deploy-config slice (after Dashboards and Email), following the same pattern: `IS_CALENDAR_MODULE_ENABLED` (`isEnvOnly`, default `true`) gates the CALENDAR catalog entry's `availability.configFlag`. `@RequireCapability(ProductCapabilityKey.CALENDAR)` guards the calendar-pure resolvers: `CalendarChannelResolver` (`myCalendarChannels`, `updateCalendarChannel`) and `CreateCalendarEventResolver` (`createCalendarEvent`). `ClientConfig.isCalendarModuleEnabled` is surfaced to the frontend, which hides the Calendars settings nav sub-item, the `AccountsCalendars` settings route (via `SettingsProtectedRouteWrapper`'s `requiredCapability`), and the record timeline `WidgetType.CALENDAR` widget when the flag is off. Hardening: the `myCalendarChannels` query is skipped client-side when Calendar is off (`useMyCalendarChannels` and `SettingsAccountsConfiguration`'s calendar query).

**Accepted limitation (Level A):** the same shared email+calendar plumbing — the Accounts settings section, the IMAP/CalDAV connect flow, the Google/Microsoft OAuth controllers, `ChannelSyncResolver`, `ConnectedAccountResolver` — is intentionally left reachable when `IS_CALENDAR_MODULE_ENABLED=false`, so disabling Calendar does not break Email. `TimelineCalendarEventResolver` (the Activities timeline's calendar-event surface) is intentionally **not** gated on CALENDAR. See [docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md](../superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md).

### Automations slice (implemented)

Automations is the fourth deploy-config slice (after Dashboards, Email, and Calendar), and the first **object-backed** slice since Dashboards: `IS_AUTOMATIONS_MODULE_ENABLED` (`isEnvOnly`, default `true`) gates the AUTOMATIONS catalog entry's `availability.configFlag` and its `effect.objectStandardIds: [workflow]`. Like Dashboards, the `workflow` root object is hidden from object-nav when the flag is off, via the generalized `objectNameToCapabilityKey` mapping in `useFilteredObjectMetadataItems`; the system child objects `workflowVersion`, `workflowRun`, and `workflowAutomatedTrigger` are not independently nav-visible and stay reachable only via relations off `workflow`. `@RequireCapability(ProductCapabilityKey.AUTOMATIONS)` guards all 21 `@Query`/`@Mutation` methods across the five workflow resolvers (`WorkflowTriggerResolver`, `WorkflowVersionResolver`, `WorkflowVersionStepResolver`, `WorkflowVersionEdgeResolver`, `WorkflowBuilderResolver`). Automations also closes the AI-tool bypass the Dashboards precedent left open: `WorkflowToolProvider.isAvailable` now checks `isCapabilityAvailable(AUTOMATIONS)`, so the 21 chat-invoked workflow AI tools are unavailable when the module is off. `ClientConfig.isAutomationsModuleEnabled` is surfaced to the frontend via an FE atom + `useIsCapabilityEnabled`.

**Accepted limitation (Level A):** the unauthenticated webhook trigger controller (`workflow-trigger.controller.ts`, behind `PublicEndpointGuard`) and the background cron/async workflow-run infrastructure are not capability-guarded — when the module is deploy-off, no workflows exist to trigger, and deploy is operator-controlled. Mirrors the accepted background-cron limitation already documented for Email/Calendar. See [docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md](../superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md).

**FOLLOW-UP:** the Dashboards slice left the same AI-tool bypass open — `dashboard-tool.provider.ts` should get the equivalent `isCapabilityAvailable(DASHBOARDS)` check backfilled.

### AI Assistant slice (implemented)

AI Assistant is the fifth deploy-config slice (after Dashboards, Email, Calendar, and Automations), and — like Email/Calendar — **settings/nav-gated, not object-backed**: `IS_AI_ASSISTANT_MODULE_ENABLED` (`isEnvOnly`, default `true`) gates the AI_ASSISTANT catalog entry's `availability.configFlag` (`effect: {}` — agent/chat are core-schema entities, not object-metadata, so there is no `objectNameToCapabilityKey`/nav-filtering change). `@RequireCapability(ProductCapabilityKey.AI_ASSISTANT)` guards all 23 `@Query`/`@Mutation`/`@Subscription` methods across the five AI resolvers: `AgentChatResolver` (15), `AgentChatSubscriptionResolver` (1, the streaming subscription), `AgentResolver` (5), `AgentRunResolver` (1), `WorkspaceSetupChatResolver` (1, onboarding). This is the enforcement choke point — tools run only through an agent chat, so denying the chat denies tool use; no separate tool-registry gate is needed. `ClientConfig.isAiAssistantModuleEnabled` is surfaced to the frontend via an FE atom + `useIsCapabilityEnabled`. The frontend hides the AI settings nav item and the AI settings route (`SettingsProtectedRouteWrapper`'s `requiredCapability`), and gates the Ask-AI panel open path at its choke-point hook `useOpenAskAiPageInSidePanel` — disabling all Ask-AI triggers (hotkey, new-chat, thread-click, preprompt, handoff, front-component) in one place.

**Accepted limitation (Level A):** the shared `ai-generate-text.controller.ts` (`rest/ai`, generic text-gen also used by field-AI) and the workflow `ai-agent.workflow-action.ts` (covered by AUTOMATIONS instead) are intentionally **not** gated on AI_ASSISTANT — they are not AI-Assistant-pure. Background agent-run jobs run only after a resolver-guarded entrypoint created the work. See [docs/superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md](../superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md).

**This completes the modular-CRM deploy-config rollout:** all five optional modules — Dashboards, Email, Calendar, Automations, and AI Assistant — are now deploy-config gated.

## Foundation

| Item | Status |
|---|---|
| Existing systems investigated & documented | ✅ done ([01](01-EXISTING-TWENTY-FEATURE-SYSTEMS.md), [TWENTY-CURRENT-FEATURE-MATRIX.md](TWENTY-CURRENT-FEATURE-MATRIX.md)) |
| Architecture decision documented (§29) | ✅ done ([IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md), [02](02-ARCHITECTURE.md)) |
| Capability model designed | ✅ done ([03](03-CAPABILITY-MODEL.md)) |
| Module catalog defined | ✅ done ([12](12-MODULE-CATALOG.md)) |
| Object-backed enforcement go/no-go test (§16) | ✅ done — RESOLVED: `isActive` does NOT exclude from GraphQL schema (A false); data preservation + lossless reactivation true (B/C). Decision: guard-only enforcement. |
| `ProductCapabilityKey` enum (shared) | ✅ done (`c072c2e1`) |
| Capability catalog constant + service | ✅ done (`57de90ba` catalog; service same commit) |
| `WorkspaceCapabilityEntity` + instance command | ✅ done (`57de90ba` entity; `7f9312bc` fast instance command, table applied+verified) |
| `WorkspaceCapabilityService` + `capabilitiesMap` cache | ✅ done (`57de90ba`, 14/14 server tests) |
| `currentWorkspace.enabledCapabilities` field | ✅ done (`61fa15b2`; codegen reconciled `8bc8b3e3`) |
| `useIsCapabilityEnabled` hook | ✅ done (`227fdd1c`; 7/7 front tests) |
| `@RequireCapability` guard | ✅ done (`2f4ef115`, defined + unit-tested; not yet applied to any resolver) |
| Settings → Features UI | ⬜ not started |
| Migration/workspace command (seed existing workspaces) | ⬜ not started (next step; `computeForCache` defaults keep unseeded workspaces all-enabled) |

## Per-capability tracking (fill during implementation)

Legend per column: ⬜ todo · 🟡 in progress · ✅ done · n/a.

| Capability | existing arch understood | capability defined | entitlement integ. | workspace config | frontend integ. | route protection | backend enforce | permission integ. | dependency handling | data preservation | tests | docs | remaining issues |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Contacts (core) | ✅ | ⬜ | n/a | ⬜ | ⬜ | n/a | n/a (locked-on) | ✅ existing | n/a | ✅ (never disabled) | ⬜ | ✅ | locked-on |
| Companies (core) | ✅ | ⬜ | n/a | ⬜ | ⬜ | n/a | n/a (locked-on) | ✅ | n/a | ✅ | ⬜ | ✅ | locked-on |
| Deals (core) | ✅ | ⬜ | n/a | ⬜ | ⬜ | n/a | n/a (locked-on) | ✅ | dep: Companies/Contacts (core) | ✅ | ⬜ | ✅ | locked-on |
| Activities (core) | ✅ | ⬜ | n/a | ⬜ | ⬜ | n/a | n/a (locked-on) | ✅ | n/a | ✅ | ⬜ | ✅ | locked-on |
| Dashboards | ✅ | ⬜ | n/a | ⬜ | ⬜ | via isActive | @RequireCapability | ✅ | dep: CRM | ⬜ | ⬜ | ✅ | first migration candidate |

Enforcement is uniform `@RequireCapability`; `isActive` = UI-hide + data preservation only (go/no-go resolved: `isActive` does not exclude an object from the GraphQL schema).
| Email | ✅ | ✅ | n/a (config) | n/a (dormant) | ✅ | ✅ | @RequireCapability ✅ | ✅ | dep: Contacts | n/a (non-object) | ✅ | ✅ | done — Level A: shared Accounts/OAuth/ChannelSync plumbing intentionally reachable (Calendar dependency) |
| Calendar | ✅ | ✅ | n/a (config) | n/a (dormant) | ✅ | ✅ | @RequireCapability ✅ | ✅ | dep: Activities | n/a (non-object) | ✅ | ✅ | done — Level A: shared Accounts/OAuth/ChannelSync plumbing intentionally reachable (Email dependency); TimelineCalendarEventResolver intentionally left ungated |
| Automations | ✅ | ✅ | n/a (config) | n/a (dormant) | ✅ | ✅ | @RequireCapability ✅ | ✅ | dep: CRM | ✅ (guard-only; isActive unaffected) | ✅ | ✅ | done — object-backed (`workflow` hidden from nav like Dashboards); 21 resolver methods guarded across 5 resolvers; AI-tool bypass closed (`WorkflowToolProvider`); Level A: webhook trigger + background cron intentionally left ungated (operator-controlled) |
| AI Assistant | ✅ | ✅ | n/a (config) | n/a (dormant) | ✅ | ✅ | @RequireCapability ✅ | ✅ | — | n/a (non-object) | ✅ | ✅ | done — settings/nav-gated, not object-backed (agent/chat are core-schema); 23 resolver methods guarded across 5 resolvers incl. streaming subscription; Ask-AI choke-point gate (`useOpenAskAiPageInSidePanel`); Level A: shared `ai-generate-text` controller + workflow `ai-agent` action intentionally left ungated |
| Products (future) | ✅ | ⬜ | — | — | — | — | — | — | dep: Deals | — | — | ✅ | object not built |
| Reports (future) | ✅ | ⬜ | — | — | — | — | — | — | dep: CRM | — | — | ✅ | not built |

## Next steps (prioritized)
1. Validate this plan against the codebase with stakeholders (checkpoint before code).
2. Run the **object-backed enforcement go/no-go test** ([16](16-TESTING.md)) — decides object-backed vs guard-only.
3. Build the foundation (enum + catalog + entity + service + cache + guard + field + hook), all default-enabled (no behavior change).
4. Migrate **Dashboards** first (object-backed, isolated) end-to-end; verify the full checklist.
5. Build Settings → Features UI.
6. Migrate Email → Calendar → Automations → AI.
