# Opportunity Pipeline Analysis (Days-in-Stage Slice B) Design

Date: 2026-08-30
Status: Approved (pending user spec review)
Sub-project 7, Slice B of the Pipedrive-semantics track. Historical stage-velocity + funnel.

## Goal

A report page at `/opportunities/pipeline-analysis` showing, per pipeline stage:
- the number of deals that ever reached that stage (funnel depth),
- the average historical time deals spent in that stage (over completed passes), and
- the conversion rate to the next stage.

This is Slice B of the days-in-stage feature. Slice A (merged) measures the CURRENT
stage age of open deals from `stageChangedAt`. Slice B needs real stage-transition
history, introduced here as a new `stageHistory` JSON field maintained on every stage
change. History before this field ships cannot be reconstructed; the backfill seeds only
the current stage, so history is complete from introduction onward.

## Architecture

Backend: a new `stageHistory` RAW_JSON field on Opportunity, kept current by extending the
already-worker-registered stage-change job with an idempotent reconcile, plus a backfill
command that seeds the current stage. Frontend: a pure aggregation util over the per-deal
history arrays + a table page, mirroring the merged Forecast / Lost-reason / Slice-A report
pattern (`useFindManyRecords` → pure util → `Table` page → gated route + nav link).

## 1. Data model: `stageHistory` field

New standard field on Opportunity.

- universalIdentifier: `20202020-5701-4a11-9c31-7e6b2d4f8a16` (next after `lostReason` `...8a15`).
- Defined in `standard-object-fields.constant.ts` (UID entry) and in
  `compute-opportunity-standard-flat-field-metadata.util.ts`:
  ```ts
  type: FieldMetadataType.RAW_JSON,
  label: i18nLabel(msg`Stage history`),
  description: i18nLabel(msg`Chronological log of stage entries`),
  icon: 'IconHistory',
  isNullable: true,
  isUIEditable: false,
  ```
  (Mirrors the merged `transcript` RAW_JSON precedent in the call-recording compute util.)
- Value shape: a chronological array (oldest first, newest last) of
  `{ stage: string; enteredAt: string }` where `enteredAt` is an ISO timestamp and `stage`
  is the canonical English stage VALUE. The last entry's stage always equals the deal's
  current `stage`.
- Entity mirror in `opportunity.workspace-entity.ts`:
  ```ts
  stageHistory: OpportunityStageHistoryEntry[] | null;
  ```
  with `type OpportunityStageHistoryEntry = { stage: string; enteredAt: string };` declared
  in a small shared server type (precedent: workflow-version's `steps: WorkflowAction[] | null`).
- Rebuild `twenty-shared` after the constant change; regenerate the 2 snapshots
  (`standardObjectUniversalIdentifiers`, `get-standard-object-metadata-related-entity-ids`)
  additively via `jest -u`.

## 2. History maintenance: extend the existing stage-change job

The merged `OpportunitySetStageChangedAtJob` already runs in the worker graph (registered
via `OpportunityJobModule` in `JobsModule`) and fires on opportunity create and stage
change. Extend that same job with a `stageHistory` reconcile — NO new job, NO new module
(reusing the worker-registered job avoids the silent-no-op trap that already bit this
codebase once).

Reconcile logic, computed against the freshly-fetched opportunity (`stage`, `stageHistory`):
- If `stageHistory` is null/empty → set it to `[{ stage: currentStage, enteredAt: nowIso }]`.
- Else if the last entry's `stage` !== `currentStage` → append `{ stage: currentStage, enteredAt: nowIso }`.
- Else (last entry already matches current stage) → no change.

This is idempotent (re-running with an unchanged stage is a no-op), covers both create
(seed) and change (append) in one path, and cannot double-append. The reconcile is a pure
helper (`reconcileStageHistory(currentStage, history, nowIso): entry[] | null` returning the
next array only when it changed, else null) so it is unit-testable independent of the job.
`nowIso` is passed in, not read inside the helper.

The job writes `stageHistory` (and the existing `stageChangedAt`) via the same
`GlobalWorkspaceOrmManager` repository path it already uses. Writing must not re-trigger an
infinite recompute: the job write bypasses the event→listener path (same property the
merged probability/stageChangedAt jobs rely on) — confirm during implementation that the
history write does not enqueue another stage-change job.

## 3. Backfill: instance/workspace command 2.36.0

New workspace command at version `2.36.0` (register in the per-version module +
`workspace-command-provider.module.ts` + add `'2.36.0'` to `TWENTY_NEXT_VERSIONS`), with
`up` seeding and idempotency:
- For each opportunity whose `stageHistory` is null/empty, set
  `stageHistory = [{ stage: <currentStage>, enteredAt: <(stageChangedAt ?? createdAt) ISO> }]`.
- Idempotent: deals that already have a non-empty `stageHistory` are skipped.
- `down`: a no-op (a data-only seed; once the field accumulates live transitions after
  ship, nulling it would destroy real history, so down deliberately does not reverse the
  seed). Document the no-op with a short comment. Do not touch already-committed up/down of
  prior version commands.

Pre-existing transitions are NOT reconstructed (unavailable) — only the current stage is
seeded, so historical durations accrue only for stage changes that happen after ship.

## 4. Frontend pure util `computeStagePipelineBreakdown`

File: `packages/twenty-front/src/modules/object-record/opportunity-pipeline-analysis/utils/computeStagePipelineBreakdown.ts`

```ts
type StageOption = { value: string; label: string };
type StageHistoryEntry = { stage: string; enteredAt: string };
type PipelineDealInput = { stageHistory: StageHistoryEntry[] | null };

export type StagePipelineBucket = {
  stage: string;
  label: string;
  reachedCount: number;
  averageDurationDays: number | null;
  conversionToNextRate: number | null;
};

export type StagePipelineBreakdownResult = {
  buckets: StagePipelineBucket[];
};

export const computeStagePipelineBreakdown = (
  orderedStages: StageOption[],
  deals: PipelineDealInput[],
): StagePipelineBreakdownResult => { ... }
```

Semantics (let `positionOf(stageValue)` = index in `orderedStages`, or `-1` if unknown):

- Per deal: take `stageHistory ?? []`, keep only entries whose `stage` is a known option,
  sort ascending by `enteredAt`.
  - **Durations:** for each consecutive pair `(entry[i], entry[i+1])`, the deal spent
    `Math.max(0, Math.floor((enteredAt[i+1] - enteredAt[i]) / MS_PER_DAY))` days in
    `entry[i].stage`; push that day count into that stage's sample list. The last entry
    (current stage, no closing entry) contributes no duration sample.
  - **Reached:** `maxReachedPosition` = the maximum `positionOf(entry.stage)` over the
    deal's known-stage entries, or `-1` if the deal has no known-stage entry.
- Per stage at index `i`:
  - `reachedCount` = number of deals whose `maxReachedPosition >= i`.
  - `averageDurationDays` = raw arithmetic mean of that stage's duration samples, or `null`
    if it has no samples. Not rounded here (the table rounds).
  - `conversionToNextRate` = for `i < lastIndex`, `reachedCount[i] > 0` ?
    `reachedCount[i+1] / reachedCount[i]` : `null`; for the last stage, always `null`.
- Buckets are returned in `orderedStages` order, one per stage, including stages no deal
  reached (`reachedCount: 0`, `averageDurationDays: null`, `conversionToNextRate: null`).

Deals with a null/empty `stageHistory` contribute nothing (after backfill every deal has
at least one entry). Unknown-stage entries are ignored (e.g. a stage option later removed).

## 5. Page `OpportunityPipelineAnalysisPage`

File: `packages/twenty-front/src/pages/opportunity-pipeline-analysis/OpportunityPipelineAnalysisPage.tsx`

- Reads ordered stage options from the Opportunity `stage` field metadata (sorted by
  `position`), same source as Slice A.
- `useFindManyRecords` over ALL opportunities — NO status filter, because the funnel is
  historical and must include won/lost deals:
  ```ts
  useFindManyRecords<OpportunityPipelineRecord>({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    recordGqlFields: { stageHistory: true },
    limit: 1000,
  })
  ```
- Calls the util, renders `OpportunityPipelineAnalysisTable`. `loading` renders null.
  Empty state (`buckets` all `reachedCount: 0`, i.e. no deals) renders a tertiary-color
  `t\`Keine Opportunities.\`` message, mirroring the sibling report pages.

Table
(`packages/twenty-front/src/modules/object-record/opportunity-pipeline-analysis/components/OpportunityPipelineAnalysisTable.tsx`):
columns **Phase | Erreicht | Ø Dauer (Tage) | Konversion → nächste**. `averageDurationDays`
→ `Math.round` or `-` when null; `conversionToNextRate` → `Math.round(rate * 100)` + `%`
or `-` when null (last stage always `-`). Same `Table`/`TableRow`/`TableHeader`/`TableCell`/
`TableBody` primitives as the other reports. No total row.

## 6. Route + navigation

- `AppPath.PipelineAnalysisPage = '/opportunities/pipeline-analysis'` in the AppPath enum
  (after `StageAnalyticsPage`); rebuild `twenty-shared`.
- Lazy route under `MainAppLayoutWithSidePanel` in `useCreateWorkspaceAppRouter.tsx`, next
  to the other opportunity report routes.
- A 4th gated `NavigationDrawerItem` in `MainNavigationDrawerScrollableItems.tsx` inside
  the existing `hasOpportunityObject` fragment, after "Phasen-Dauer", label
  `t\`Pipeline-Analyse\``, icon `IconTrendingUp` (verified present in `twenty-ui/icon`;
  pairs with the Verlustgründe `IconTrendingDown`), active via
  `pathname === AppPath.PipelineAnalysisPage`.
- de-DE strings (all German-source, identity `msgstr`): `Pipeline-Analyse`, `Erreicht`,
  `Ø Dauer (Tage)`, `Konversion → nächste`, `Keine Opportunities.`, plus the server field
  label if surfaced.

## Testing

- `reconcileStageHistory` pure unit tests (server): null/empty → seed; last stage differs
  → append; last stage matches → null (no change); nowIso passed in.
- `computeStagePipelineBreakdown` pure unit tests (front, TDD): reached counts incl.
  skipped stages and monotonicity; duration averaging over consecutive pairs excluding the
  open last entry; day-floor at 0; null average with no samples; conversion ratios incl.
  divide-by-zero → null and last-stage → null; unknown-stage entries ignored; empty stages
  present in order.
- Backfill command: seeds only null/empty, idempotent on re-run (verify via Postgres MCP
  read-only after a dry-run + real run).
- Live-verify against the dev DB: perform a few stage moves on test deals, confirm
  `stageHistory` appends correctly (MCP read-only), open the page, hand-check reached
  counts + one conversion + one average against the raw history JSON, restore the deals.

## Non-goals

Per-deal history timeline UI; editing history; reconstructing pre-ship transitions;
an overall win-rate row (YAGNI); German stage-option labels (labels come from live
metadata); filtering the funnel by owner/date (later). No changes to Slice A's page.

## Build order

One mergeable slice, backend-first:
1. `stageHistory` field + entity mirror + snapshots (twenty-shared build).
2. `reconcileStageHistory` helper + extend `OpportunitySetStageChangedAtJob` (+ its test).
3. Backfill command 2.36.0.
4. Frontend util (TDD).
5. Table + page + AppPath + route.
6. Nav link + de-DE.
