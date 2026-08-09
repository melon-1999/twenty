# 16 — Testing

Test scenarios mapped to the three-gate model (§33). Follow Twenty's test setup (jest unit, integration with DB reset, Playwright E2E — codebase-analysis/18).

## Scenario matrix

| # | Scenario | Expected |
|---|---|---|
| 1 | Available + Enabled + Authorized | feature visible + usable |
| 2 | Available + Enabled + **no permission** | hidden/denied for that user; other authorized users unaffected |
| 3 | Available + **Disabled** | hidden everywhere (nav, routes, command menu, settings); backend denies |
| 4 | **Not available** (missing entitlement/config) | cannot be enabled; shown as unavailable |
| 5 | Different workspaces, different config | isolated — workspace A off, workspace B on, no cross-effect |
| 6 | Dependency handling | cannot enable X with dep off (prompted); cannot disable dep with dependent on; no invalid state |
| 7 | Data preservation | disable → rows remain; re-enable → prior data accessible |
| 8 | Existing-workspace migration | safe defaults; previously-usable capabilities stay enabled |
| 9 | All-enabled compatibility | with every capability enabled, behavior == current Twenty |

## Backend (unit + integration)

- `WorkspaceCapabilityService`: enable/disable, availability gate (`hasEntitlement` mock + billing-off true), dependency validation (enable/disable prompts, cycle rejection), core-cannot-disable, cache invalidation on toggle.
- `@RequireCapability` guard: allows when enabled, `ForbiddenException` when disabled, composes with permission guard (scenario 2 + 3).
- **Object-backed enforcement (critical assumption):** integration test that deactivating a standard object (a) removes its root fields from the workspace GraphQL schema, (b) makes its CRUD resolvers unavailable/deny, (c) **keeps its table + rows**, (d) reactivation restores schema + data losslessly. If any fails, object-backed capabilities must fall back to guard-based gating — this test is a go/no-go for that mechanism.
- Migration command: idempotent; seeds correct enabled state from current `isActive`/availability; isolated per workspace.

## Frontend (jest + storybook)

- `useIsCapabilityEnabled` returns correct value from `currentWorkspace.enabledCapabilities`.
- Settings-nav item `isHidden` respects capability + permission + config.
- `SettingsProtectedRouteWrapper` with `requiredCapability` redirects when disabled.
- Command-menu predicate: item on disabled capability drops out.
- Object-backed: with the object inactive, nav list / quick-create picker exclude it (reuse existing `useFilteredObjectMetadataItems` tests).

## E2E (Playwright)

- Toggle a capability in Settings → Features → verify nav/route/command-menu disappearance and reappearance; verify data intact after off→on.
- Two-workspace isolation.

## Security tests (§35)

- Disabled non-object capability: direct GraphQL/REST call to its resolver → denied (not just UI-hidden).
- Disabled object-backed capability: direct query for its records → unavailable (schema absence).
- Background job / workflow action for a disabled capability → does not execute.
- No stale-enable window after toggle (cache invalidation).
