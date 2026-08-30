# Opportunity Days-in-Stage Analytics — Slice A Design

Date: 2026-08-30
Status: Approved (pending user spec review)
Sub-project 7 of the Pipedrive-semantics track. Pipeline-velocity report (Slice A).

## Goal

A report page at `/opportunities/stage-analytics` showing, per pipeline stage, the
number of open deals and the average number of days those deals have currently spent
in that stage. It answers "where are deals piling up right now". Frontend-only: it reuses
the existing `stageChangedAt` field (last stage-change timestamp) and adds no backend.

This is Slice A of a staged feature. Slice A measures only the CURRENT stage age of open
deals (derivable from `stageChangedAt`). Full stage-transition history and stage-to-stage
conversion rates are Slice B, a separate sub-project (needs a stage-change history log,
not built here).

## Pattern

Mirrors the merged Forecast (`/opportunities/forecast`) and Lost-reason report
(`/opportunities/lost-reasons`) slices exactly:

- `useFindManyRecords` fetch, filtered to open deals.
- A pure aggregation util built TDD.
- A plain `Table` page inside `PageContainer` + `PageHeader`.
- A route under `MainAppLayoutWithSidePanel` in `useCreateWorkspaceAppRouter`.
- A gated `NavigationDrawerItem` in `MainNavigationDrawerScrollableItems`.
- de-DE strings via Lingui.

## Data flow

Page fetches open opportunities:

```ts
useFindManyRecords<OpportunityStageDurationRecord>({
  objectNameSingular: CoreObjectNameSingular.Opportunity,
  filter: { status: { eq: 'OPEN' } },
  recordGqlFields: { stage: true, stageChangedAt: true },
  limit: 1000,
})
```

Stage order + labels come from the Opportunity `stage` field metadata options (in
metadata order, same source the Rotting settings page uses via `useObjectMetadataItem`).
Both feed the pure util. `now` is passed in (`new Date()`), not read inside the util, so
the util stays pure and testable.

`OpportunityStageDurationRecord` shape:

```ts
type OpportunityStageDurationRecord = {
  id: string;
  __typename: 'Opportunity';
  stage: string | null;
  stageChangedAt: string | null;
  status: string;
};
```

## Pure util `computeStageDurationBreakdown`

File: `packages/twenty-front/src/modules/object-record/opportunity-stage-duration-report/utils/computeStageDurationBreakdown.ts`

```ts
type StageOption = { value: string; label: string };

type StageDurationInput = {
  stage: string | null;
  stageChangedAt: string | null;
};

export type StageDurationBucket = {
  stage: string;
  label: string;
  openCount: number;
  averageDays: number | null;
};

export type StageDurationBreakdownResult = {
  buckets: StageDurationBucket[];
  totalOpenCount: number;
};

export const computeStageDurationBreakdown = (
  orderedStages: StageOption[],
  deals: StageDurationInput[],
  now: Date,
): StageDurationBreakdownResult => { ... }
```

Semantics:

- One bucket per entry in `orderedStages`, in the given order. Stages with no matching
  open deals still produce a bucket (`openCount: 0`, `averageDays: null`).
- A deal contributes to the bucket whose `value` equals its `stage`. Deals whose `stage`
  is null or matches no known stage option are ignored entirely (not counted anywhere).
- `openCount` = number of deals in that stage.
- `averageDays` = mean of `(now - stageChangedAt)` in whole days, over the deals in that
  stage that HAVE a `stageChangedAt`. Deals with a null `stageChangedAt` still count in
  `openCount` but are excluded from the average. If a stage has zero deals with a
  timestamp, `averageDays` is `null`.
- Day count per deal: `Math.floor((now - stageChangedAt) / MS_PER_DAY)`, clamped at a
  floor of 0 (a future/edge timestamp never yields a negative age). `averageDays` is the
  raw arithmetic mean of these per-deal day counts (a fractional `number`, not rounded).
  The table does the display rounding, so rounding lives in exactly one place.
- `totalOpenCount` = sum of all `openCount` (i.e. all open deals matching a known stage).

## Table `OpportunityStageDurationTable`

File:
`packages/twenty-front/src/modules/object-record/opportunity-stage-duration-report/components/OpportunityStageDurationTable.tsx`

Columns: **Phase** (stage label) | **Offene Deals** (`openCount`) | **Ø Tage in Phase**
(`averageDays` rounded to 0 decimals via `Math.round`; `null` renders as `-`). No
currency, no amounts. No total row: an average-of-averages would mislead and a lone total
open-count adds little. `totalOpenCount` stays in the util result (tested) but is not
rendered. Uses the same `Table`/`TableRow`/`TableHeader`/`TableCell`/`TableBody`
primitives as the Lost-reason table.

## Page `OpportunityStageDurationReportPage`

File:
`packages/twenty-front/src/pages/opportunity-stage-duration-report/OpportunityStageDurationReportPage.tsx`

`PageContainer` + `PageHeader title={t\`Phasen-Dauer\`} Icon={IconHourglass}`. Fetches open
deals + stage options, calls the util, renders the table. Empty state (no open deals /
no stages) renders a tertiary-color `t\`Keine offenen Opportunities.\`` message, mirroring
the other two report pages. `loading` renders null (brief-conform, no skeleton, matches
Forecast/Lost-reason).

## Route + navigation

- `AppPath.StageAnalyticsPage = '/opportunities/stage-analytics'` in the AppPath enum.
- Lazy route registered under `MainAppLayoutWithSidePanel` in
  `useCreateWorkspaceAppRouter.tsx`, next to `ForecastPage` and `LostReasonReportPage`.
- A third gated `NavigationDrawerItem` in `MainNavigationDrawerScrollableItems.tsx`, after
  the Forecast and Verlustgründe links, gated on the opportunity object existing
  (`hasOpportunityObject` via `objectMetadataItemsSelector`, same gate as the siblings),
  label `t\`Phasen-Dauer\``, `Icon={IconHourglass}`, active via `useLocation`.
- de-DE strings for the page title, nav label, column headers (`Phase`, `Offene Deals`,
  `Ø Tage in Phase`), and empty state.

## Testing

- `computeStageDurationBreakdown` pure unit tests (TDD): all stages present in order incl.
  zero-count stages; average excludes null-`stageChangedAt` deals but counts them in
  `openCount`; unknown/null stage deals ignored; day-flooring + zero-floor; null average
  when no dated deals in a stage; `totalOpenCount` sum.
- Live-verify against the dev DB: open the page, confirm each stage's open count and
  average days match the raw `stageChangedAt` values in Postgres (MCP read-only) for the
  6 test deals; confirm zero-count stages show `-`; restore nothing (read-only feature).

## Non-goals

Stage-transition history; average time deals HISTORICALLY spent in each stage (across
already-advanced/closed deals); stage-to-stage conversion rates (all Slice B). Including
closed (WON/LOST) deals (their `stageChangedAt` is frozen and would distort the current
age). German stage-option labels (stage labels stay English, board-consistent, per the
earlier value-derivation decision). Per-user timezone bucketing. Any backend change.

## Build order

Single slice (own plan): pure util (TDD) → table component → page + route + nav wiring +
de-DE. Merge.
