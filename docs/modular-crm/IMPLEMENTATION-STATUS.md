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
| Automations | ✅ | ⬜ | n/a | ⬜ | ⬜ | ⬜ | @RequireCapability | ✅ | dep: CRM | ⬜ | ⬜ | ✅ | |
| AI Assistant | ✅ | ⬜ | n/a (config) | ⬜ | ⬜ | ⬜ | @RequireCapability | ✅ | — | ⬜ | ⬜ | ✅ | |
| Products (future) | ✅ | ⬜ | — | — | — | — | — | — | dep: Deals | — | — | ✅ | object not built |
| Reports (future) | ✅ | ⬜ | — | — | — | — | — | — | dep: CRM | — | — | ✅ | not built |

## Next steps (prioritized)
1. Validate this plan against the codebase with stakeholders (checkpoint before code).
2. Run the **object-backed enforcement go/no-go test** ([16](16-TESTING.md)) — decides object-backed vs guard-only.
3. Build the foundation (enum + catalog + entity + service + cache + guard + field + hook), all default-enabled (no behavior change).
4. Migrate **Dashboards** first (object-backed, isolated) end-to-end; verify the full checklist.
5. Build Settings → Features UI.
6. Migrate Email → Calendar → Automations → AI.
