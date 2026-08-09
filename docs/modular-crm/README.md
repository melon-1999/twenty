# Modular CRM — Architecture & Plan

Turning Twenty into a CRM where **each workspace uses only the functionality it needs**, by adding one small **product-capability layer** on top of Twenty's existing systems — not a second feature system.

**Status: planning/decision documented. No application code changed yet.** The task gates implementation behind a validated decision; this folder is that decision.

## Read order

1. [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) — the decision doc (start here).
2. [01-EXISTING-TWENTY-FEATURE-SYSTEMS.md](01-EXISTING-TWENTY-FEATURE-SYSTEMS.md) + [TWENTY-CURRENT-FEATURE-MATRIX.md](TWENTY-CURRENT-FEATURE-MATRIX.md) — what Twenty already has.
3. [02-ARCHITECTURE.md](02-ARCHITECTURE.md) + [03-CAPABILITY-MODEL.md](03-CAPABILITY-MODEL.md) — the design.
4. [12-MODULE-CATALOG.md](12-MODULE-CATALOG.md) + [TARGET-CAPABILITY-MATRIX.md](TARGET-CAPABILITY-MATRIX.md) — the capabilities + end state.
5. The rest (04–17) — one concern each.

## Index

| Doc | Topic |
|---|---|
| [01](01-EXISTING-TWENTY-FEATURE-SYSTEMS.md) | Existing feature/pricing/app/permission systems |
| [02](02-ARCHITECTURE.md) | Architecture + differences from prompt examples |
| [03](03-CAPABILITY-MODEL.md) | Capability model (the new abstraction) |
| [04](04-PLANS-AND-ENTITLEMENTS.md) | Plans & entitlements |
| [05](05-WORKSPACE-CONFIGURATION.md) | Per-workspace enabled state |
| [06](06-FEATURE-FLAGS.md) | Feature flags vs capabilities |
| [07](07-APPS-AND-MODULES.md) | Apps vs capabilities |
| [08](08-FRONTEND-INTEGRATION.md) | Nav/routes/settings/command-menu |
| [09](09-BACKEND-ENFORCEMENT.md) | Backend enforcement |
| [10](10-DEPENDENCIES.md) | Dependencies |
| [11](11-PERMISSIONS.md) | Permissions (separate axis) |
| [12](12-MODULE-CATALOG.md) | The capability catalog |
| [13](13-SETTINGS-UX.md) | Settings → Features UI |
| [14](14-DATA-PRESERVATION.md) | Disable preserves data |
| [15](15-MIGRATION-STRATEGY.md) | Migration |
| [16](16-TESTING.md) | Testing |
| [17](17-UPSTREAM-UPGRADE-STRATEGY.md) | Upstream compatibility |
| [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | Decision + sequence |
| [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md) | Progress tracker |
| [TWENTY-CURRENT-FEATURE-MATRIX.md](TWENTY-CURRENT-FEATURE-MATRIX.md) | Before |
| [TARGET-CAPABILITY-MATRIX.md](TARGET-CAPABILITY-MATRIX.md) | After |

---

## Architecture decision (§29)

- **Did Twenty already have a usable module/feature architecture? — PARTIALLY.** Two per-workspace boolean systems (feature flags = experiments/Lab; billing entitlements = commercial, 4 keys, `@license Enterprise`), a per-workspace data-preserving object-hide lever (`ObjectMetadata.isActive`), an app-bundle ownership boundary (core CRM = the "Standard" app), a per-user permission model, and instance-scoped deployment config. **None is a product-capability catalog.**
- **Foundation we build on:** object `isActive` (UI-hide + data preservation only; enforcement is `@RequireCapability`) for object-backed capabilities; `hasEntitlement` + clientConfig for availability (consumed, not modified); roles/permission flags for authorization (unchanged); the `enabledAiModelIds`/`FeatureFlagEntity` patterns for storage/cache/hook.
- **New layer? — Yes, one small one** (Option C+D hybrid): a code **capability catalog** + per-workspace **enabled store** + resolver + hook + guard + settings UI, coordinating existing systems. Existing ones were insufficient (experiment semantics / commercial-only / destructive apps / object-granular).
- **Plans and modules share capability definitions? — No.** Availability optionally references an entitlement key; enabled state is separate. Future plans map without a rewrite.
- **Permissions separate? — Yes** (per-user, untouched).
- **Apps separate? — Yes** (install/uninstall; core capabilities are not installable apps, though they toggle app-owned objects).

## Final report (§44)

- **What Twenty already had:** see the decision above / [01](01-EXISTING-TWENTY-FEATURE-SYSTEMS.md).
- **Reused:** object `isActive` (UI-hide + data preservation only) + metadata-driven nav/command-menu; `hasEntitlement`/clientConfig (availability); roles/permissions; feature-flag storage/cache/guard/hook *patterns*; `enabledAiModelIds` precedent; the upgrade-command framework.
- **Extended (small in-place edits):** `currentWorkspace` (+`enabledCapabilities`), workspace cache key list, settings-nav hook, `SettingsProtectedRouteWrapper`, one command-menu predicate, workspace creation. ([17](17-UPSTREAM-UPGRADE-STRATEGY.md))
- **Added (new):** `ProductCapabilityKey` + catalog + `WorkspaceCapabilityEntity` + service + `capabilitiesMap` + `@RequireCapability` + `useIsCapabilityEnabled` + Settings → Features.
- **Why new was necessary:** no existing system is a permanent, human-meaningful, dependency-aware, per-workspace product-module catalog.
- **Final capability flow:** availability (billing/config) → enabled (workspace capability + deps) → authorized (user role) → usable; downstream: UI via `isActive`; enforcement via `@RequireCapability` (uniform for object-backed and guarded).
- **Capabilities identified (real):** Core — Contacts, Companies, Deals, Activities. Optional — Dashboards, Email, Calendar, Automations, AI Assistant. Future (not built) — Products, Reports. Decided-out — Leads (use a pipeline stage). Commercial (availability-only) — SSO, Custom domain, RLS, Audit logs. ([12](12-MODULE-CATALOG.md))
- **Core (mandatory):** Contacts/Companies/Deals/Activities + all infrastructure ([12](12-MODULE-CATALOG.md) "not capabilities").
- **Existing pricing tiers found:** PRO, ENTERPRISE; 4 entitlements; Stripe-synced prices; self-hosted bypass. ([04](04-PLANS-AND-ENTITLEMENTS.md))
- **Upstream files modified (unavoidable):** the ~9 in [17](17-UPSTREAM-UPGRADE-STRATEGY.md); **no `@license Enterprise` files**.
- **Upgrade risk:** low overall; `isActive` dependency reduced — go/no-go RESOLVED (A false, B/C true): enforcement is `@RequireCapability`, not `isActive` schema semantics (test in [16](16-TESTING.md)).
- **Remaining non-modular functionality:** core infra (never optional); commercial entitlements stay in the billing path.
- **Recommended next steps:** validate plan → build foundation (default-enabled, no behavior change) → migrate Dashboards first → Settings UI → Email/Calendar/Automations/AI.

## Verification questions (§43) — answered by the design

1. Reuse existing infra? **Yes** — `isActive`, `hasEntitlement`, roles, cache/guard/hook patterns. 2. Avoid duplicate feature systems? **Yes** — one thin layer, feature flags/billing untouched. 3. Per-workspace config? **Yes** ([05](05-WORKSPACE-CONFIGURATION.md)). 4. Plans control availability independently? **Yes** ([04](04-PLANS-AND-ENTITLEMENTS.md)). 5. Availability vs enabled distinguishable? **Yes** (three gates). 6. Permissions separate? **Yes** ([11](11-PERMISSIONS.md)). 7. Apps separated? **Yes** ([07](07-APPS-AND-MODULES.md)). 8–10. Nav/routes/backend respond? **Yes** ([08](08-FRONTEND-INTEGRATION.md), [09](09-BACKEND-ENFORCEMENT.md)). 11. Dependencies centralized? **Yes** ([10](10-DEPENDENCIES.md)). 12. Isolation? **Yes** (`workspaceId`-scoped). 13–14. Data preserved + re-enable? **Yes** ([14](14-DATA-PRESERVATION.md)). 15. Safe migration? **Yes** ([15](15-MIGRATION-STRATEGY.md)). 16. All-enabled == Twenty today? **Yes** (compatibility baseline). 17. New modules easy? **Yes** (one catalog entry). 18. Checks centralized? **Yes** (catalog + one hook/guard). 19. Core changes minimized? **Yes** ([17](17-UPSTREAM-UPGRADE-STRATEGY.md)). 20. Reduces SMB complexity? **Yes** (Settings → Features hides unused areas). 21. Future tiers reuse the model? **Yes** ([04](04-PLANS-AND-ENTITLEMENTS.md)).

---

*Nothing implemented. This is research → decision → plan, for review before building. Illustrative module names in the original brief were not followed literally — capabilities were derived from actual Twenty functionality (e.g. Leads/Products were dropped/deferred because no such objects exist today). See [02](02-ARCHITECTURE.md) "Differences from prompt examples".*
