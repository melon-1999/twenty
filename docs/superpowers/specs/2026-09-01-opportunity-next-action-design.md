# Opportunity Next Action (Activities) — Slice A Design

Date: 2026-09-01
Status: Approved (pending user spec review)
Sub-project 8 of the Pipedrive-semantics track. "Next activity" surfacing + missing-action report.

## Goal

Make visible which open opportunities have **no upcoming action** (no open task with a
future due date), and show each deal's next due date. Pipedrive's core daily-workflow idea:
every open deal should have a scheduled next activity; deals without one need attention.

Client-side only, computed from the existing **Task** objects (no new field, no backend, no
listener). This is Slice A: the pure util, a detail badge, and a report page. Slice B (table
+ board per-record indicators) is deferred to a separate sub-project, mirroring how the
Deal-Aging table/board indicators were staged after its detail badge.

## Definitions

- **Open task:** a Task with `status !== 'DONE'` (i.e. `TODO` or `IN_PROGRESS`).
- **Upcoming action:** an open task with `dueAt != null` and `dueAt >= now`.
- **`nextActivityAt` (per deal):** the earliest `dueAt` among that deal's upcoming actions,
  or `null` if it has none.
- **"Keine nächste Aktion":** an open opportunity whose `nextActivityAt` is `null`.
- Tasks link to opportunities through the **TaskTarget** junction object via
  `targetOpportunityId` (each TaskTarget has one `task` and one optional `targetOpportunity`).
- Closed (WON/LOST) opportunities are out of scope — only open deals need a next action.

## Data model

No schema change. Everything is derived from existing objects:
- `opportunity` — `id`, `name`, `stage`, `amount`, `status`.
- `taskTarget` — `targetOpportunityId`, and its `task { dueAt, status }` (many-to-one).

Both are queryable via `useFindManyRecords` (`CoreObjectNameSingular.TaskTarget` exists).

## Pure utils (TDD)

File: `packages/twenty-front/src/modules/object-record/opportunity-next-action/utils/computeNextActivityAt.ts`

```ts
type ActivityTaskInput = { dueAt: string | null; status: string | null };

// Earliest dueAt among open (status !== 'DONE') tasks whose dueAt is in the
// future (>= now), or null when there is no upcoming open task.
export const computeNextActivityAt = (
  tasks: ActivityTaskInput[],
  now: Date,
): string | null => { ... }
```

File: `packages/twenty-front/src/modules/object-record/opportunity-next-action/utils/computeMissingNextAction.ts`

```ts
type MissingNextActionOpportunity = { id: string; name: string | null; stage: string | null; amountMicros: number | null };
type TaskTargetInput = { targetOpportunityId: string | null; dueAt: string | null; status: string | null };

export type NextActionResult = {
  opportunities: MissingNextActionOpportunity[]; // open deals with no upcoming action
  totalMissing: number;
};

// Groups task targets by opportunity, reuses computeNextActivityAt, and returns
// the open opportunities whose nextActivityAt is null (no upcoming action).
export const computeMissingNextAction = (
  openOpportunities: MissingNextActionOpportunity[],
  taskTargets: TaskTargetInput[],
  now: Date,
): NextActionResult => { ... }
```

`computeMissingNextAction` builds a map `opportunityId -> tasks[]` from the task targets
(ignoring targets whose `targetOpportunityId` is null), then for each open opportunity calls
`computeNextActivityAt`; an opportunity with a `null` result is included in `opportunities`.
Opportunities are returned in the input order. `totalMissing` = `opportunities.length`.

## Detail badge

File: `packages/twenty-front/src/modules/object-record/record-show/opportunity/hooks/useOpportunityNextActivity.ts`
+ `.../components/OpportunityNextActivityBadge.tsx`

- A per-record hook `useOpportunityNextActivity(recordId)` fetches that deal's task targets:
  `useFindManyRecords(taskTarget, filter: { targetOpportunityId: { eq: recordId } }, recordGqlFields: { targetOpportunityId: true, task: { dueAt: true, status: true } }, limit: 100)`,
  flattens to `{ dueAt, status }[]`, and returns `computeNextActivityAt(tasks, new Date())`.
- `OpportunityNextActivityBadge({ recordId, status })`: renders nothing for closed deals
  (`status !== 'OPEN'`). For open deals: if `nextActivityAt` is set → a neutral badge
  `Nächste Aktion: <formatiertes Datum>`; if `null` → a red badge `Keine nächste Aktion`.
- Placement: in the opportunity-gated header block of `RecordShowPage.tsx` (the same fragment
  that already holds the Won/Lost actions and the rotting badge). Reads the deal's `status`
  (already available there).
- Date formatting mirrors the other pages: `useAtomStateValue(dateLocaleState)` +
  date-fns `format(new Date(nextActivityAt), 'd. MMMM yyyy', { locale: dateLocale.localeCatalog })`.
- Red badge styling reuses the rotting-badge Linaria pattern (tag red background/text tokens
  + an icon). Neutral badge uses tertiary/secondary tokens.

## Report page

File: `packages/twenty-front/src/pages/opportunity-next-action-report/OpportunityNextActionReportPage.tsx`
+ table `packages/twenty-front/src/modules/object-record/opportunity-next-action/components/OpportunityNextActionTable.tsx`

- Fetches open opportunities:
  `useFindManyRecords(opportunity, filter: { status: { eq: 'OPEN' } }, recordGqlFields: { name: true, stage: true, amount: true, status: true }, limit: 1000)`.
- Fetches task targets linked to opportunities:
  `useFindManyRecords(taskTarget, filter: { targetOpportunityId: { is: 'NOT_NULL' } }, recordGqlFields: { targetOpportunityId: true, task: { dueAt: true, status: true } }, limit: 1000)`.
  (`is: 'NOT_NULL'` is an existing Twenty filter operator. The util also ignores rows whose
  `targetOpportunityId` is null, so correctness does not depend on the filter — it is only a
  fetch-size optimization.)
- Calls `computeMissingNextAction(openOpportunities, flattenedTaskTargets, new Date())`.
- Renders `OpportunityNextActionTable` inside `PageContainer` + `PageHeader`
  (`title={t\`Nächste Aktionen\`}`). Columns: **Deal** (name) | **Phase** (stage label from
  the Opportunity stage-field metadata options, sorted/looked up like the other pages) |
  **Betrag** (amount micros → currency, same `formatMicros` + `getCurrencySymbol` helper the
  Lost-reason/Forecast tables use). No total row.
- `loading` renders null. Empty state (`totalMissing === 0`) renders a tertiary-color
  `t\`Alle offenen Opportunities haben eine nächste Aktion.\`` message, mirroring the sibling
  report pages.

## Route + navigation

- `AppPath.NextActionsPage = '/opportunities/next-actions'` in the AppPath enum (after
  `PipelineAnalysisPage`); rebuild `twenty-shared`.
- Lazy route under `MainAppLayoutWithSidePanel` in `useCreateWorkspaceAppRouter.tsx`, next to
  the other opportunity report routes.
- A 5th gated `NavigationDrawerItem` in `MainNavigationDrawerScrollableItems.tsx` inside the
  existing `hasOpportunityObject` fragment, after "Pipeline-Analyse", label
  `t\`Nächste Aktionen\``, icon `IconCalendarDue` (verified present in `twenty-ui/icon`),
  active via `pathname === AppPath.NextActionsPage`.
- de-DE strings (all German-source, identity `msgstr`): `Nächste Aktionen`, `Nächste Aktion`,
  `Keine nächste Aktion`, `Deal`, `Phase`, `Betrag`,
  `Alle offenen Opportunities haben eine nächste Aktion.`.

## Testing

- `computeNextActivityAt` pure unit tests (TDD): picks earliest future open dueAt; ignores
  DONE tasks; ignores past-due tasks; ignores null dueAt; returns null when no upcoming open
  task; unaffected by ordering.
- `computeMissingNextAction` pure unit tests (TDD): groups targets by opportunity; an
  opportunity with an upcoming open task is excluded; one with only DONE/past/none is
  included; targets with null `targetOpportunityId` ignored; opportunities with zero targets
  are included (no action); input order preserved; `totalMissing` correct.
- Live-verify against the dev DB: create a task with a future due date linked to one open
  deal, leave others without; confirm the badge shows the date on that deal and
  "Keine nächste Aktion" on the others, and the report lists exactly the deals without an
  upcoming task; mark the task DONE / move its dueAt to the past and confirm the deal moves
  into the report. Restore afterwards.

## Non-goals (this slice)

Table + board per-record indicators (Slice B). Activity reminders / notifications /
scheduling UI. A dedicated activity object or activity types (we reuse Tasks). Overdue as a
distinct third state (only "has upcoming action" vs "none"). Making report rows link to the
deal (can be added later). Any backend change or denormalized field.

## Build order

Single slice (own plan): `computeNextActivityAt` (TDD) → `computeMissingNextAction` (TDD) →
detail badge hook + component + wiring → report table + page + route → nav link + de-DE.
Merge. Slice B (table/board indicators) is a separate later spec.
