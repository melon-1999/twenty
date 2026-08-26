# Opportunity Probability + Forecast — Design

Date: 2026-08-26
Status: Approved (pending user spec review)
Sub-project 3 of the Pipedrive-semantics track for the German Twenty instance.

## Goal

Bring Pipedrive-style deal probability and a weighted sales forecast to Opportunities:
each open deal carries a win probability, the pipeline shows weighted value, and a
Forecast page groups open deals by expected close month with weighted vs unweighted totals.

Builds directly on the merged Won/Lost lifecycle (`status`, `closedAt`) and Deal-Aging
(`stageChangedAt` field + stage-change listener/job + per-stage KeyValuePair config +
Settings page). Reuses those exact patterns.

## Model (Pipedrive parity, option "c")

Pipedrive: stage probability (per stage default) + deal probability (per-deal, editable,
seeded from stage default, resets to new stage default on stage move unless manually changed).
Weighted value = amount x probability. Forecast view groups open deals by close date month.

We implement all of it, split into two build slices.

## Open recon point (resolve before Slice A T1)

The Opportunity workspace-entity already declares `probability: string;` marked
`/** @deprecated */` (a bare property, no `@WorkspaceField` decorator). Before adding a
real active field named `probability`, confirm whether a `probability` column / field
metadata already exists in the workspace schema. If it collides, either repurpose the
deprecated slot cleanly or pick a non-colliding field name. Verify via Postgres MCP
(read-only) against the dev workspace schema.

## Data model (new standard fields)

Two new standard fields on Opportunity, added the established way: entry in
`packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts`
(new `universalIdentifier`), `npx nx build twenty-shared`, regen both snapshots
(`standardObjectUniversalIdentifiers.test.ts.snap` +
`get-standard-object-metadata-related-entity-ids.util.spec.ts.snap`), plus a backfill
upgrade command (next version `2.34.0`, timestamp > `1786600000000`, add to
`TWENTY_NEXT_VERSIONS`).

- **`probability`** — NUMBER, range 0-100, nullable. Seeded to the stage default on create;
  follows reset rule (2) on stage change. Normal metadata field, so it is editable inline in
  the record detail and table without a custom editor.
- **`weightedAmount`** — CURRENCY, nullable. Denormalized = `amount x probability / 100`
  with the same `currencyCode` as `amount`. Maintained by the server listener whenever
  `amount` or `probability` changes. Existence as a real CURRENCY field lets the board use its
  native per-column SUM aggregate for a weighted pipeline total.

### Per-stage probability config

New workspace-scoped config `OPPORTUNITY_STAGE_PROBABILITY` via `KeyValuePairService`
(CONFIG_VARIABLE, userId null), mirroring `OpportunityRottingConfigService` exactly:
per-consumer local KeyValueTypesMap, get-with-default / set, a `@MetadataResolver()`
resolver (query guarded by `NoPermissionGuard`, mutation guarded by
`SettingsPermissionGuard(DATA_MODEL)`), in its own module imported into
`core-engine.module.ts` (NOT modules.module — verify exposure via schema introspection).

Default map:

| Stage value | Default % |
|-------------|-----------|
| NEW         | 20        |
| SCREENING   | 40        |
| MEETING     | 60        |
| PROPOSAL    | 80        |
| CUSTOMER    | 100       |

Config is keyed by the canonical English stage VALUE (never the German label), consistent
with the rotting config and the value-derivation gotcha.

## Server logic (listener + job)

Extend the opportunity stage-change listener path (reuse `OpportunityStageChangedListener` +
a job, or a sibling job, decided at recon for cleanliness). All writes go through
`GlobalWorkspaceOrmManager.executeInWorkspaceContext(fn, buildSystemAuthContext(workspaceId))`
+ `getRepository('opportunity', { shouldBypassPermissionChecks: true }).update`, matching the
stageChangedAt job.

On **CREATE**:
- if `probability` empty, set it to the stage default of the create-stage.
- compute `weightedAmount` = amount x prob / 100.

On **UPDATE**, driven by `objectRecordChangedProperties`:
1. **stage changed** — reset rule (2): if `before.probability === stageDefault(before.stage)`
   (untouched / still the inherited default), set `probability = stageDefault(after.stage)`;
   otherwise keep the manual value. Then recompute `weightedAmount`.
2. **probability changed** (manual) — recompute `weightedAmount`.
3. **amount changed** — recompute `weightedAmount`.

Stage defaults read from `OpportunityStageProbabilityService` (KeyValuePair) with fallback to
the DEFAULT map.

Recursion guard (as with stageChangedAt): the write only sets `probability` /
`weightedAmount`. A weightedAmount-only write leaves stage/amount unchanged (no re-trigger).
A probability write must be guarded so it does not loop (the changed-properties gate plus the
"already equals target" check prevent re-enqueue).

Edge cases: `amount` null -> `weightedAmount` null. `probability` null -> `weightedAmount`
null (no forecast contribution). Closed deals: `weightedAmount` stays amount x prob (a pure
field); the Forecast page filters `status = OPEN`, so closed deals never enter the forecast.

## Frontend

### Slice A surfaces

- **Detail page:** a weighted-value component next to `amount`, e.g. `Gewichtet: 8.000 € (80%)`,
  opportunity-gated (same wiring as Won/Lost actions and the rotting badge).
- **`probability` field:** normal NUMBER metadata field, editable inline in detail/table — no
  custom editor.
- **Board card:** a small `80%` badge, opportunity-gated (same pattern as the rotting indicator).
- **Board column weighted sum:** `weightedAmount` is a CURRENCY field, so a per-column
  SUM aggregate is native. Set SUM(weightedAmount) as a sensible default where feasible;
  otherwise it is user-selectable and documented. The existing raw amount SUM aggregate stays.
- **Settings page:** per-stage probability editor, a copy of the rotting Settings page
  (`OpportunityRottingForm` / `SettingsObjectOpportunityRotting`), new route
  `SettingsPath.ObjectProbability`, opportunity-gated section link in `ObjectSettings.tsx`.
  Gate the form render behind config `loading` (avoid the blank-save-wipe bug fixed for rotting).

### Slice B: Forecast page

- Twenty views are per-object (Table/Board); a new view TYPE is too deep. Instead a dedicated
  route/page (e.g. `/opportunities/forecast`, linked from the Opportunities area), not a new
  view type.
- Content: open opportunities (`status = OPEN`) grouped by `closeDate` into months. Per month:
  count, sum of `amount` (unweighted), sum of `weightedAmount` (weighted). Rendered as a
  table and/or simple bars.
- Data source: `findMany` opportunities filtered `status = OPEN` with client-side month
  bucketing, or a server aggregate if it is clean — decided at recon.

## Testing

- compute utils (weighted value; the reset-rule helper) TDD, like `computeOpportunityRotting`.
- config service tests (default vs stored override), like the rotting config service.
- listener/guard test: reset only when untouched; no recompute loop.
- backfill run live against the dev DB (no reset), verify field metadata + column + backfilled
  values via Postgres MCP.
- Forecast page: bucketing/aggregation unit-tested pure; live-verify totals.

## i18n

New strings wrapped with Lingui `t` (from `@lingui/core/macro`), filled in `de-DE.po`, then
`lingui:compile`. Terms: Gewichtet, Wahrscheinlichkeit, Forecast/Prognose, month names via the
existing date i18n. Keep stage config keyed by English values; labels stay German via the
already-shipped stage-label localization.

## Non-goals

Multiple pipelines each with their own probabilities; probability history / over-time charts;
auto/ML probability; per-user forecast quotas / goals; board-drag Won/Lost. Each is a
potential later sub-project.

## Build order

1. **Slice A** — fields + backfill (2.34.0) + listener/job + stage-probability config
   (service + resolver + module in core-engine) + GraphQL regen + detail weighted value +
   board % badge + board weighted SUM + Settings page. Merge.
2. **Slice B** — Forecast page (open deals by close month, weighted vs unweighted). Own plan,
   own merge.
