# Opportunity Pipeline Analysis (Days-in-Stage Slice B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A historical pipeline report at `/opportunities/pipeline-analysis` showing, per stage, deals-reached count, average historical time-in-stage, and conversion-to-next-stage rate — powered by a new `stageHistory` JSON field maintained on every stage change.

**Architecture:** New `stageHistory` RAW_JSON field on Opportunity; the already-worker-registered stage-change job is extended with an idempotent history reconcile (no new job/module); a 2.36.0 command creates the field and backfills the current stage; frontend adds a pure aggregation util + table page mirroring the merged report pattern.

**Tech Stack:** NestJS + twenty-orm (backend), React 18 + TypeScript strict + Jotai + Linaria + Lingui + Jest (frontend), Nx monorepo.

## Global Constraints

- Caveman chat prose only; code/commits/PRs in normal English.
- No signatures / Co-Authored-By / "Generated with Claude" tags anywhere.
- Never modify `/* @license Enterprise */` files.
- Named exports only, no default exports. Functional components only. `type` over `interface`. String literals over enums (except GraphQL/metadata enums). No `any`. No abbreviations. Short `//` comments, WHY not WHAT, only when non-obvious.
- Stage option VALUES are canonical English (`NEW/SCREENING/MEETING/PROPOSAL/CUSTOMER`); the `enteredAt` stored is ISO. Status is not filtered on the pipeline page (historical funnel includes won/lost).
- stageHistory is a chronological array `{ stage: string; enteredAt: string }[]`, oldest first; the last entry's stage equals the deal's current stage.
- Worker jobs must stay registered in the worker graph via `OpportunityJobModule` — this task extends the EXISTING `OpportunitySetStageChangedAtJob` (already registered), it does not add a new job.
- After backend code: `npx nx build twenty-shared` (constant changed), `npx nx typecheck twenty-server`, `npx nx lint:diff-with-main twenty-server` = 0. After frontend: `rm -rf packages/twenty-front/node_modules/.vite`, `npx nx typecheck twenty-front`, `npx nx lint:diff-with-main twenty-front` = 0. Run `nx fmt` on the touched project if oxfmt/oxlint flags files.
- Icon: `IconTrendingUp` (verified present in `twenty-ui/icon`). Icon for the field: `IconHistory` (verified present).
- Next command version: `2.36.0`, timestamp `1786900000000` (> the 2.35 `1786800000000`).
- Field universalIdentifier: `20202020-5701-4a11-9c31-7e6b2d4f8a16` (next after lostReason `...8a15`).

---

### Task 1: `stageHistory` field metadata + entity mirror + snapshots

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/types/opportunity-stage-history-entry.type.ts`
- Modify: `packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts` (add UID after `lostReason`)
- Modify: `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-opportunity-standard-flat-field-metadata.util.ts` (add field block after the `lostReason` block, before `position`)
- Modify: `packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts` (add mirror field)
- Update snapshots: `standardObjectUniversalIdentifiers` and `get-standard-object-metadata-related-entity-ids` via `jest -u`

**Interfaces:**
- Produces: `type OpportunityStageHistoryEntry = { stage: string; enteredAt: string }`; Opportunity field `stageHistory` (RAW_JSON) with UID `...8a16`; entity mirror `stageHistory: OpportunityStageHistoryEntry[] | null`.

- [ ] **Step 1: Create the shared entry type**

`opportunity-stage-history-entry.type.ts`:
```ts
export type OpportunityStageHistoryEntry = {
  stage: string;
  enteredAt: string;
};
```

- [ ] **Step 2: Add the universalIdentifier constant**

In `standard-object-fields.constant.ts`, directly after the `lostReason: { universalIdentifier: '20202020-5701-4a11-9c31-7e6b2d4f8a15' },` entry, add:
```ts
    stageHistory: {
      universalIdentifier: '20202020-5701-4a11-9c31-7e6b2d4f8a16',
    },
```

- [ ] **Step 3: Add the field block in the compute util**

In `compute-opportunity-standard-flat-field-metadata.util.ts`, after the closing `}),` of the `lostReason:` block and before the `position:` block, add:
```ts
  stageHistory: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'stageHistory',
      type: FieldMetadataType.RAW_JSON,
      label: i18nLabel(msg`Stage history`),
      description: i18nLabel(msg`Chronological log of stage entries`),
      icon: 'IconHistory',
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
```

- [ ] **Step 4: Add the entity mirror field**

In `opportunity.workspace-entity.ts`, add the type import at the top (with the other type imports):
```ts
import { type OpportunityStageHistoryEntry } from 'src/modules/opportunity/types/opportunity-stage-history-entry.type';
```
and add the field after `lostReason: string | null;`:
```ts
  stageHistory: OpportunityStageHistoryEntry[] | null;
```

- [ ] **Step 5: Build twenty-shared**

Run: `npx nx build twenty-shared`
Expected: build success (the constant is consumed from the built package).

- [ ] **Step 6: Regenerate the two snapshots**

Run:
```bash
cd packages/twenty-server && npx jest standardObjectUniversalIdentifiers -u && npx jest get-standard-object-metadata-related-entity-ids -u
```
Expected: both snapshot suites pass; the diff is additive (one new `stageHistory` identifier / related-entity id). Inspect `git diff` on the `.snap` files to confirm ONLY additive changes.

- [ ] **Step 7: Typecheck + lint**

Run: `npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server`
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-opportunity-standard-flat-field-metadata.util.ts packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts packages/twenty-server/src/modules/opportunity/types packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/**/__snapshots__ packages/twenty-server/**/*.snap
git commit -m "feat(server): add opportunity stageHistory field"
```

---

### Task 2: `reconcileStageHistory` pure helper + unit test

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/listeners/opportunity-stage-history.util.ts`
- Test: `packages/twenty-server/src/modules/opportunity/listeners/__tests__/opportunity-stage-history.util.spec.ts`

**Interfaces:**
- Consumes: `OpportunityStageHistoryEntry` (Task 1).
- Produces: `reconcileStageHistory(currentStage, history, enteredAtIso): OpportunityStageHistoryEntry[] | null` — returns the next array when it must change, `null` when no write is needed (current stage already equals the last entry).

- [ ] **Step 1: Write the failing test**

```ts
import { reconcileStageHistory } from '../opportunity-stage-history.util';

describe('reconcileStageHistory', () => {
  const ENTERED_AT = '2026-08-30T10:00:00.000Z';

  it('seeds a single entry when history is null', () => {
    expect(reconcileStageHistory('NEW', null, ENTERED_AT)).toEqual([
      { stage: 'NEW', enteredAt: ENTERED_AT },
    ]);
  });

  it('seeds a single entry when history is empty', () => {
    expect(reconcileStageHistory('NEW', [], ENTERED_AT)).toEqual([
      { stage: 'NEW', enteredAt: ENTERED_AT },
    ]);
  });

  it('appends when the current stage differs from the last entry', () => {
    const history = [{ stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' }];
    expect(reconcileStageHistory('SCREENING', history, ENTERED_AT)).toEqual([
      { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
      { stage: 'SCREENING', enteredAt: ENTERED_AT },
    ]);
  });

  it('returns null when the current stage already equals the last entry', () => {
    const history = [
      { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
      { stage: 'SCREENING', enteredAt: '2026-08-10T00:00:00.000Z' },
    ];
    expect(reconcileStageHistory('SCREENING', history, ENTERED_AT)).toBeNull();
  });

  it('does not mutate the input history array', () => {
    const history = [{ stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' }];
    reconcileStageHistory('SCREENING', history, ENTERED_AT);
    expect(history).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/twenty-server && npx jest opportunity-stage-history.util`
Expected: FAIL — "Cannot find module '../opportunity-stage-history.util'".

- [ ] **Step 3: Write minimal implementation**

```ts
import { type OpportunityStageHistoryEntry } from 'src/modules/opportunity/types/opportunity-stage-history-entry.type';

// Returns the next stageHistory when it must change, or null when the current
// stage already matches the last entry (idempotent: no write needed then).
export const reconcileStageHistory = (
  currentStage: string,
  history: OpportunityStageHistoryEntry[] | null | undefined,
  enteredAtIso: string,
): OpportunityStageHistoryEntry[] | null => {
  const safeHistory = history ?? [];
  const lastEntry = safeHistory[safeHistory.length - 1];

  if (lastEntry?.stage === currentStage) {
    return null;
  }

  return [...safeHistory, { stage: currentStage, enteredAt: enteredAtIso }];
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/twenty-server && npx jest opportunity-stage-history.util`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck + lint + commit**

Run: `npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server`
```bash
git add packages/twenty-server/src/modules/opportunity/listeners/opportunity-stage-history.util.ts packages/twenty-server/src/modules/opportunity/listeners/__tests__/opportunity-stage-history.util.spec.ts
git commit -m "feat(server): reconcileStageHistory helper"
```

---

### Task 3: Extend `OpportunitySetStageChangedAtJob` to maintain stageHistory

**Files:**
- Modify: `packages/twenty-server/src/modules/opportunity/jobs/opportunity-set-stage-changed-at.job.ts`

**Interfaces:**
- Consumes: `reconcileStageHistory` (Task 2), `OpportunityStageHistoryEntry` mirror field (Task 1).
- The job's data contract (`OpportunitySetStageChangedAtJobData`) is unchanged; the listener is unchanged.

**Context:** The listener already enqueues this job on opportunity create (with `createdAt`) and on stage change (with `now`), passing that timestamp as `stageChangedAt`. The job currently only writes `stageChangedAt`. Extend it to also reconcile `stageHistory`, using the same `stageChangedAt` timestamp as the entry's `enteredAt` (so `enteredAt` and `stageChangedAt` stay consistent). Recursion safety is preserved: this write sets `stageChangedAt` + `stageHistory` but never `stage`, so the listener's `shouldResetStageChangedAt` guard (before.stage !== after.stage) stays false and the job never re-enqueues itself.

- [ ] **Step 1: Update the job handler**

Replace the handler body so it fetches the opportunity, reconciles history, and writes both fields in one update. The full file becomes:

```ts
import { Logger, Scope } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { reconcileStageHistory } from 'src/modules/opportunity/listeners/opportunity-stage-history.util';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';

export type OpportunitySetStageChangedAtJobData = {
  workspaceId: string;
  opportunityId: string;
  stageChangedAt: string;
};

@Processor({
  queueName: MessageQueue.entityEventsToDbQueue,
  scope: Scope.REQUEST,
})
export class OpportunitySetStageChangedAtJob {
  protected readonly logger = new Logger(OpportunitySetStageChangedAtJob.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  @Process(OpportunitySetStageChangedAtJob.name)
  async handle({
    workspaceId,
    opportunityId,
    stageChangedAt,
  }: OpportunitySetStageChangedAtJobData): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const opportunityRepository =
        await this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
          workspaceId,
          'opportunity',
          { shouldBypassPermissionChecks: true },
        );

      const opportunity = await opportunityRepository.findOne({
        where: { id: opportunityId },
      });

      if (!isDefined(opportunity)) {
        return;
      }

      // Same timestamp for enteredAt and stageChangedAt keeps the history
      // entry aligned with the stageChangedAt column.
      const nextStageHistory = reconcileStageHistory(
        opportunity.stage,
        opportunity.stageHistory,
        stageChangedAt,
      );

      await opportunityRepository.update(
        { id: opportunityId },
        {
          stageChangedAt: new Date(stageChangedAt),
          ...(isDefined(nextStageHistory)
            ? { stageHistory: nextStageHistory }
            : {}),
        },
      );
    }, authContext);
  }
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server`
Expected: 0 errors. (No job-level unit test — these DI+workspace-ORM jobs have none by precedent; the reconcile logic is unit-tested in Task 2 and the wiring is live-verified at the end.)

- [ ] **Step 3: Commit**

```bash
git add packages/twenty-server/src/modules/opportunity/jobs/opportunity-set-stage-changed-at.job.ts
git commit -m "feat(server): maintain opportunity stageHistory on stage change"
```

---

### Task 4: Backfill command 2.36.0 (create field + seed stageHistory)

**Files:**
- Create: `packages/twenty-server/src/database/commands/upgrade-version-command/2-36/2-36-workspace-command-1786900000000-backfill-opportunity-stage-history.command.ts`
- Create: `packages/twenty-server/src/database/commands/upgrade-version-command/2-36/2-36-upgrade-version-command.module.ts`
- Modify: `packages/twenty-server/src/database/commands/upgrade-version-command/workspace-command-provider.module.ts` (register module)
- Modify: `packages/twenty-server/src/engine/core-modules/upgrade/constants/twenty-next-versions.constant.ts` (add `'2.36.0'`)

**Context:** Model this on the 2.34 command (`2-34-...-backfill-opportunity-probability.command.ts`), which both creates fields via the legacy-migration helper and backfills rows via `dataSource.query`. Here: create the `stageHistory` field if absent, then seed `stageHistory` for rows where it is null.

- [ ] **Step 1: Add the version constant**

In `twenty-next-versions.constant.ts`, add `'2.36.0',` to the `TWENTY_NEXT_VERSIONS` array after `'2.35.0',`. (The file header says auto-generated, but each prior version was added here to register; follow that precedent.)

- [ ] **Step 2: Write the command**

Read the full 2.34 command first as the structural template (field-create-if-missing via `validateBuildAndRunLegacyWorkspaceMigration` in a private helper, plus a `dataSource.query` backfill in `runOnWorkspace`). Reproduce that structure with these differences:
- `@RegisteredWorkspaceCommand('2.36.0', 1786900000000)`.
- name `upgrade:2-36:backfill-opportunity-stage-history`, description `Add the Opportunity stageHistory field and seed it on existing rows`.
- The field-to-create is the `stageHistory` field: `const STAGE_HISTORY_FIELD_UNIVERSAL_IDENTIFIER = OPPORTUNITY.fields.stageHistory.universalIdentifier;`.
- The backfill query (after the field exists and not dry-run), using the workspace `schemaName` and `dataSource` exactly as the 2.34 command obtains them:
  ```ts
  const stageHistoryResult = await dataSource.query(
    `UPDATE "${schemaName}"."opportunity"
     SET "stageHistory" = jsonb_build_array(
       jsonb_build_object(
         'stage', "stage",
         'enteredAt', to_char(
           COALESCE("stageChangedAt", "createdAt") AT TIME ZONE 'UTC',
           'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
         )
       )
     )
     WHERE "stageHistory" IS NULL`,
  );

  this.logger.log(
    `Backfilled stageHistory for ${stageHistoryResult?.[1] ?? 0} opportunities in workspace ${workspaceId}`,
  );
  ```
  This seeds one entry `{ stage: <current stage>, enteredAt: <stageChangedAt ?? createdAt as ISO> }` for rows still null; rows already populated are skipped by `WHERE "stageHistory" IS NULL` (idempotent). Confirm the RAW_JSON column name is exactly `stageHistory` by inspecting the workspace schema after Task 1's field creation (Postgres MCP, read-only) before finalizing the SQL; adjust the quoted identifier if the generated column name differs.
- Follow the 2.34 command's dry-run guards, `dataSource` presence check, and field-create helper verbatim in shape (only the universalIdentifier and log strings change). The field-create path uses `validateBuildAndRunLegacyWorkspaceMigration` — reuse the 2.34/2.35 comment noting stageHistory has no engine-owned companions (not searchable, not label identifier, no standard view fields).

- [ ] **Step 3: Write the version module**

`2-36-upgrade-version-command.module.ts`, modeled on `2-35-upgrade-version-command.module.ts` (same imports: `ApplicationModule`, `WorkspaceCacheModule`, `WorkspaceIteratorModule`, `WorkspaceMigrationModule`, `WorkspaceSchemaManagerModule`, `WorkspaceMigrationRunnerModule`), providing the new command class, exported as `V2_36_UpgradeVersionCommandModule`.

- [ ] **Step 4: Register in the provider module**

In `workspace-command-provider.module.ts`, add the import and append `V2_36_UpgradeVersionCommandModule,` after `V2_35_UpgradeVersionCommandModule,` in the `imports` array.

- [ ] **Step 5: Typecheck + lint**

Run: `npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server`
Expected: 0 errors.

- [ ] **Step 6: Run the command against the dev workspace (dry-run then real)**

```bash
npx nx run twenty-server:command -- upgrade:2-36:backfill-opportunity-stage-history --dry-run
npx nx run twenty-server:command -- upgrade:2-36:backfill-opportunity-stage-history
```
Expected: dry-run logs the intended action; the real run creates the field (if missing) and logs a backfilled count. Verify via Postgres MCP (read-only) that `stageHistory` is a one-entry array per row with `stage` = current stage and `enteredAt` ≈ `stageChangedAt`.

- [ ] **Step 7: Commit**

```bash
git add packages/twenty-server/src/database/commands/upgrade-version-command/2-36 packages/twenty-server/src/database/commands/upgrade-version-command/workspace-command-provider.module.ts packages/twenty-server/src/engine/core-modules/upgrade/constants/twenty-next-versions.constant.ts
git commit -m "feat(server): backfill opportunity stageHistory command 2.36.0"
```

---

### Task 5: Frontend pure util `computeStagePipelineBreakdown`

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/opportunity-pipeline-analysis/utils/computeStagePipelineBreakdown.ts`
- Test: `packages/twenty-front/src/modules/object-record/opportunity-pipeline-analysis/utils/__tests__/computeStagePipelineBreakdown.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type StageOption = { value: string; label: string };
  type StageHistoryEntry = { stage: string; enteredAt: string };
  type PipelineDealInput = { stageHistory: StageHistoryEntry[] | null };
  export type StagePipelineBucket = { stage: string; label: string; reachedCount: number; averageDurationDays: number | null; conversionToNextRate: number | null };
  export type StagePipelineBreakdownResult = { buckets: StagePipelineBucket[] };
  export const computeStagePipelineBreakdown = (orderedStages: StageOption[], deals: PipelineDealInput[]): StagePipelineBreakdownResult;
  ```

- [ ] **Step 1: Write the failing test**

```ts
import {
  computeStagePipelineBreakdown,
  type StagePipelineBucket,
} from '../computeStagePipelineBreakdown';

const STAGES = [
  { value: 'NEW', label: 'New' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'MEETING', label: 'Meeting' },
];

const byStage = (result: { buckets: StagePipelineBucket[] }) =>
  Object.fromEntries(result.buckets.map((bucket) => [bucket.stage, bucket]));

describe('computeStagePipelineBreakdown', () => {
  it('returns one bucket per stage in order, all empty for no deals', () => {
    const result = computeStagePipelineBreakdown(STAGES, []);
    expect(result.buckets.map((bucket) => bucket.stage)).toEqual([
      'NEW',
      'SCREENING',
      'MEETING',
    ]);
    expect(
      result.buckets.every(
        (bucket) =>
          bucket.reachedCount === 0 &&
          bucket.averageDurationDays === null &&
          bucket.conversionToNextRate === null,
      ),
    ).toBe(true);
  });

  it('counts reached deals monotonically, tolerating skipped stages', () => {
    // Deal A reached MEETING (skipping SCREENING); Deal B stopped at SCREENING.
    const result = computeStagePipelineBreakdown(STAGES, [
      {
        stageHistory: [
          { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
          { stage: 'MEETING', enteredAt: '2026-08-05T00:00:00.000Z' },
        ],
      },
      {
        stageHistory: [
          { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
          { stage: 'SCREENING', enteredAt: '2026-08-03T00:00:00.000Z' },
        ],
      },
    ]);
    const buckets = byStage(result);
    expect(buckets.NEW.reachedCount).toBe(2);
    expect(buckets.SCREENING.reachedCount).toBe(1);
    expect(buckets.MEETING.reachedCount).toBe(1);
  });

  it('averages historical duration over completed passes, excluding the open last stage', () => {
    const result = computeStagePipelineBreakdown(STAGES, [
      {
        stageHistory: [
          { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
          { stage: 'SCREENING', enteredAt: '2026-08-03T00:00:00.000Z' },
          { stage: 'MEETING', enteredAt: '2026-08-09T00:00:00.000Z' },
        ],
      },
    ]);
    const buckets = byStage(result);
    // NEW: 2 days, SCREENING: 6 days, MEETING: still open -> null
    expect(buckets.NEW.averageDurationDays).toBe(2);
    expect(buckets.SCREENING.averageDurationDays).toBe(6);
    expect(buckets.MEETING.averageDurationDays).toBeNull();
  });

  it('computes conversion as reached[i+1]/reached[i], null for the last stage and for divide-by-zero', () => {
    const result = computeStagePipelineBreakdown(STAGES, [
      {
        stageHistory: [
          { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
          { stage: 'SCREENING', enteredAt: '2026-08-03T00:00:00.000Z' },
        ],
      },
      {
        stageHistory: [{ stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' }],
      },
    ]);
    const buckets = byStage(result);
    // reached NEW=2, SCREENING=1, MEETING=0
    expect(buckets.NEW.conversionToNextRate).toBe(0.5);
    expect(buckets.SCREENING.conversionToNextRate).toBe(0); // 0/1
    expect(buckets.MEETING.conversionToNextRate).toBeNull(); // last stage
  });

  it('floors per-pass duration at 0 and ignores unknown-stage entries', () => {
    const result = computeStagePipelineBreakdown(STAGES, [
      {
        stageHistory: [
          { stage: 'NEW', enteredAt: '2026-08-01T12:00:00.000Z' },
          { stage: 'ARCHIVED', enteredAt: '2026-08-01T18:00:00.000Z' },
          { stage: 'SCREENING', enteredAt: '2026-08-01T20:00:00.000Z' },
        ],
      },
    ]);
    const buckets = byStage(result);
    // ARCHIVED unknown -> dropped. NEW->SCREENING span 8h -> floor 0.
    expect(buckets.NEW.averageDurationDays).toBe(0);
    expect(buckets.NEW.reachedCount).toBe(1);
    expect(buckets.SCREENING.reachedCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/twenty-front && npx jest computeStagePipelineBreakdown`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
const MS_PER_DAY = 1000 * 60 * 60 * 24;

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
): StagePipelineBreakdownResult => {
  const positionByStage = new Map(
    orderedStages.map((option, index) => [option.value, index]),
  );

  const reachedCounts = orderedStages.map(() => 0);
  const durationSamples: number[][] = orderedStages.map(() => []);

  for (const deal of deals) {
    const knownEntries = (deal.stageHistory ?? [])
      .filter((entry) => positionByStage.has(entry.stage))
      .slice()
      .sort((a, b) => a.enteredAt.localeCompare(b.enteredAt));

    if (knownEntries.length === 0) {
      continue;
    }

    let maxReachedPosition = -1;
    for (const entry of knownEntries) {
      const position = positionByStage.get(entry.stage) ?? -1;
      if (position > maxReachedPosition) {
        maxReachedPosition = position;
      }
    }
    for (let index = 0; index <= maxReachedPosition; index++) {
      reachedCounts[index] += 1;
    }

    for (let index = 0; index < knownEntries.length - 1; index++) {
      const fromPosition = positionByStage.get(knownEntries[index].stage) ?? -1;
      const days = Math.max(
        0,
        Math.floor(
          (new Date(knownEntries[index + 1].enteredAt).getTime() -
            new Date(knownEntries[index].enteredAt).getTime()) /
            MS_PER_DAY,
        ),
      );
      durationSamples[fromPosition].push(days);
    }
  }

  const buckets = orderedStages.map((option, index): StagePipelineBucket => {
    const samples = durationSamples[index];
    const averageDurationDays =
      samples.length > 0
        ? samples.reduce((sum, value) => sum + value, 0) / samples.length
        : null;

    const isLast = index === orderedStages.length - 1;
    let conversionToNextRate: number | null = null;
    // Last stage has no "next"; divide-by-zero (nobody reached this stage)
    // also stays null.
    if (!isLast && reachedCounts[index] > 0) {
      conversionToNextRate = reachedCounts[index + 1] / reachedCounts[index];
    }

    return {
      stage: option.value,
      label: option.label,
      reachedCount: reachedCounts[index],
      averageDurationDays,
      conversionToNextRate,
    };
  });

  return { buckets };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/twenty-front && npx jest computeStagePipelineBreakdown`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck + lint + commit**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front` (run `nx fmt twenty-front` if flagged).
```bash
git add packages/twenty-front/src/modules/object-record/opportunity-pipeline-analysis/utils
git commit -m "feat(front): opportunity stage pipeline breakdown util"
```

---

### Task 6: Table + page + AppPath + route

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/opportunity-pipeline-analysis/components/OpportunityPipelineAnalysisTable.tsx`
- Create: `packages/twenty-front/src/pages/opportunity-pipeline-analysis/OpportunityPipelineAnalysisPage.tsx`
- Modify: `packages/twenty-shared/src/types/AppPath.ts` (add member after `StageAnalyticsPage`)
- Modify: `packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx` (lazy import + route)

**Interfaces:**
- Consumes: `computeStagePipelineBreakdown`, `StagePipelineBreakdownResult` (Task 5).
- Produces: `OpportunityPipelineAnalysisTable`, `OpportunityPipelineAnalysisPage`, `AppPath.PipelineAnalysisPage`.

- [ ] **Step 1: Add the AppPath enum member**

In `packages/twenty-shared/src/types/AppPath.ts`, after `StageAnalyticsPage = '/opportunities/stage-analytics',`, add:
```ts
  PipelineAnalysisPage = '/opportunities/pipeline-analysis',
```

- [ ] **Step 2: Rebuild twenty-shared**

Run: `npx nx build twenty-shared`

- [ ] **Step 3: Create the table component**

`OpportunityPipelineAnalysisTable.tsx`:
```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';

import { type StagePipelineBreakdownResult } from '@/object-record/opportunity-pipeline-analysis/utils/computeStagePipelineBreakdown';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const StyledNumeric = styled.span`
  font-variant-numeric: tabular-nums;
`;

type OpportunityPipelineAnalysisTableProps = {
  result: StagePipelineBreakdownResult;
};

export const OpportunityPipelineAnalysisTable = ({
  result,
}: OpportunityPipelineAnalysisTableProps) => {
  const formatDays = (averageDurationDays: number | null) =>
    averageDurationDays === null ? '-' : String(Math.round(averageDurationDays));

  const formatConversion = (conversionToNextRate: number | null) =>
    conversionToNextRate === null
      ? '-'
      : `${Math.round(conversionToNextRate * 100)}%`;

  return (
    <Table>
      <TableRow>
        <TableHeader>{t`Phase`}</TableHeader>
        <TableHeader>{t`Erreicht`}</TableHeader>
        <TableHeader>{t`Ø Dauer (Tage)`}</TableHeader>
        <TableHeader>{t`Konversion → nächste`}</TableHeader>
      </TableRow>
      <TableBody>
        {result.buckets.map((bucket) => (
          <TableRow key={bucket.stage}>
            <TableCell>{bucket.label}</TableCell>
            <TableCell>
              <StyledNumeric>{bucket.reachedCount}</StyledNumeric>
            </TableCell>
            <TableCell>
              <StyledNumeric>
                {formatDays(bucket.averageDurationDays)}
              </StyledNumeric>
            </TableCell>
            <TableCell>
              <StyledNumeric>
                {formatConversion(bucket.conversionToNextRate)}
              </StyledNumeric>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

- [ ] **Step 4: Create the page**

`OpportunityPipelineAnalysisPage.tsx` (mirrors the Slice-A page, but NO status filter and fetching `stageHistory`):
```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { IconTrendingUp } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { OpportunityPipelineAnalysisTable } from '@/object-record/opportunity-pipeline-analysis/components/OpportunityPipelineAnalysisTable';
import { computeStagePipelineBreakdown } from '@/object-record/opportunity-pipeline-analysis/utils/computeStagePipelineBreakdown';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

type StageHistoryEntry = { stage: string; enteredAt: string };

type OpportunityPipelineRecord = {
  id: string;
  __typename: 'Opportunity';
  stageHistory: StageHistoryEntry[] | null;
};

export const OpportunityPipelineAnalysisPage = () => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const stageField = objectMetadataItem.fields.find(
    (field) => field.name === 'stage',
  );

  const orderedStages = [...(stageField?.options ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((option) => ({ value: option.value, label: option.label }));

  const { records, loading } = useFindManyRecords<OpportunityPipelineRecord>({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    recordGqlFields: { stageHistory: true },
    limit: 1000,
  });

  const result = computeStagePipelineBreakdown(
    orderedStages,
    records.map((record) => ({ stageHistory: record.stageHistory })),
  );

  const hasReachedDeals = result.buckets.some(
    (bucket) => bucket.reachedCount > 0,
  );

  return (
    <PageContainer>
      <PageHeader title={t`Pipeline-Analyse`} Icon={IconTrendingUp} />
      <StyledBody>
        {loading ? null : !hasReachedDeals ? (
          <StyledEmpty>{t`Keine Opportunities.`}</StyledEmpty>
        ) : (
          <OpportunityPipelineAnalysisTable result={result} />
        )}
      </StyledBody>
    </PageContainer>
  );
};
```

- [ ] **Step 5: Register the lazy route**

In `useCreateWorkspaceAppRouter.tsx`, after the `OpportunityStageDurationReportPage` lazy block, add:
```tsx
const OpportunityPipelineAnalysisPage = lazy(() =>
  import(
    '~/pages/opportunity-pipeline-analysis/OpportunityPipelineAnalysisPage'
  ).then((module) => ({
    default: module.OpportunityPipelineAnalysisPage,
  })),
);
```
and after the `AppPath.StageAnalyticsPage` `<Route>` block, add:
```tsx
              <Route
                path={AppPath.PipelineAnalysisPage}
                element={
                  <LazyRoute>
                    <OpportunityPipelineAnalysisPage />
                  </LazyRoute>
                }
              />
```

- [ ] **Step 6: Clear vite cache + typecheck + lint**

```bash
rm -rf packages/twenty-front/node_modules/.vite
npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front
```
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add packages/twenty-shared/src/types/AppPath.ts packages/twenty-front/src/modules/object-record/opportunity-pipeline-analysis/components packages/twenty-front/src/pages/opportunity-pipeline-analysis packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx
git commit -m "feat(front): opportunity pipeline analysis page + route"
```

---

### Task 7: Navigation link + de-DE strings

**Files:**
- Modify: `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx`
- Modify: `packages/twenty-front/src/locales/de-DE.po`

- [ ] **Step 1: Add the gated nav item**

Extend the icon import:
```tsx
import { IconChartBar, IconHourglassHigh, IconTrendingDown, IconTrendingUp } from 'twenty-ui/icon';
```
Add after the "Phasen-Dauer" `NavigationDrawerItem`, still inside the `{hasOpportunityObject && (<>...</>)}` fragment:
```tsx
          <NavigationDrawerItem
            label={t`Pipeline-Analyse`}
            to={AppPath.PipelineAnalysisPage}
            Icon={IconTrendingUp}
            active={pathname === AppPath.PipelineAnalysisPage}
          />
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front`
Expected: 0 errors.

- [ ] **Step 3: Extract + fill de-DE + compile**

Run: `npx nx run twenty-front:lingui:extract`
Then in `packages/twenty-front/src/locales/de-DE.po`, fill identity `msgstr` for the new German-source keys (leave any already-present sibling keys intact):
- `Pipeline-Analyse` → `Pipeline-Analyse`
- `Erreicht` → `Erreicht`
- `Ø Dauer (Tage)` → `Ø Dauer (Tage)`
- `Konversion → nächste` → `Konversion → nächste`
- `Keine Opportunities.` → `Keine Opportunities.`
- `Phase` already exists from Slice A — do not touch.

Run: `npx nx run twenty-front:lingui:compile`

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx packages/twenty-front/src/locales
git commit -m "feat(front): opportunity pipeline analysis nav link + de-DE strings"
```

---

## Live-verify (after all tasks, before merge)

1. Ensure the field + backfill ran (Task 4). Confirm via Postgres MCP (read-only) that every opportunity has a one-entry `stageHistory`.
2. Perform a couple of real stage moves on test deals (board drag or detail edit — the user drives dnd-kit if used). Confirm via MCP that `stageHistory` gained an appended entry `{ stage: <new>, enteredAt: ~now }` and the last entry's stage matches the current stage; confirm no double-append on an unchanged re-save.
3. Open `/opportunities/pipeline-analysis` via the "Pipeline-Analyse" nav link. Hand-check against the raw `stageHistory` JSON in the DB: reached counts per stage (monotonic), one average-duration cell, and one conversion cell. Confirm the last stage's conversion shows `-`.
4. Restore any moved test deals to their original stage/status.

## Self-review notes

- Spec coverage: field (T1), reconcile helper + test (T2), job extension (T3), backfill 2.36.0 (T4), util TDD (T5), table+page+route (T6), nav+i18n (T7) — every spec section maps to a task.
- Reconcile idempotency + recursion safety documented in T3; the job write never sets `stage`, so the listener guard suppresses re-enqueue.
- Rounding lives only in the table (T6 `Math.round`), util returns raw values. Conversion `null` for last stage and divide-by-zero.
- No `any`, named exports, `type` aliases throughout. Icons `IconHistory` (field) and `IconTrendingUp` (nav) both verified present.
- Backfill SQL is idempotent (`WHERE "stageHistory" IS NULL`); the RAW_JSON column name must be confirmed against the generated workspace schema before finalizing (T4 Step 2).
