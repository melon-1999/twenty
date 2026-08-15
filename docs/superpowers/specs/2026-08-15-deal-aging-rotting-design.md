# Deal-Aging / Rotting — Design Spec

**Project:** Twenty CRM Pipedrive-Semantik, Phase 2, Sub-Projekt 2 (follows Won/Lost lifecycle).

**Goal:** Flag opportunities that have sat too long in their current pipeline stage ("rotting"), Pipedrive-style, with per-stage thresholds editable in Settings, shown on the record detail, the opportunities table, and the kanban board.

## Global Constraints
- Opportunity-only. German instance (de-DE); user-facing strings via Lingui `t` (see memory `twenty-german-instance-i18n`).
- Never touch `/* @license Enterprise */` files. Never `database:reset` the active dev DB (backfill instead).
- Field IDs in the `20202020-…` UUID namespace.
- Rotting is COMPUTED, never stored. Only `stageChangedAt` is persisted.
- Closed opportunities (`status` WON/LOST) never rot (aging frozen).

## Data Model
- New standard field on Opportunity: **`stageChangedAt`** — `DATE_TIME`, nullable. Timestamp of the last stage change. Added the same way as `closedAt` (Won/Lost sub-project):
  - `packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts` — new `universalIdentifier` in the `opportunity.fields` block; regenerate the `standardObjectUniversalIdentifiers` snapshot; rebuild twenty-shared.
  - `compute-opportunity-standard-flat-field-metadata.util.ts` — DATE_TIME entry mirroring `closedAt`.
  - `opportunity.workspace-entity.ts` — `stageChangedAt: Date | null;`.
  - Regenerate the twenty-server `get-standard-object-metadata-related-entity-ids` snapshot (field-enumeration snapshot, breaks otherwise).
- Backfill existing workspaces via a registered upgrade-version workspace command (mirror the Won/Lost backfill `2-31`, next version/timestamp): adds `stageChangedAt` field metadata + column, and sets existing rows' `stageChangedAt = createdAt` (data migration).

## Rotting Config (per-stage thresholds)
- Stored as a workspace-scoped `KeyValuePair` (core `keyValuePair`, unique on `['key','workspaceId']` with `userId` null), new `KeyValuePairType` key **`OPPORTUNITY_STAGE_ROTTING_DAYS`**, value = JSON map `{ [stageOptionValue]: numberOfDays }`.
- Typed value shape defined in a `*-key-value.type.ts` (mirror existing typed KV examples e.g. maintenance-mode-banner).
- Default seeded on first read if absent: `{ NEW: 7, SCREENING: 14, MEETING: 14, PROPOSAL: 21, CUSTOMER: 30 }`. Stage option values not present in the map → that stage never rots (no threshold).
- Config is keyed by stage option `value` (stable, e.g. `PROPOSAL`), NOT label (labels are localized/renameable).

## Server Hook (stageChangedAt maintenance)
- New listener `OpportunityStageChangedListener` in `packages/twenty-server/src/modules/opportunity/listeners/` (opportunity module currently has only `standard-objects`).
- `@OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)`: for each event, if `objectRecordChangedProperties(before, after)` includes `stage` AND `before.stage !== after.stage` → update that record's `stageChangedAt = new Date()`. Recursion-safe: writing only `stageChangedAt` does not change `stage`, so the follow-up UPDATE event does not re-enter the stage-changed branch.
- `@OnDatabaseBatchEvent('opportunity', DatabaseEventAction.CREATED)`: set `stageChangedAt = createdAt` (or now) for the new record.
- Write-back uses the workspace ORM repository for `opportunity` (mirror how existing opportunity-adjacent listeners resolve the twenty-orm repository / enqueue a job; if a job is used, it lives under `modules/opportunity/jobs/`).
- Registered in the opportunity module (create `opportunity.module.ts` if none, following a sibling module that wires a listener).

## Config API
- Expose the rotting config to the frontend: a query returning the current `OPPORTUNITY_STAGE_ROTTING_DAYS` map (seeded defaults if unset) and a mutation to update it. Reuse `KeyValuePairService`. Resolver placed with the opportunity metadata surface or a small dedicated resolver/module.
- Auth: standard workspace auth; editing gated behind the same permission as data-model settings (DATA_MODEL) — mirror how settings resolvers guard.

## Settings UI
- New Settings page at the dedicated route `/settings/objects/opportunities/rotting` (linked from the Opportunity object settings), titled "Deal-Aging".
- Reads the stage field's options (values + localized labels) + the current config; renders one number input ("Rotting-Tage") per stage; Save persists via the config mutation.
- All labels via Lingui `t`.

## Frontend Rotting Computation (shared)
- `computeOpportunityRotting({ status, stage, stageChangedAt, config, now })` → `{ isRotting: boolean, daysInStage: number | null }`.
  - `daysInStage = stageChangedAt ? floor((now - stageChangedAt)/86400000) : null`.
  - `isRotting = status === 'OPEN' && stageChangedAt != null && config[stage] != null && daysInStage > config[stage]`.
  - Pure, unit-tested (TDD).
- The config is fetched once (query) and passed in; `now` injected for testability.

## Frontend Display (detail + table + board)
- **Detail:** a rotting badge in the Opportunity record-show header (near the Won/Lost status pill), rendered ONLY when `isRotting` — red/danger token with a clock/flame icon and German text via `t` (e.g. `{days} Tage in Phase`). Not shown for non-rotting or closed deals.
- **Table:** an indicator on rotting rows in the opportunities list — a red icon/marker (e.g. in the record chip or a small overlay), with a tooltip. Reuse the shared util; integrate at the record-table cell/row level without disturbing generic table behavior for other objects (gate on `objectNameSingular === 'opportunity'`).
- **Board:** a marker on rotting kanban cards (flame/red accent). Integrate at the opportunity board-card level, gated to opportunity.
- All three consume the same `computeOpportunityRotting` util + the same fetched config. Visual treatment consistent (red/danger token + a clock/flame icon).

## Non-Goals
- Board drag-to-change-stage (separate sub-project; the hook already resets aging when stage changes by any means).
- Probability, forecast, win-rate.
- Notifications/emails on rotting.
- Per-record threshold overrides (only per-stage).
- Auto-rotting for non-opportunity objects.

## Testing
- Unit (TDD): `computeOpportunityRotting` (open vs closed, missing stageChangedAt, no threshold for stage, boundary at exactly threshold, rotting past threshold). Config default seeding. The stage-change listener's changed-detection logic.
- Integration: the upgrade backfill sets `stageChangedAt = createdAt` on existing rows (verify via Postgres MCP, no reset). The listener sets `stageChangedAt` on a real stage update (boot smoke + a focused check).
- Live verify: change a deal's stage → badge resets; force an old `stageChangedAt` → deal shows rotting on detail + table + board; Won/Lost freezes it; Settings edit changes the threshold and the flag reacts.

## Open Risks / Notes
- Listener write-back recursion: mitigated by only writing `stageChangedAt`; add a focused guard/test.
- Config keyed by stage `value`; if a stage option is deleted, its entry is ignored (never rots). New stage with no entry → never rots until configured.
- Board/table integration points are the least-known; the owning task's first step is to locate the opportunity board-card + table-row render sites and confirm a gated insertion (mirror how the Won/Lost header insertion was located).
