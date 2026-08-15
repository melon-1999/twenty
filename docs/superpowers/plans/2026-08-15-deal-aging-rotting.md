# Deal-Aging / Rotting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flag opportunities that have sat too long in their current pipeline stage ("rotting"), with per-stage thresholds editable in Settings, shown on the record detail, the opportunities table, and the kanban board.

**Architecture:** Persist a `stageChangedAt` DATE_TIME on Opportunity, maintained by a server-side database-event listener (reset on any stage change). Store per-stage rotting thresholds as a workspace-scoped `KeyValuePair` JSON map, exposed via a query/mutation and edited in a Settings page. Compute rotting on the frontend with a pure shared util and render a red indicator on detail, table, and board — all gated to the opportunity object.

**Tech Stack:** NestJS, TypeORM, twenty-orm workspace repositories, `@OnDatabaseBatchEvent` listeners, KeyValuePair service, GraphQL code-first, React 18 + Apollo, Jotai, Linaria, Lingui, twenty-ui.

## Global Constraints
- Opportunity-only (`objectNameSingular === 'opportunity'` / `CoreObjectNameSingular.Opportunity`). German instance: all new user-facing strings via Lingui `t` (`import { t } from '@lingui/core/macro'` for component/util bodies so tests need no I18nProvider; the global `i18n` is activated in setupTests). See the plan's precedent commit for the Won/Lost i18n approach.
- Rotting is COMPUTED, never stored. Only `stageChangedAt` is persisted.
- Closed opportunities (`status` WON/LOST) never rot (aging frozen).
- Config keyed by stage option `value` (e.g. `PROPOSAL`), never label.
- Default thresholds seeded when config absent: `{ NEW: 7, SCREENING: 14, MEETING: 14, PROPOSAL: 21, CUSTOMER: 30 }`.
- Field/option IDs in the `20202020-…` UUID namespace. `stageChangedAt` field universalIdentifier: `20202020-5701-4a11-9c31-7e6b2d4f8a12` (verify collision-free with `grep -r`).
- Never edit committed `up`/`down` of prior upgrade commands. Never touch `/* @license Enterprise */` files. Never `database:reset` the active dev DB.
- When adding the standard field: after editing the twenty-shared constant you MUST `npx nx build twenty-shared` before `npx nx typecheck twenty-server`, and regenerate BOTH snapshots (twenty-shared `standardObjectUniversalIdentifiers` and twenty-server `get-standard-object-metadata-related-entity-ids`). See memory `twenty-add-standard-field-workflow`.

---

### Task 1: Backend `stageChangedAt` standard field

**Files:**
- Modify: `packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts` (add `stageChangedAt` to the `opportunity.fields` block)
- Modify: `packages/twenty-shared/src/metadata/__tests__/__snapshots__/standardObjectUniversalIdentifiers.test.ts.snap` (regen)
- Modify: `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-opportunity-standard-flat-field-metadata.util.ts` (add DATE_TIME entry mirroring `closedAt`)
- Modify: `packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts` (add `stageChangedAt: Date | null;`)
- Modify: `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/__tests__/__snapshots__/get-standard-object-metadata-related-entity-ids.util.spec.ts.snap` (regen)

**Interfaces:**
- Produces: opportunity field `stageChangedAt` (DATE_TIME, nullable) for new workspaces; consumed by Task 2 (backfill), Task 3 (hook), Task 6/7 (frontend).

- [ ] **Step 1: Add the field universal identifier** in `standard-object-fields.constant.ts`, in the `opportunity.fields` block right after `closedAt`:
```ts
    stageChangedAt: { universalIdentifier: '20202020-5701-4a11-9c31-7e6b2d4f8a12' },
```
First confirm it's collision-free: `grep -rl "20202020-5701-4a11-9c31-7e6b2d4f8a12" packages/ | grep -v dist` returns nothing.

- [ ] **Step 2: Add the compute-util entry** in `compute-opportunity-standard-flat-field-metadata.util.ts`, mirroring the existing `closedAt` entry exactly, after it:
```ts
  stageChangedAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'stageChangedAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(msg`Stage changed at`),
      description: i18nLabel(msg`When the opportunity last changed stage`),
      icon: 'IconClockPin',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
```
(Match the exact arg names present in the real `closedAt` entry — some builders pass `dependencyFlatEntityMaps`, confirm against the neighbor.)

- [ ] **Step 3: Add the entity field** in `opportunity.workspace-entity.ts` after `closedAt: Date | null;`:
```ts
  stageChangedAt: Date | null;
```

- [ ] **Step 4: Rebuild twenty-shared + regenerate snapshots**

Run:
```bash
npx nx build twenty-shared
cd packages/twenty-shared && npx jest standardObjectUniversalIdentifiers -u && cd ../..
cd packages/twenty-server && npx jest get-standard-object-metadata-related-entity-ids -u && cd ../..
```
Expected: both snapshot suites pass (1/1). Audit the twenty-server snapshot diff: only a new `opportunity.fields.stageChangedAt` entry + a uniform id shift for entries after opportunity — nothing else.

- [ ] **Step 5: Typecheck**

Run: `npx nx typecheck twenty-server`
Expected: 0 errors.

- [ ] **Step 6: Commit**
```bash
git add packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts packages/twenty-shared/src/metadata/__tests__/__snapshots__/standardObjectUniversalIdentifiers.test.ts.snap packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-opportunity-standard-flat-field-metadata.util.ts packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/__tests__/__snapshots__/get-standard-object-metadata-related-entity-ids.util.spec.ts.snap
git commit -m "feat(server): add Opportunity stageChangedAt standard field"
```

---

### Task 2: Backfill `stageChangedAt` to existing workspaces

**Files:**
- Create: `packages/twenty-server/src/database/commands/upgrade-version-command/2-32/2-32-workspace-command-1786500000000-backfill-opportunity-stage-changed-at.command.ts`
- Create: `packages/twenty-server/src/database/commands/upgrade-version-command/2-32/2-32-upgrade-version-command.module.ts`
- Modify: `packages/twenty-server/src/database/commands/upgrade-version-command/workspace-command-provider.module.ts` (register `V2_32_UpgradeVersionCommandModule`)
- Reference (do NOT edit): the Won/Lost backfill `2-31/2-31-workspace-command-1786400000000-add-opportunity-won-lost-fields.command.ts` and its module.

**Interfaces:**
- Consumes: the `stageChangedAt` field definition from Task 1 (universalIdentifier `20202020-5701-4a11-9c31-7e6b2d4f8a12`, derive via `STANDARD_OBJECTS.opportunity.fields.stageChangedAt.universalIdentifier`).
- Produces: existing opportunities get the `stageChangedAt` column, backfilled to their `createdAt`.

- [ ] **Step 1: Copy the 2-31 command as the base.** Read `2-31/…add-opportunity-won-lost-fields.command.ts` and its module. Create the 2-32 command: class `BackfillOpportunityStageChangedAtCommand`, `@RegisteredWorkspaceCommand('2.32.0', 1786500000000)`, `@Command({ name: 'upgrade:2-32:backfill-opportunity-stage-changed-at', description: 'Add the Opportunity stageChangedAt field and backfill it to createdAt on existing rows' })`. Derive constants from `STANDARD_OBJECTS.opportunity` (object universalIdentifier + `.fields.stageChangedAt.universalIdentifier`). First confirm 1786500000000 is strictly greater than every existing timestamp: `grep -rho "RegisteredWorkspaceCommand('[0-9.]*', [0-9]*)" packages/twenty-server/src/database/commands/upgrade-version-command/ | sort -t, -k2 -n | tail -1`.

- [ ] **Step 2: Field-metadata create (idempotent).** Mirror the 2-31 flow: find the opportunity object by universalIdentifier (skip workspace if absent); if `stageChangedAt` field metadata absent, create it via `validateBuildAndRunLegacyWorkspaceMigration({ isSystemBuild: true, fieldMetadata: { flatEntityToCreate: [stageChangedAtFlat], ... } })` (only the one field, no companions — DATE_TIME has none). Guard against re-creating when present.

- [ ] **Step 3: Data backfill of existing rows.** After the field exists, set `stageChangedAt = createdAt` for existing opportunities whose `stageChangedAt` is null. Locate the pattern: read how a prior data-backfill command writes workspace rows (search `upgrade-version-command` for a command that updates record values via the workspace schema — e.g. a `backfill-*` command using the workspace data source / raw SQL `UPDATE "schema"."opportunity" SET "stageChangedAt" = "createdAt" WHERE "stageChangedAt" IS NULL`). Mirror that exact repository/dataSource access. Guard on dry-run.

- [ ] **Step 4: Build + run against the live dev DB (no reset)**
```bash
npx nx run twenty-server:command -- upgrade:2-32:backfill-opportunity-stage-changed-at --dry-run
npx nx run twenty-server:command -- upgrade:2-32:backfill-opportunity-stage-changed-at
```
Expected: dry-run reports it would add the field + backfill N rows; real run succeeds.

- [ ] **Step 5: Verify with Postgres MCP (`mcp__postgres__query`)** — schema is `core` for metadata, `workspace_<hash>` for data:
  - `SELECT name FROM core."fieldMetadata" fm JOIN core."objectMetadata" om ON om.id=fm."objectMetadataId" WHERE om."nameSingular"='opportunity' AND fm.name='stageChangedAt';` → present.
  - `SELECT count(*) FILTER (WHERE "stageChangedAt" IS NOT NULL) AS filled, count(*) AS total, count(*) FILTER (WHERE "stageChangedAt" = "createdAt") AS equal_created FROM workspace_<hash>."opportunity";` → filled = total = equal_created.

- [ ] **Step 6: Typecheck + lint + commit**
```bash
npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server --configuration=fix
git add packages/twenty-server/src/database/commands/upgrade-version-command/
git commit -m "feat(server): backfill Opportunity stageChangedAt to existing workspaces"
```

---

### Task 3: Server hook — maintain `stageChangedAt` on stage change

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/listeners/opportunity-stage-changed.listener.ts`
- Create: `packages/twenty-server/src/modules/opportunity/opportunity.module.ts` (if none exists; else modify to register the listener)
- Modify: the module aggregator that imports feature modules (find where sibling feature modules like calendar/workflow are imported into the workspace modules root, and add opportunity.module there if not already present)
- Test: `packages/twenty-server/src/modules/opportunity/listeners/__tests__/opportunity-stage-changed.listener.spec.ts`

**Interfaces:**
- Consumes: `stageChangedAt` field (Task 1). `@OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED | .CREATED)` from `src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator`; `objectRecordChangedProperties` from `src/engine/core-modules/event-emitter/utils/object-record-changed-properties.util`; event types from `twenty-shared/database-events`.
- Produces: a listener that keeps `stageChangedAt` current. No new exported API.

- [ ] **Step 1: Locate the write-back mechanism.** Read `calendar-event-participant-workspace-member.listener.ts` for the `@OnDatabaseBatchEvent`/`WorkspaceEventBatch`/`objectRecordChangedProperties` shape. Then find how a listener/job obtains a workspace-scoped repository to UPDATE records: search `TwentyORMGlobalManager` (`getRepositoryForWorkspace`-style) or `WorkspaceDataSourceService` usages inside `src/modules/**/listeners` or `**/jobs`. Note the exact injected manager + method to get the `opportunity` repository for `payload.workspaceId`. If the safest pattern is enqueuing a job (as the calendar listener does), create `modules/opportunity/jobs/opportunity-set-stage-changed-at.job.ts` and have the listener enqueue it; otherwise update inline in the listener. Record which you chose.

- [ ] **Step 2: Write the failing test** for the changed-detection logic. Extract the decision into a pure helper `shouldResetStageChangedAt(before, after)` so it is unit-testable without ORM:
```ts
// opportunity-stage-changed.util.ts
export const shouldResetStageChangedAt = (
  before: { stage?: string | null } | undefined,
  after: { stage?: string | null } | undefined,
): boolean =>
  isDefined(before) && isDefined(after) && before.stage !== after.stage;
```
Test (`__tests__/opportunity-stage-changed.util.test.ts`):
```ts
import { shouldResetStageChangedAt } from '../opportunity-stage-changed.util';
describe('shouldResetStageChangedAt', () => {
  it('is true when stage changes', () => {
    expect(shouldResetStageChangedAt({ stage: 'NEW' }, { stage: 'MEETING' })).toBe(true);
  });
  it('is false when stage is unchanged', () => {
    expect(shouldResetStageChangedAt({ stage: 'NEW' }, { stage: 'NEW' })).toBe(false);
  });
  it('is false when a non-stage field (e.g. stageChangedAt) changes', () => {
    expect(shouldResetStageChangedAt({ stage: 'NEW' }, { stage: 'NEW' })).toBe(false);
  });
});
```

- [ ] **Step 3: Run test, verify fail**
Run: `cd packages/twenty-server && npx jest opportunity-stage-changed.util`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement the util**, then verify PASS. The third test encodes the recursion-safety contract: a write that only touches `stageChangedAt` leaves `stage` equal → no reset → no loop.

- [ ] **Step 5: Implement the listener** using the util + the Step-1 write-back:
  - `@OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)`: for each event, if `shouldResetStageChangedAt(before, after)` → set that record's `stageChangedAt = new Date()`.
  - `@OnDatabaseBatchEvent('opportunity', DatabaseEventAction.CREATED)`: set `stageChangedAt = record.createdAt ?? new Date()` for the new record.
  - Recursion-safe by construction (Step 2/4). Add a short WHY comment noting this.

- [ ] **Step 6: Register + boot smoke.** Wire the listener (and job, if used) into `opportunity.module.ts`; ensure that module is imported by the workspace modules root. Boot the server once and confirm `Nest application successfully started` (no circular-DI): `npx nx start twenty-server` (kill after the ready log). If a full boot is too slow in this environment, run the existing server-boot integration/smoke the repo uses.

- [ ] **Step 7: Typecheck + lint + commit**
```bash
npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server --configuration=fix
git add packages/twenty-server/src/modules/opportunity/
git commit -m "feat(server): reset Opportunity stageChangedAt on stage change"
```

---

### Task 4: Rotting config backend (KeyValuePair + query/mutation)

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/types/opportunity-stage-rotting-days-key-value.type.ts` (typed value)
- Modify: the `KeyValueTypesMap`/key registry the workspace-scoped `KeyValuePairService` is parameterized with (Step 1 locates it) — add key `OPPORTUNITY_STAGE_ROTTING_DAYS` → the typed value
- Create: `packages/twenty-server/src/modules/opportunity/services/opportunity-rotting-config.service.ts` (get-with-default + set, wrapping `KeyValuePairService`)
- Create: `packages/twenty-server/src/modules/opportunity/resolvers/opportunity-rotting-config.resolver.ts` (query + mutation)
- Create DTOs under `packages/twenty-server/src/modules/opportunity/dtos/`
- Test: `packages/twenty-server/src/modules/opportunity/services/__tests__/opportunity-rotting-config.service.spec.ts`

**Interfaces:**
- Produces (GraphQL): query `opportunityStageRottingDays: JSON` (returns `{ [stageValue: string]: number }`, seeded defaults if unset) and mutation `updateOpportunityStageRottingDays(input: { config: JSON }): JSON`. Consumed by Task 5 (regen) and Tasks 7/8/9/10 (frontend).
- The default map constant `DEFAULT_OPPORTUNITY_STAGE_ROTTING_DAYS = { NEW: 7, SCREENING: 14, MEETING: 14, PROPOSAL: 21, CUSTOMER: 30 }` lives in the service file and is exported for reuse.

- [ ] **Step 1: Locate the KeyValuePair typing + a workspace-scoped example.** Read `key-value-pair.service.ts` (generic over `KeyValueTypesMap`) and `user-vars.service.ts` (a concrete typed consumer). Decide: reuse `CONFIG_VARIABLE` type with a new registered key, or a small dedicated typed service. Record the exact `get`/`set`/`getByKey` signatures and how workspaceId scoping is passed.

- [ ] **Step 2: Define the typed value** in `opportunity-stage-rotting-days-key-value.type.ts`:
```ts
export type OpportunityStageRottingDays = Record<string, number>;
```
Register the key in the map located in Step 1 (mirror how an existing workspace-scoped key is registered), key string `OPPORTUNITY_STAGE_ROTTING_DAYS`.

- [ ] **Step 3: Write the failing service test** — get returns defaults when unset, returns stored value when set, set persists:
```ts
// mock KeyValuePairService.get to return [] (unset) then the stored value
it('returns defaults when unset', async () => {
  keyValueGet.mockResolvedValue([]);
  expect(await service.getRottingDays(workspaceId)).toEqual(DEFAULT_OPPORTUNITY_STAGE_ROTTING_DAYS);
});
it('returns the stored config when set', async () => {
  keyValueGet.mockResolvedValue([{ NEW: 3 }]);
  expect(await service.getRottingDays(workspaceId)).toEqual({ NEW: 3 });
});
```

- [ ] **Step 4: Run, verify fail; implement `OpportunityRottingConfigService`** (`getRottingDays(workspaceId)` → stored or `DEFAULT_…`; `setRottingDays(workspaceId, config)` → `keyValuePairService.set(...)`), run, verify pass.

- [ ] **Step 5: Add the resolver** (query + mutation) delegating to the service, guarded by `SettingsPermissionGuard(PermissionFlagType.DATA_MODEL)` + workspace auth (mirror a settings resolver in `metadata-modules`). Wire service + resolver into `opportunity.module.ts` (import `KeyValuePairModule`).

- [ ] **Step 6: Boot smoke + typecheck + lint + commit**
```bash
npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server --configuration=fix
git add packages/twenty-server/src/modules/opportunity/
git commit -m "feat(server): opportunity stage rotting-days config (KeyValuePair + resolver)"
```

---

### Task 5: Regenerate GraphQL (frontend types for the config API)

**Files:**
- Modify (generated): `packages/twenty-front/src/generated*/**`

- [ ] **Step 1: Ensure the server is running with the new schema** (Task 4 resolver live). `npx nx start twenty-server` must be up on :3000.

- [ ] **Step 2: Regenerate**
```bash
npx nx run twenty-front:graphql:generate
npx nx run twenty-front:graphql:generate --configuration=metadata
```
Inspect the diff: it must include the new `opportunityStageRottingDays` query + `updateOpportunityStageRottingDays` mutation types. If the diff ALSO contains unrelated drift (e.g. pre-existing `ClientConfig` churn), stage ONLY the files/hunks relevant to this feature — do not pull unrelated drift into the branch (revert unrelated hunks with `git checkout -p`).

- [ ] **Step 3: Typecheck front**
Run: `npx nx typecheck twenty-front`
Expected: 0 errors.

- [ ] **Step 4: Commit**
```bash
git add packages/twenty-front/src/generated*
git commit -m "chore(front): regenerate graphql for opportunity rotting config"
```

---

### Task 6: Frontend rotting compute util (TDD)

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/utils/computeOpportunityRotting.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/utils/__tests__/computeOpportunityRotting.test.ts`

**Interfaces:**
- Produces: `computeOpportunityRotting({ status, stage, stageChangedAt, config, now }): { isRotting: boolean; daysInStage: number | null }`. Consumed by Tasks 7 (detail), 9 (table), 10 (board).
  - `config: Record<string, number>` (stageValue → days). `stageChangedAt: string | null` (ISO). `now: Date`.

- [ ] **Step 1: Write the failing test**
```ts
import { computeOpportunityRotting } from '../computeOpportunityRotting';

const now = new Date('2026-08-15T00:00:00.000Z');
const config = { NEW: 7, PROPOSAL: 21 };
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

describe('computeOpportunityRotting', () => {
  it('rots when open and past the stage threshold', () => {
    expect(computeOpportunityRotting({ status: 'OPEN', stage: 'NEW', stageChangedAt: daysAgo(10), config, now }))
      .toEqual({ isRotting: true, daysInStage: 10 });
  });
  it('does not rot at exactly the threshold', () => {
    expect(computeOpportunityRotting({ status: 'OPEN', stage: 'NEW', stageChangedAt: daysAgo(7), config, now }))
      .toEqual({ isRotting: false, daysInStage: 7 });
  });
  it('never rots when closed', () => {
    expect(computeOpportunityRotting({ status: 'WON', stage: 'NEW', stageChangedAt: daysAgo(30), config, now }).isRotting).toBe(false);
  });
  it('never rots when the stage has no threshold', () => {
    expect(computeOpportunityRotting({ status: 'OPEN', stage: 'MEETING', stageChangedAt: daysAgo(99), config, now }).isRotting).toBe(false);
  });
  it('returns null daysInStage when stageChangedAt is null', () => {
    expect(computeOpportunityRotting({ status: 'OPEN', stage: 'NEW', stageChangedAt: null, config, now }))
      .toEqual({ isRotting: false, daysInStage: null });
  });
});
```

- [ ] **Step 2: Run, verify fail** — `cd packages/twenty-front && npx jest computeOpportunityRotting` → FAIL (not found).

- [ ] **Step 3: Implement**
```ts
type ComputeOpportunityRottingArgs = {
  status: string;
  stage: string;
  stageChangedAt: string | null;
  config: Record<string, number>;
  now: Date;
};

export const computeOpportunityRotting = ({
  status,
  stage,
  stageChangedAt,
  config,
  now,
}: ComputeOpportunityRottingArgs): { isRotting: boolean; daysInStage: number | null } => {
  if (stageChangedAt === null) {
    return { isRotting: false, daysInStage: null };
  }

  const daysInStage = Math.floor(
    (now.getTime() - new Date(stageChangedAt).getTime()) / 86400000,
  );

  const threshold = config[stage];
  const isRotting =
    status === 'OPEN' && threshold !== undefined && daysInStage > threshold;

  return { isRotting, daysInStage };
};
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Typecheck + commit**
```bash
npx nx typecheck twenty-front
git add packages/twenty-front/src/modules/object-record/record-show/opportunity/utils/computeOpportunityRotting.ts packages/twenty-front/src/modules/object-record/record-show/opportunity/utils/__tests__/computeOpportunityRotting.test.ts
git commit -m "feat(front): computeOpportunityRotting util"
```

---

### Task 7: Frontend config hook + detail rotting badge

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/hooks/useOpportunityStageRottingConfig.ts` (Apollo query wrapper; returns the config map, defaults handled server-side)
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/graphql/queries/getOpportunityStageRottingDays.ts` (the gql document)
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityRottingBadge.tsx`
- Modify: `packages/twenty-front/src/pages/object-record/RecordShowPage.tsx` (render the badge in the header, gated to opportunity; read `stageChangedAt` via `recordStoreFamilySelector` alongside the existing `status`/`closedAt` reads)
- Test: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/__tests__/OpportunityRottingBadge.test.tsx`

**Interfaces:**
- Consumes: `computeOpportunityRotting` (Task 6); the `opportunityStageRottingDays` query type (Task 5); `recordStoreFamilySelector` + `useAtomFamilySelectorValue` (as used for `status`/`closedAt` in RecordShowPage).
- Produces: `OpportunityRottingBadge` and `useOpportunityStageRottingConfig`.

- [ ] **Step 1: Write the gql document + hook.** Mirror an existing simple Apollo query hook in the opportunity/adjacent frontend. `useOpportunityStageRottingConfig()` returns `{ config: Record<string, number> }` (empty object while loading).

- [ ] **Step 2: Write the failing badge test** — the badge renders the German day count when rotting, nothing when not:
```tsx
// mock useOpportunityStageRottingConfig -> { config: { NEW: 7 } }
it('shows the rotting day count when rotting', () => {
  render(<OpportunityRottingBadge status="OPEN" stage="NEW" stageChangedAt={<10 days ago ISO>} />);
  expect(screen.getByText(/10 Tage in Phase/)).toBeInTheDocument();
});
it('renders nothing when not rotting', () => {
  const { container } = render(<OpportunityRottingBadge status="OPEN" stage="NEW" stageChangedAt={<2 days ago ISO>} />);
  expect(container).toBeEmptyDOMElement();
});
```
(Compute a fixed ISO from a fixed `new Date()` in the test; the component uses `new Date()` internally for `now` — inject a stable value or accept a small tolerance by asserting the `/Tage in Phase/` text pattern. If injecting `now` keeps the test deterministic, add an optional `now?: Date` prop defaulting to `new Date()`.)

- [ ] **Step 3: Run, verify fail.**

- [ ] **Step 4: Implement `OpportunityRottingBadge`** (props `{ status, stage, stageChangedAt, now? }`): reads config via the hook, calls `computeOpportunityRotting`, and when `isRotting` renders a red/danger Linaria badge with a clock/flame icon (twenty-ui icon) + `t\`${daysInStage} Tage in Phase\``. Returns `null` otherwise. Use `t` from `@lingui/core/macro`.

- [ ] **Step 5: Run test, verify pass.**

- [ ] **Step 6: Wire into RecordShowPage** — add the `stageChangedAt` unconditional read (mirror the `status`/`closedAt` reads) and render `<OpportunityRottingBadge status={opportunityStatus ?? 'OPEN'} stage={opportunityStage ?? ''} stageChangedAt={opportunityStageChangedAt} />` inside the opportunity-gated header block, next to `OpportunityWonLostActions`. Add the `stage` read too (`fieldName: 'stage'`).

- [ ] **Step 7: Typecheck + lint + commit**
```bash
npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix
git add packages/twenty-front/src/modules/object-record/record-show/opportunity/ packages/twenty-front/src/pages/object-record/RecordShowPage.tsx
git commit -m "feat(front): opportunity rotting badge on record detail"
```

---

### Task 8: Settings page — per-stage rotting thresholds

**Files:**
- Create: `packages/twenty-front/src/pages/settings/data-model/SettingsObjectOpportunityRotting.tsx` (the page)
- Create the mutation gql doc + a `useUpdateOpportunityStageRottingDays` hook alongside the Task-7 query hook
- Modify: the settings routes registry to add `/settings/objects/opportunities/rotting` (find where object-settings sub-routes are registered; mirror an existing per-object settings route)
- Modify: the Opportunity object settings page to add a link/entry to the Deal-Aging page (find the object-detail settings sections; mirror an existing section link)
- Test: a form-behavior test asserting save calls the mutation with the edited map

**Interfaces:**
- Consumes: `useOpportunityStageRottingConfig` (Task 7), the stage field options (via `useObjectMetadataItem({ objectNameSingular: 'opportunity' })` → the `stage` field `.options`), the update mutation (Task 5 type).
- Produces: the settings page + `useUpdateOpportunityStageRottingDays`.

- [ ] **Step 1: Locate the settings route + object-settings section patterns.** Read how an existing per-object settings sub-page is routed and how the object settings page lists its sections; mirror both. Confirm the DATA_MODEL permission gating used by sibling settings pages.

- [ ] **Step 2: Build the page.** For each option of the opportunity `stage` field (value + localized label), render a labelled number input pre-filled from the config (`config[value] ?? ''`). A Save button calls `useUpdateOpportunityStageRottingDays({ config })` with the assembled map (omit blank inputs → that stage has no threshold). All copy via `t`. Title "Deal-Aging".

- [ ] **Step 3: Write the form test** (mock the update hook + config hook + object metadata): editing the PROPOSAL input to `30` and clicking Save calls the mutation with a map containing `PROPOSAL: 30`. Run it (RED → implement → GREEN).

- [ ] **Step 4: Typecheck + lint + commit**
```bash
npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix
git add packages/twenty-front/src/pages/settings/data-model/ packages/twenty-front/src/modules/object-record/record-show/opportunity/
git commit -m "feat(front): deal-aging settings page (per-stage rotting days)"
```

- [ ] **Step 5: Live verify** — open `/settings/objects/opportunities/rotting`, set thresholds, Save; reload and confirm persistence.

---

### Task 9: Table rotting indicator

**Files:**
- Modify: the opportunity record-table row/cell render site (Step 1 locates it)
- Possibly create: a small `OpportunityRottingIndicator.tsx` (compact icon-only variant of the badge) reused by table + board
- Test: behavior test for the indicator (icon present when rotting, absent otherwise)

**Interfaces:**
- Consumes: `computeOpportunityRotting` (Task 6), `useOpportunityStageRottingConfig` (Task 7). Reads the row's `status`/`stage`/`stageChangedAt`.
- Produces: `OpportunityRottingIndicator` (icon + tooltip, no text) — reused by Task 10.

- [ ] **Step 1: Locate the table integration point.** Find where record-table rows render per-object content and how to gate on `objectNameSingular === 'opportunity'` without disturbing other objects (mirror any existing per-object table customization; if none exists, the record chip / first-cell adornment is the insertion point). Confirm how to read the row record's `status`/`stage`/`stageChangedAt` in that scope (record store selectors).

- [ ] **Step 2: Build `OpportunityRottingIndicator`** — icon-only red/danger marker (clock/flame) with a tooltip `t\`${daysInStage} Tage in Phase\``; renders `null` when not rotting. TDD: icon present when rotting, absent otherwise.

- [ ] **Step 3: Integrate into the table**, gated to opportunity. Run the test (RED → GREEN).

- [ ] **Step 4: Typecheck + lint + commit**
```bash
npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix
git add packages/twenty-front/src/
git commit -m "feat(front): rotting indicator in opportunities table"
```

---

### Task 10: Board (kanban) rotting indicator

**Files:**
- Modify: the opportunity record-board card render site (Step 1 locates it)
- Reuse: `OpportunityRottingIndicator` (Task 9)
- Test: the board-card gated rendering of the indicator

**Interfaces:**
- Consumes: `OpportunityRottingIndicator` (Task 9), `computeOpportunityRotting`, `useOpportunityStageRottingConfig`.

- [ ] **Step 1: Locate the board-card integration point.** Find the record-board card component and how per-object content is (or can be) gated to opportunity; confirm how to read the card record's `status`/`stage`/`stageChangedAt`.

- [ ] **Step 2: Render `OpportunityRottingIndicator` on rotting opportunity cards**, gated to opportunity. TDD the gated presence/absence.

- [ ] **Step 3: Typecheck + lint + commit**
```bash
npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix
git add packages/twenty-front/src/
git commit -m "feat(front): rotting indicator on opportunity board cards"
```

- [ ] **Step 4: Live verify (full feature)** — app running, user logged in: change a deal's stage → badge resets; set an old `stageChangedAt` (via Postgres update in a scratch record, or lower a stage threshold in Settings) → the deal shows rotting on detail + table + board; mark it Won/Lost → rotting disappears; adjust a threshold in Settings → the flag reacts. Screenshot detail + board.

---

## Self-Review notes
- Spec coverage: `stageChangedAt` field (spec Data Model → T1), backfill (spec Data Model → T2), server hook (spec Server Hook → T3), config storage + API (spec Rotting Config + Config API → T4), GraphQL regen (→ T5), compute util (spec Frontend Computation → T6), detail badge (spec Frontend Display → T7), settings UI (spec Settings UI → T8), table (→ T9), board (→ T10). Closed-freeze + per-stage-value keying enforced in T6's util. Non-goals (board-drag, probability, notifications, per-record overrides) untouched.
- Type consistency: `computeOpportunityRotting` signature identical across T6/T7/T9/T10; config is `Record<string, number>` throughout; config key `OPPORTUNITY_STAGE_ROTTING_DAYS` and defaults `{NEW:7,SCREENING:14,MEETING:14,PROPOSAL:21,CUSTOMER:30}` identical in T4 spec + Global Constraints.
- Known unknowns pushed to the first step of the owning task: the listener write-back mechanism (T3.1), the KeyValuePair typed-key registration (T4.1), the settings route/section pattern (T8.1), and the table/board integration points (T9.1/T10.1) — each a concrete "read this file, mirror this pattern" step, not a deferred requirement.
- TDD: pure units (T3 util, T6 util) and component behavior (T7/T8/T9/T10) are test-first; backend field/backfill/hook verified via typecheck + snapshots + Postgres MCP + boot smoke.
