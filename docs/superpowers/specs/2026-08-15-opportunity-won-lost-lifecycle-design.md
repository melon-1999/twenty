# Opportunity Won/Lost Lifecycle Design

**Goal:** Give Opportunities an outcome status (Open/Won/Lost) independent of pipeline stage, with a close timestamp, plus the UI to set and display it — the foundation of Pipedrive-style pipeline semantics.

**Status of prior phases:** Green reskin, German i18n, and Phase 1b component polish (incl. the reusable `StatusPill`) are merged. This is Phase 2, sub-project 1 (of the pipeline-semantics block: won/lost → probability → rotting → days-in-stage → forecast → board drag).

## Decision (from brainstorming)
Model outcome as a **separate `status` SELECT field**, not as stages. A deal keeps its `stage` (pipeline position) AND gains a `status` (Open/Won/Lost). This keeps reporting (win-rate, forecast) clean. `lostReason` is deferred to a follow-up to keep this slice minimal.

## Architecture note (how Twenty defines standard fields — verified)
Twenty uses the "twenty-standard-application" flat-metadata architecture, NOT `@WorkspaceField` decorators:
- Field definitions live in `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-opportunity-standard-flat-field-metadata.util.ts` — `buildOpportunityStandardFlatFieldMetadatas` returns a `Record<AllStandardObjectFieldName<'opportunity'>, FlatFieldMetadata>`, each entry built via `createStandardFieldFlatMetadata({ objectName, workspaceId, context: { fieldName, type, label, ... }, ... })`.
- The entity type shape is `packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts` (plain typed class).
- Field names are constrained by the `AllStandardObjectFieldName<'opportunity'>` union and standard field-ID constants.
- Existing standard fields to mirror: `stage` (SELECT with options NEW/SCREENING/MEETING/PROPOSAL/CUSTOMER), `closeDate` (DATE_TIME), `createdAt` (DATE_TIME, defaultValue 'now').

## Data model (backend)

Add two standard fields to Opportunity:

1. **`status`** — `FieldMetadataType.SELECT`, non-null, default `OPEN`.
   - Options: `OPEN` (label "Open", color gray, position 0, default), `WON` (label "Won", color green, position 1), `LOST` (label "Lost", color red, position 2).
   - `icon: 'IconTargetArrow'` (or similar), `label: msg`Status``.
2. **`closedAt`** — `FieldMetadataType.DATE_TIME`, nullable, no default.
   - `label: msg`Closed at``, `icon: 'IconCalendarCheck'`, `settings.displayFormat` RELATIVE (mirror `closeDate`).

Touchpoints (each verified to exist):
- `compute-opportunity-standard-flat-field-metadata.util.ts` — add the two field entries.
- `opportunity.workspace-entity.ts` — add `status: string;` and `closedAt: Date | null;` to the class.
- `AllStandardObjectFieldName<'opportunity'>` union + the opportunity standard field-ID constants — add `status`, `closedAt` ids.
- Page-layout / view-field configs (`standard-opportunity-page-layout.config.ts`, `compute-standard-opportunity-view-fields.util.ts`) — surface `status` in the record detail summary and as a board/table column; `closedAt` at least in the detail. Keep changes minimal (add the fields, do not reorder everything).
- Dev seeder (`opportunity-data-seeds.constant.ts`) — optional: leave seeded opportunities `OPEN` (default handles it); no change required unless a WON/LOST example is wanted for demos.

## Migration (instance command)
- Generate a **fast** instance command: `npx nx run twenty-server:database:migrate:generate --name addOpportunityWonLostStatus --type fast`.
- The command adds the `status` and `closedAt` fields to the Opportunity standard object across all active/suspended workspaces (both `up` and `down`). Existing opportunities get `status = OPEN`, `closedAt = null`.
- Never edit committed `up`/`down` logic of prior commands. Follow `packages/twenty-server/docs/UPGRADE_COMMANDS.md`.

## GraphQL
- Fields are metadata-driven; after the entity/field changes, regenerate: `npx nx run twenty-front:graphql:generate` (and `--configuration=metadata`). No hand-written resolver — updates go through the standard record-update mutation.

## Frontend

1. **Won/Lost actions on the Opportunity record detail** (`RecordShowPage` header/summary area, Opportunity object only):
   - Two buttons: "Mark as Won" (Button `variant="primary"` green) and "Mark as Lost" (Button `accent="danger"`). When `status` is already WON/LOST, show a single "Reopen" (sets status→OPEN, `closedAt`→null).
   - Clicking sets `status` + `closedAt` in ONE `updateOne` record mutation: Won/Lost → `closedAt = now` (ISO); Reopen → `closedAt = null`. Frontend-driven (no server hook this slice).
   - Gate visibility to the Opportunity object (`objectNameSingular === 'opportunity'`); do not add these buttons to other objects.
2. **Status display via `StatusPill`** (the Phase-1b component):
   - Map `status` → variant: `WON`→`success`, `LOST`→`danger`, `OPEN`→`neutral`.
   - Show the pill in the record detail summary; it also renders wherever the `status` field appears as a chip (the SELECT field's native chip already colors green/red/gray, so the StatusPill is used specifically in the detail summary header, not a replacement for the table cell).

## Testing
- Backend: a unit/integration test that a fresh workspace's Opportunity has the `status` field with the three options and `OPEN` default, and `closedAt` nullable. Instance command applied + verified via the Postgres MCP (columns/enum present).
- Frontend: a component test that the Won/Lost buttons call `updateOne` with `{ status: 'WON', closedAt: <iso> }` / `{ status: 'LOST', ... }` / reopen `{ status: 'OPEN', closedAt: null }`; and that the summary StatusPill maps status→variant correctly.
- Live: on a running app, open an Opportunity, click Won → pill turns green + closedAt set; Lost → red; Reopen → neutral + closedAt cleared. Light + dark.

## Non-goals (this slice)
- `lostReason` (follow-up).
- Win-rate / forecast reporting, days-in-stage, rotting, stage-probability (later sub-projects).
- Board drag → Won/Lost/Move bar (sub-project 6).
- Server-side hook to auto-set `closedAt` (frontend-driven here; a workspace-entity hook is a possible later hardening).
- Never touch `/* @license Enterprise */` files.

## Open questions for the plan
- Exact standard field-ID UUIDs (follow the existing `20202020-...` convention used by sibling opportunity fields).
- Which view-field/page-layout configs must include `status` for it to appear by default without breaking existing view snapshots — the plan's first task should read those configs and decide minimal insertion points.
