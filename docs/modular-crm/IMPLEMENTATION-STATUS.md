# Implementation Status

Phase: **PLAN / DECISION documented. No application code changed.** Implementation (§30–31) begins only after this plan is validated.

## Foundation

| Item | Status |
|---|---|
| Existing systems investigated & documented | ✅ done ([01](01-EXISTING-TWENTY-FEATURE-SYSTEMS.md), [TWENTY-CURRENT-FEATURE-MATRIX.md](TWENTY-CURRENT-FEATURE-MATRIX.md)) |
| Architecture decision documented (§29) | ✅ done ([IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md), [02](02-ARCHITECTURE.md)) |
| Capability model designed | ✅ done ([03](03-CAPABILITY-MODEL.md)) |
| Module catalog defined | ✅ done ([12](12-MODULE-CATALOG.md)) |
| `ProductCapabilityKey` enum (shared) | ⬜ not started (impl) |
| Capability catalog constant + service | ⬜ not started |
| `WorkspaceCapabilityEntity` + instance command | ⬜ not started |
| `WorkspaceCapabilityService` + `capabilitiesMap` cache | ⬜ not started |
| `currentWorkspace.enabledCapabilities` field | ⬜ not started |
| `useIsCapabilityEnabled` hook | ⬜ not started |
| `@RequireCapability` guard | ⬜ not started |
| Settings → Features UI | ⬜ not started |
| Object-backed enforcement go/no-go test (§16) | ⬜ not started (blocks object-backed path) |
| Migration/workspace command | ⬜ not started |

## Per-capability tracking (fill during implementation)

Legend per column: ⬜ todo · 🟡 in progress · ✅ done · n/a.

| Capability | existing arch understood | capability defined | entitlement integ. | workspace config | frontend integ. | route protection | backend enforce | permission integ. | dependency handling | data preservation | tests | docs | remaining issues |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Contacts (core) | ✅ | ⬜ | n/a | ⬜ | ⬜ | n/a | via schema | ✅ existing | n/a | ✅ (never disabled) | ⬜ | ✅ | locked-on |
| Companies (core) | ✅ | ⬜ | n/a | ⬜ | ⬜ | n/a | via schema | ✅ | n/a | ✅ | ⬜ | ✅ | locked-on |
| Deals (core) | ✅ | ⬜ | n/a | ⬜ | ⬜ | n/a | via schema | ✅ | dep: Companies/Contacts (core) | ✅ | ⬜ | ✅ | locked-on |
| Activities (core) | ✅ | ⬜ | n/a | ⬜ | ⬜ | n/a | via schema | ✅ | n/a | ✅ | ⬜ | ✅ | locked-on |
| Dashboards | ✅ | ⬜ | n/a | ⬜ | ⬜ | via isActive | via schema | ✅ | dep: CRM | ⬜ | ⬜ | ✅ | first migration candidate |
| Email | ✅ | ⬜ | n/a (config) | ⬜ | ⬜ | ⬜ | @RequireCapability | ✅ | dep: Contacts | ⬜ | ⬜ | ✅ | config availability |
| Calendar | ✅ | ⬜ | n/a (config) | ⬜ | ⬜ | ⬜ | @RequireCapability | ✅ | dep: Activities | ⬜ | ⬜ | ✅ | |
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
