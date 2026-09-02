# Opportunity Monthly Goal (Sales Target) — Design

Date: 2026-09-01
Status: Approved (pending user spec review)
Sub-project 9 of the Pipedrive-semantics track. Workspace monthly revenue target + progress.

## Goal

A workspace-wide monthly revenue target, with progress measured as the sum of won-deal
amounts closed in the current month, plus a short month history. Answers "are we on track
to hit this month's number?".

Scope is deliberately small (per the brainstorm): one target for the whole workspace, per
month, progress = actual won revenue. Per-member goals, quarterly/yearly targets, and
weighted-forecast progress are explicit non-goals.

## Architecture

- **Backend config:** the monthly target is stored as a workspace KeyValuePair (a
  CONFIG_VARIABLE), exposed via a GraphQL query + mutation — mirroring the existing
  `OpportunityProbabilityConfig` service/resolver exactly (same `KeyValuePairService`
  pattern, same guards).
- **Settings page:** a single number input to set the monthly target, mirroring the
  Probability / Rotting settings pages.
- **Goals page:** client-side aggregation of won deals against the target — a pure util
  (TDD) + a table/progress page, mirroring the merged report pages.

## 1. Backend config (mirror of the probability config)

New files under `packages/twenty-server/src/modules/opportunity/`:

- `types/opportunity-monthly-goal-key-value.type.ts`:
  ```ts
  export const OPPORTUNITY_MONTHLY_GOAL_KEY = 'OPPORTUNITY_MONTHLY_GOAL';
  // Target revenue for one month, in major currency units (e.g. 100000 = 100k).
  export type OpportunityMonthlyGoal = { targetAmount: number };
  export type OpportunityMonthlyGoalKeyValueTypeMap = {
    [OPPORTUNITY_MONTHLY_GOAL_KEY]: OpportunityMonthlyGoal;
  };
  ```
- `services/opportunity-monthly-goal-config.service.ts`: `getMonthlyGoal(workspaceId):
  Promise<OpportunityMonthlyGoal | null>` (returns `null` when unset — NO default target)
  and `setMonthlyGoal(workspaceId, config): Promise<OpportunityMonthlyGoal>`, using
  `KeyValuePairService` with `type: CONFIG_VARIABLE`, `key: OPPORTUNITY_MONTHLY_GOAL_KEY`,
  `userId: null` — identical shape to `OpportunityProbabilityConfigService`, except the
  getter returns `null` instead of a default.
- `dtos/update-opportunity-monthly-goal.input.ts`: `UpdateOpportunityMonthlyGoalInput` with a
  validated `value: OpportunityMonthlyGoal` (a nested `targetAmount: number`, `@Min(0)`),
  mirroring `UpdateOpportunityStageProbabilityInput`.
- `resolvers/opportunity-monthly-goal-config.resolver.ts`: `@MetadataResolver()` with
  `@Query(() => GraphQLJSON) opportunityMonthlyGoal` (NoPermissionGuard, returns the config
  or null) and `@Mutation(() => GraphQLJSON) updateOpportunityMonthlyGoal`
  (SettingsPermissionGuard DATA_MODEL, takes the input) — same guard/decorator set as
  `OpportunityProbabilityConfigResolver`.
- `opportunity-monthly-goal-config.module.ts` (providers: service + resolver), registered in
  `packages/twenty-server/src/engine/core-modules/core-engine.module.ts` alongside
  `OpportunityProbabilityConfigModule`. Verify the query is exposed via `/metadata`
  introspection after wiring, as the probability resolver was.

No new field, no listener, no job, no migration — just the config resolver.

## 2. Settings page

Mirror `SettingsObjectOpportunityRotting` / the probability settings page:

- `SettingsPath.ObjectGoal = 'objects/:objectNamePlural/goal'` (enum + lazy `SettingsRoutes`).
- Frontend hooks: `useOpportunityMonthlyGoal` (plain `useQuery` of a `GET_OPPORTUNITY_MONTHLY_GOAL` query against the `/metadata` client, returning `{ config: OpportunityMonthlyGoal | null, loading }`) and `useUpdateOpportunityMonthlyGoal` (mutation `UPDATE_OPPORTUNITY_MONTHLY_GOAL`, refetches the query) — mirroring the rotting config hooks.
- `SettingsObjectOpportunityGoal` page: gated behind the loaded config (skeleton until loaded, so a blank-save can't wipe), one number input **„Monatsziel (Umsatz)"** (major units), a Save button, snackbar on success. An empty input saves `targetAmount: 0`; a `targetAmount` of `0` (or an unset/null config) is treated everywhere as "no goal" (`targetMicros = null`, no ratio, no progress bar).
- An opportunity-gated **„Verkaufsziel"** Section link in `ObjectSettings.tsx`, next to the
  existing Rotting / Probability links, `to={getSettingsPath(SettingsPath.ObjectGoal, ...)}`.

## 3. Goals page

Files:
- `packages/twenty-front/src/modules/object-record/opportunity-goal/utils/computeMonthlyGoalProgress.ts`
- `packages/twenty-front/src/pages/opportunity-goal/OpportunityGoalPage.tsx`
- `packages/twenty-front/src/modules/object-record/opportunity-goal/components/OpportunityGoalProgress.tsx`

### Pure util (TDD)

```ts
type WonDealInput = { amountMicros: number | null; closedAt: string | null };
export type GoalMonthBucket = { year: number; month: number; achievedMicros: number };
export type MonthlyGoalProgressResult = {
  current: { achievedMicros: number; targetMicros: number | null; ratio: number | null };
  history: GoalMonthBucket[]; // last `monthsBack` months incl. current, oldest first
};

export const computeMonthlyGoalProgress = (
  wonDeals: WonDealInput[],
  targetMicros: number | null,
  now: Date,
  monthsBack?: number, // default 6
): MonthlyGoalProgressResult => { ... }
```

Semantics:
- A deal contributes its `amountMicros` to the bucket of its `closedAt` month (deals with
  null `closedAt` or null `amountMicros` are ignored). Bucketing uses calendar year+month.
- `current.achievedMicros` = sum for the `now` month. `current.targetMicros` = the passed
  target (or null). `current.ratio` = `achievedMicros / targetMicros` when `targetMicros`
  is a positive number, else `null` (no target or target 0 → no ratio).
- `history` = the last `monthsBack` months (default 6) ending at the `now` month, oldest
  first, each with its `achievedMicros` (0 if none).
- Raw micros returned; the page rounds/formats and clamps the progress bar.

### Display (`OpportunityGoalProgress` inside `OpportunityGoalPage`)

- Fetches won deals: `useFindManyRecords(opportunity, filter: { status: { eq: 'WON' } },
  recordGqlFields: { amount: true, closedAt: true, status: true }, limit: 1000)` and the goal
  config via `useOpportunityMonthlyGoal`.
- `targetMicros` = `config?.targetAmount ? config.targetAmount * 1_000_000 : null`.
- Header block for the current month: **Ziel** (formatted target or „Kein Ziel gesetzt"),
  **Erreicht** (formatted achieved), a **progress bar** filled to
  `min(1, achievedMicros / targetMicros)` with the **percentage** label; when there is no
  target, show a tertiary hint linking to the settings page instead of a bar.
- A small **history table** below: columns **Monat** | **Gewonnen** | **Ziel** | **%** for
  the last 6 months (month name via `dateLocaleState` + date-fns `format(d,'MMMM yyyy',...)`,
  same as the Forecast table; `Ziel` is the same monthly target each row; `%` rounded, `-`
  when no target).
- Currency: sum micros as integers, divide by 1_000_000 once, `useNumberFormat().formatNumber`
  + inline `getCurrencySymbol` (Intl narrowSymbol) — the same helper the Lost-reason / Forecast
  tables use. Single workspace currency (first `currencyCode` among the won deals, else USD).
- `loading` renders null. When there are no won deals AND no target, an empty/tertiary state.

### Route + navigation

- `AppPath.GoalsPage = '/opportunities/goals'` (enum, after `NextActionsPage`); rebuild
  twenty-shared; lazy route under `MainAppLayoutWithSidePanel`.
- A 6th gated `NavigationDrawerItem` „Ziele" in `MainNavigationDrawerScrollableItems.tsx`
  after „Nächste Aktionen", icon `IconTarget` (verified present in `twenty-ui/icon`), active via pathname.
- de-DE strings (German-source, identity msgstr): `Ziele`, `Verkaufsziel`,
  `Monatsziel (Umsatz)`, `Ziel`, `Erreicht`, `Kein Ziel gesetzt`, `Monat`, `Gewonnen`,
  and the settings-updated snackbar string.

## Testing

- `computeMonthlyGoalProgress` pure unit tests (TDD): current-month sum from `closedAt`
  bucketing; ignores null closedAt/amount; ratio = achieved/target, null when target null or
  0; history has exactly `monthsBack` months ending at `now`, oldest first, with correct
  per-month sums and zeros for empty months; deals in other months excluded from current.
- Backend config service unit test mirroring the probability service spec (get returns
  stored value / null when unset; set persists).
- Live-verify: set a monthly target in settings; confirm the Goals page shows it; mark a deal
  Won with a close date in the current month and confirm Erreicht + the bar + % update, and
  the history row for this month reflects it; cross-check against the DB (Postgres MCP,
  read-only). Restore the deal afterwards.

## Non-goals

Per-member goals; quarterly/yearly targets; weighted-forecast progress; multiple
simultaneous goals; goal history editing; currency conversion (single workspace currency
assumed). No new opportunity field, listener, job, or migration.

## Build order

Backend first: config type + service (+ spec) → dto + resolver + module + core-engine
registration. Then frontend: settings hooks + settings page + section link; then the pure
util (TDD) → goal-progress component + page → route → nav link + de-DE. Single mergeable
slice.
