# Opportunity Probability + Forecast — Slice A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each Opportunity a win `probability` (seeded from a per-stage default, editable, reset on stage move unless overridden) and a denormalized `weightedAmount` (= amount x probability / 100), surfaced on the detail page, as a board card badge, and as a native board column SUM; plus a Settings page to edit the per-stage defaults.

**Architecture:** Two new standard fields on Opportunity (twenty-shared constant + compute util + entity mirror + snapshots, backfilled by upgrade command 2.34.0). A per-stage probability config via KeyValuePair (service + resolver + module in core-engine), mirroring the shipped rotting config. A stage-change/create/amount listener enqueues a job that recomputes `probability` (reset rule 2) and `weightedAmount`, idempotently. Frontend adds an opportunity-gated weighted-value component, a board `%` badge, a board SUM(weightedAmount) default, and a Settings page copied from the rotting settings page.

**Tech Stack:** NestJS, TypeORM, GraphQL (code-first, GraphQLJSON), BullMQ (entityEventsToDbQueue), React 18, Jotai, Apollo, Lingui, Jest.

## Global Constraints

- Never modify files marked `/* @license Enterprise */`.
- No signatures / Co-Authored-By / "Generated with Claude" in commits.
- Never run `database:reset` on the dev DB; backfill via the upgrade command instead. Postgres MCP is read-only (verify only).
- Config is keyed by the canonical English stage VALUE (`NEW`/`SCREENING`/`MEETING`/`PROPOSAL`/`CUSTOMER`), never the German label.
- `twenty-shared` resolves via built `dist`: run `npx nx build twenty-shared` before twenty-server typecheck sees new constant keys.
- Named exports only, no default exports, no `any`, string literals over enums (except GraphQL enums), types over interfaces. Import via `@/` alias in front, `src/` alias in server; the repo bans `../` parent imports (`no-restricted-imports`) including in tests.
- Lint with `npx nx lint:diff-with-main <project> --configuration=fix`; typecheck `npx nx typecheck <project>`; format `npx nx fmt <project>`.

**Precedent files to mirror (read them before the matching task):**
- Field def: `packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts:733-736` (stageChangedAt) + `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-opportunity-standard-flat-field-metadata.util.ts:180-195` (stageChangedAt) + `:136-147` (amount CURRENCY).
- Backfill command: `packages/twenty-server/src/database/commands/upgrade-version-command/2-32/` (both files) + `.../workspace-command-provider.module.ts` + `packages/twenty-server/src/engine/core-modules/upgrade/constants/twenty-next-versions.constant.ts`.
- Config: `packages/twenty-server/src/modules/opportunity/services/opportunity-rotting-config.service.ts` (+ its spec), `.../resolvers/opportunity-rotting-config.resolver.ts`, `.../dtos/update-opportunity-stage-rotting-days.input.ts`, `.../types/opportunity-stage-rotting-days-key-value.type.ts`, `.../opportunity-rotting-config.module.ts`, and its import in `packages/twenty-server/src/engine/core-modules/core-engine.module.ts`.
- Listener/job: `packages/twenty-server/src/modules/opportunity/listeners/opportunity-stage-changed.listener.ts`, `.../listeners/opportunity-stage-changed.util.ts`, `.../jobs/opportunity-set-stage-changed-at.job.ts`, `.../opportunity.module.ts`.
- Front detail badge: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityRottingBadge.tsx` + its wiring in `RecordShowPage.tsx`.
- Front board indicator: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityRottingIndicator.tsx` + `.../hooks/useOpportunityRottingForRecord.ts` + wiring in `RecordBoardCardHeader.tsx`.
- Front settings: `packages/twenty-front/src/modules/settings/data-model/.../SettingsObjectOpportunityRotting.tsx` + `OpportunityRottingForm.tsx` + `useOpportunityStageRottingConfig.ts` + `useUpdateOpportunityStageRottingDays.ts` + the `SettingsPath.ObjectRotting` route + the section link in `ObjectSettings.tsx`.

---

## Task 1: Add `probability` + `weightedAmount` standard fields

**Files:**
- Modify: `packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts` (opportunity fields block, near line 734)
- Modify: `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-opportunity-standard-flat-field-metadata.util.ts`
- Modify: `packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts` (remove the deprecated bare `probability`, add typed mirrors)
- Snapshots (regen, do not hand-edit): `packages/twenty-shared/src/metadata/constants/__snapshots__/standardObjectUniversalIdentifiers.test.ts.snap`, `packages/twenty-server/.../__snapshots__/get-standard-object-metadata-related-entity-ids.util.spec.ts.snap`

**Interfaces:**
- Produces: Opportunity fields `probability` (NUMBER, nullable) and `weightedAmount` (CURRENCY, nullable) with `universalIdentifier` `20202020-5701-4a11-9c31-7e6b2d4f8a13` and `...8a14`. Entity mirror gains `probability: number | null;` and `weightedAmount: CurrencyMetadata | null;`.

- [ ] **Step 1: Recon the deprecated field (Postgres MCP, read-only).** Confirm no active `probability` field metadata or column exists in the dev workspace schema `workspace_78jtyayrql5p8djgplk9x6vy`. Query `core.fieldMetadata` for the opportunity object and check the workspace table columns. Expected: no `probability` field metadata row, no `probability` column. (The entity's `/** @deprecated */ probability: string;` is a bare type property with no `@WorkspaceField` and no constant entry, so it generates nothing. If a real column/field unexpectedly exists, stop and report.)

- [ ] **Step 2: Add the two universalIdentifiers to the shared constant.** In `standard-object-fields.constant.ts`, inside the opportunity `fields` object, right after the `stageChangedAt` entry (line ~734-736), add:

```ts
    probability: {
      universalIdentifier: '20202020-5701-4a11-9c31-7e6b2d4f8a13',
    },
    weightedAmount: {
      universalIdentifier: '20202020-5701-4a11-9c31-7e6b2d4f8a14',
    },
```

- [ ] **Step 3: Build twenty-shared so the new keys resolve.**

Run: `npx nx build twenty-shared`
Expected: build succeeds.

- [ ] **Step 4: Add the field metadata definitions.** In `compute-opportunity-standard-flat-field-metadata.util.ts`, right after the `stageChangedAt` block (ends line ~195), add:

```ts
  probability: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'probability',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(msg`Probability`),
      description: i18nLabel(msg`Win probability in percent (0-100)`),
      icon: 'IconPercentage',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  weightedAmount: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'weightedAmount',
      type: FieldMetadataType.CURRENCY,
      label: i18nLabel(msg`Weighted amount`),
      description: i18nLabel(msg`Amount multiplied by probability`),
      icon: 'IconCurrencyDollar',
      isNullable: true,
      isUIEditable: false,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
```

- [ ] **Step 5: Update the entity mirror.** In `opportunity.workspace-entity.ts`, delete the two lines:

```ts
  /** @deprecated */
  probability: string;
```

and in their place (keep the field order tidy, near `stageChangedAt`) add:

```ts
  probability: number | null;
  weightedAmount: CurrencyMetadata | null;
```

`CurrencyMetadata` is already imported at the top of the file.

- [ ] **Step 6: Regenerate the two snapshots.**

Run: `cd packages/twenty-shared && npx jest standardObjectUniversalIdentifiers -u`
Run: `cd packages/twenty-server && npx jest get-standard-object-metadata-related-entity-ids -u`
Expected: both snapshots update (new entries + a uniform id shift). Skim the diff: only opportunity gains `probability`/`weightedAmount`, all other object blocks unchanged aside from the deterministic id shift.

- [ ] **Step 7: Typecheck + verify no stray UUID collision.**

Run: `npx nx build twenty-shared && npx nx typecheck twenty-server`
Run: `grep -rn "7e6b2d4f8a13\|7e6b2d4f8a14" packages/ | grep -v node_modules | grep -v dist`
Expected: typecheck passes; grep shows only the two source-of-truth entries (constant) plus snapshot rows.

- [ ] **Step 8: Commit.**

```bash
git add -A
git commit -m "feat(server): add opportunity probability + weightedAmount standard fields"
```

---

## Task 2: Backfill upgrade command 2.34.0

Creates both field metadata rows for existing workspaces and backfills values: `probability` = stage default of each row's current stage; `weightedAmount` = amount x probability / 100.

**Files:**
- Create: `packages/twenty-server/src/database/commands/upgrade-version-command/2-34/2-34-workspace-command-1786700000000-backfill-opportunity-probability.command.ts`
- Create: `packages/twenty-server/src/database/commands/upgrade-version-command/2-34/2-34-upgrade-version-command.module.ts`
- Modify: `packages/twenty-server/src/database/commands/upgrade-version-command/workspace-command-provider.module.ts` (register V2_34)
- Modify: `packages/twenty-server/src/engine/core-modules/upgrade/constants/twenty-next-versions.constant.ts` (add `'2.34.0'`)

**Interfaces:**
- Consumes: the two fields from Task 1.
- Produces: command `upgrade:2-34:backfill-opportunity-probability`, `@RegisteredWorkspaceCommand('2.34.0', 1786700000000)`.

- [ ] **Step 1: Read the 2-32 backfill command in full** (`.../2-32/2-32-workspace-command-1786500000000-backfill-opportunity-stage-changed-at.command.ts`) and its module. Copy the structure exactly: it creates the field via the legacy migration method and runs a raw `UPDATE` via `dataSource.query` + `getWorkspaceSchemaName`, both dry-run guarded, idempotent (skip when the field/column already exists).

- [ ] **Step 2: Write the 2.34.0 command.** Mirror 2-32, with these differences:
  - `@RegisteredWorkspaceCommand('2.34.0', 1786700000000)`, name `upgrade:2-34:backfill-opportunity-probability`.
  - Create BOTH `probability` and `weightedAmount` field metadata (derive UIDs from `STANDARD_OBJECTS.opportunity.fields.probability.universalIdentifier` / `.weightedAmount...`, never hardcode).
  - Define the default map inline: `const DEFAULT_STAGE_PROBABILITY = { NEW: 20, SCREENING: 40, MEETING: 60, PROPOSAL: 80, CUSTOMER: 100 } as const;`
  - Data backfill (raw SQL against the workspace schema, only rows where `probability IS NULL`):

```sql
UPDATE "<schema>"."opportunity"
SET "probability" = CASE "stage"
  WHEN 'NEW' THEN 20 WHEN 'SCREENING' THEN 40 WHEN 'MEETING' THEN 60
  WHEN 'PROPOSAL' THEN 80 WHEN 'CUSTOMER' THEN 100 ELSE 0 END
WHERE "probability" IS NULL;
```

then set weightedAmount from amount x the just-set probability (amount is a composite stored as `amountMicros` / `currencyCode` columns — confirm exact column names during Step 1 recon of the schema; Twenty composite columns are `"amountAmountMicros"` / `"amountCurrencyCode"` style):

```sql
UPDATE "<schema>"."opportunity"
SET "weightedAmountAmountMicros" = ROUND("amountAmountMicros" * "probability" / 100.0),
    "weightedAmountCurrencyCode" = "amountCurrencyCode"
WHERE "amountAmountMicros" IS NOT NULL AND "weightedAmountAmountMicros" IS NULL;
```

  Build the schema name via `getWorkspaceSchemaName(workspaceId)` and run through `dataSource.query`, exactly as 2-32 does. Guard both statements behind `if (!isDryRun)`.

- [ ] **Step 3: Write the version module** (`2-34-upgrade-version-command.module.ts`), mirroring `2-32-upgrade-version-command.module.ts`: provide the new command, import `WorkspaceIteratorModule` + `WorkspaceCacheModule` (+ whatever 2-32 imports for the raw migration). Export the command.

- [ ] **Step 4: Register V2_34** in `workspace-command-provider.module.ts` (add the import + to the module array, following the V2_32/V2_33 lines).

- [ ] **Step 5: Add `'2.34.0'`** to `TWENTY_NEXT_VERSIONS` in `twenty-next-versions.constant.ts` (after `'2.33.0'`).

- [ ] **Step 6: Typecheck + lint.**

Run: `npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server --configuration=fix`
Expected: 0 errors.

- [ ] **Step 7: Dry-run against dev DB (no reset).**

Run: `npx nx run twenty-server:command -- upgrade:2-34:backfill-opportunity-probability --dry-run`
Expected: logs the fields it would create + rows it would backfill, writes nothing.

- [ ] **Step 8: Real run + verify via Postgres MCP.**

Run: `npx nx run twenty-server:command -- upgrade:2-34:backfill-opportunity-probability`
Then verify (read-only) in `workspace_78jtyayrql5p8djgplk9x6vy.opportunity`: every row has a non-null `probability` matching its stage default, and `weightedAmount` micros == round(amount micros x probability / 100) for rows with an amount. Field metadata rows for `probability` + `weightedAmount` present in `core.fieldMetadata`.

- [ ] **Step 9: Idempotency check.** Re-run the dry-run; expected: logs "already present"/"already configured", no work.

- [ ] **Step 10: Commit.**

```bash
git add -A
git commit -m "feat(server): backfill command 2.34.0 for opportunity probability + weightedAmount"
```

---

## Task 3: Per-stage probability config (service + resolver + module)

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/services/opportunity-probability-config.service.ts`
- Create: `packages/twenty-server/src/modules/opportunity/services/__tests__/opportunity-probability-config.service.spec.ts`
- Create: `packages/twenty-server/src/modules/opportunity/types/opportunity-stage-probability-key-value.type.ts`
- Create: `packages/twenty-server/src/modules/opportunity/dtos/update-opportunity-stage-probability.input.ts`
- Create: `packages/twenty-server/src/modules/opportunity/resolvers/opportunity-probability-config.resolver.ts`
- Create: `packages/twenty-server/src/modules/opportunity/opportunity-probability-config.module.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/core-engine.module.ts` (import the new module)

**Interfaces:**
- Produces: `OpportunityProbabilityConfigService.getProbabilityByStage(workspaceId): Promise<Record<string, number>>` and `.setProbabilityByStage(workspaceId, value): Promise<void>`. Resolver query `opportunityStageProbability: JSON` (guard `NoPermissionGuard`), mutation `updateOpportunityStageProbability(input): JSON` (guard `SettingsPermissionGuard(DATA_MODEL)`). KeyValue key `OPPORTUNITY_STAGE_PROBABILITY`. `DEFAULT_OPPORTUNITY_STAGE_PROBABILITY = { NEW: 20, SCREENING: 40, MEETING: 60, PROPOSAL: 80, CUSTOMER: 100 }`.

- [ ] **Step 1: Read the rotting config quartet in full** (service + spec + resolver + dto + type + module + its core-engine import). This task is a structural copy with `Rotting`->`Probability`, `RottingDays`->`Probability`, `OPPORTUNITY_STAGE_ROTTING_DAYS`->`OPPORTUNITY_STAGE_PROBABILITY`, and the default map above.

- [ ] **Step 2: Write the failing service spec.** Mirror `opportunity-rotting-config.service.spec.ts`:

```ts
describe('OpportunityProbabilityConfigService', () => {
  it('returns the default map when nothing is stored', async () => {
    // keyValuePairService.get resolves undefined
    expect(await service.getProbabilityByStage('ws')).toEqual(
      DEFAULT_OPPORTUNITY_STAGE_PROBABILITY,
    );
  });
  it('returns the stored map when present (empty object respected)', async () => {
    // keyValuePairService.get resolves { value: { NEW: 5 } }
    expect(await service.getProbabilityByStage('ws')).toEqual({ NEW: 5 });
  });
  it('persists via setProbabilityByStage', async () => {
    await service.setProbabilityByStage('ws', { NEW: 15 });
    expect(keyValuePairService.set).toHaveBeenCalledWith(
      expect.objectContaining({ value: { NEW: 15 } }),
    );
  });
});
```

- [ ] **Step 2b: Run it, expect fail** (`cd packages/twenty-server && npx jest opportunity-probability-config.service` -> module not found).

- [ ] **Step 3: Implement the type, dto, service** exactly mirroring the rotting equivalents (per-consumer local KeyValueTypesMap `OpportunityStageProbabilityKeyValueTypeMap`, `CONFIG_VARIABLE`, userId null; `getProbabilityByStage` returns stored value or the DEFAULT map only when truly unset; `setProbabilityByStage` persists). Dto: `@IsObject()` `value: Record<string, number>` (input `UpdateOpportunityStageProbabilityInput`), same shape as the rotting input.

- [ ] **Step 4: Run the spec, expect pass** (`npx jest opportunity-probability-config.service`).

- [ ] **Step 5: Implement the resolver** (`@MetadataResolver()`), mirroring the rotting resolver:

```ts
@Query(() => GraphQLJSON)
@UseGuards(NoPermissionGuard)
async opportunityStageProbability(
  @AuthWorkspace() workspace: Workspace,
): Promise<Record<string, number>> {
  return this.service.getProbabilityByStage(workspace.id);
}

@Mutation(() => GraphQLJSON)
@UseGuards(SettingsPermissionGuard(SettingPermissionType.DATA_MODEL))
async updateOpportunityStageProbability(
  @Args('input') input: UpdateOpportunityStageProbabilityInput,
  @AuthWorkspace() workspace: Workspace,
): Promise<Record<string, number>> {
  await this.service.setProbabilityByStage(workspace.id, input.value);
  return this.service.getProbabilityByStage(workspace.id);
}
```

- [ ] **Step 6: Implement the module** (`opportunity-probability-config.module.ts`): imports `KeyValuePairModule` + `PermissionsModule`; providers the service + resolver. Then import it into `core-engine.module.ts` (NOT modules.module) next to `OpportunityRottingConfigModule`.

- [ ] **Step 7: Typecheck + lint.**

Run: `npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server --configuration=fix`
Expected: 0. (The custom `graphql-resolvers-should-be-guarded` rule is satisfied by the two guards above.)

- [ ] **Step 8: Verify schema exposure by introspection.** Boot the server (`npx nx start twenty-server`), then:

```bash
curl -s -X POST http://localhost:3000/metadata -H 'content-type: application/json' \
  -d '{"query":"{ __type(name:\"Query\"){fields{name}} }"}' | grep -o opportunityStageProbability
curl -s -X POST http://localhost:3000/metadata -H 'content-type: application/json' \
  -d '{"query":"{ __type(name:\"Mutation\"){fields{name}} }"}' | grep -o updateOpportunityStageProbability
```

Expected: both names print. If absent, the module is not wired into `core-engine.module.ts` — fix before committing.

- [ ] **Step 9: Commit.**

```bash
git add -A
git commit -m "feat(server): opportunity per-stage probability config (KeyValuePair + resolver)"
```

---

## Task 4: GraphQL regen for the new config ops

**Files:**
- Modify (generated): `packages/twenty-front/src/generated-metadata/graphql.ts`

- [ ] **Step 1: Ensure Task 3's server is running** (ops must be in the served `/metadata` schema for codegen to pick them up).

- [ ] **Step 2: Regenerate.**

Run: `npx nx run twenty-front:graphql:generate --configuration=metadata`
Expected: adds `Query.opportunityStageProbability`, `Mutation.updateOpportunityStageProbability`, `MutationUpdateOpportunityStageProbabilityArgs`, `UpdateOpportunityStageProbabilityInput`.

- [ ] **Step 3: Strip unrelated drift.** `git diff` the generated file; if unrelated `ClientConfig` `is*ModuleEnabled` churn appears (from earlier merged slices never regenerated on main), revert those hunks so only the probability ops remain.

- [ ] **Step 4: Front typecheck.**

Run: `npx nx typecheck twenty-front`
Expected: 0.

- [ ] **Step 5: Commit.**

```bash
git add packages/twenty-front/src/generated-metadata/graphql.ts
git commit -m "chore(front): regenerate graphql for opportunity probability config"
```

---

## Task 5: Probability recompute listener + job

Seeds probability on create, applies reset rule (2) on stage change, and recomputes `weightedAmount` whenever amount or probability changes — idempotently, without a recompute loop.

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/listeners/opportunity-probability.util.ts`
- Create: `packages/twenty-server/src/modules/opportunity/listeners/__tests__/opportunity-probability.util.spec.ts`
- Create: `packages/twenty-server/src/modules/opportunity/listeners/opportunity-probability.listener.ts`
- Create: `packages/twenty-server/src/modules/opportunity/jobs/opportunity-set-probability.job.ts`
- Modify: `packages/twenty-server/src/modules/opportunity/opportunity.module.ts` (register listener + job; import the probability config service — provide `OpportunityProbabilityConfigService` or import its module)

**Interfaces:**
- Consumes: `OpportunityProbabilityConfigService.getProbabilityByStage` (Task 3); fields from Task 1.
- Produces pure helpers:
  - `computeTargetProbability(args: { isCreate: boolean; stageBefore: string | null; stageAfter: string; probabilityBefore: number | null; stageDefaults: Record<string, number> }): number`
  - `computeWeightedAmount(amount: { amountMicros: number; currencyCode: string } | null, probability: number | null): { amountMicros: number; currencyCode: string } | null`
  - `shouldRecomputeProbability(before, after): boolean`
  - `isSameWeightedAmount(a, b): boolean`

- [ ] **Step 1: Write the failing util spec.**

```ts
import {
  computeTargetProbability,
  computeWeightedAmount,
  shouldRecomputeProbability,
} from '@/../src/modules/opportunity/listeners/opportunity-probability.util';

const defaults = { NEW: 20, SCREENING: 40, MEETING: 60, PROPOSAL: 80, CUSTOMER: 100 };

describe('computeTargetProbability', () => {
  it('seeds the stage default on create', () => {
    expect(
      computeTargetProbability({ isCreate: true, stageBefore: null, stageAfter: 'MEETING', probabilityBefore: null, stageDefaults: defaults }),
    ).toBe(60);
  });
  it('resets to the new stage default when the old value was the untouched old default', () => {
    expect(
      computeTargetProbability({ isCreate: false, stageBefore: 'NEW', stageAfter: 'PROPOSAL', probabilityBefore: 20, stageDefaults: defaults }),
    ).toBe(80);
  });
  it('keeps a manual override across a stage move', () => {
    expect(
      computeTargetProbability({ isCreate: false, stageBefore: 'NEW', stageAfter: 'PROPOSAL', probabilityBefore: 55, stageDefaults: defaults }),
    ).toBe(55);
  });
  it('keeps the current value when the stage did not change', () => {
    expect(
      computeTargetProbability({ isCreate: false, stageBefore: 'MEETING', stageAfter: 'MEETING', probabilityBefore: 33, stageDefaults: defaults }),
    ).toBe(33);
  });
});

describe('computeWeightedAmount', () => {
  it('is null when amount is null', () => {
    expect(computeWeightedAmount(null, 80)).toBeNull();
  });
  it('is null when probability is null', () => {
    expect(computeWeightedAmount({ amountMicros: 1_000_000, currencyCode: 'EUR' }, null)).toBeNull();
  });
  it('multiplies micros by probability/100 and keeps the currency', () => {
    expect(computeWeightedAmount({ amountMicros: 10_000_000, currencyCode: 'EUR' }, 80)).toEqual({ amountMicros: 8_000_000, currencyCode: 'EUR' });
  });
});

describe('shouldRecomputeProbability', () => {
  const base = { stage: 'NEW', probability: 20, amount: { amountMicros: 1_000_000, currencyCode: 'EUR' } };
  it('is false when nothing relevant changed', () => {
    expect(shouldRecomputeProbability(base, { ...base })).toBe(false);
  });
  it('is true when stage changed', () => {
    expect(shouldRecomputeProbability(base, { ...base, stage: 'MEETING' })).toBe(true);
  });
  it('is true when probability changed', () => {
    expect(shouldRecomputeProbability(base, { ...base, probability: 55 })).toBe(true);
  });
  it('is true when amount changed', () => {
    expect(shouldRecomputeProbability(base, { ...base, amount: { amountMicros: 2_000_000, currencyCode: 'EUR' } })).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, expect fail** (`cd packages/twenty-server && npx jest opportunity-probability.util` -> module not found).

- [ ] **Step 3: Implement the util.**

```ts
import { isDefined } from 'twenty-shared/utils';

type Currency = { amountMicros: number; currencyCode: string } | null;

export const computeTargetProbability = ({
  isCreate,
  stageBefore,
  stageAfter,
  probabilityBefore,
  stageDefaults,
}: {
  isCreate: boolean;
  stageBefore: string | null;
  stageAfter: string;
  probabilityBefore: number | null;
  stageDefaults: Record<string, number>;
}): number => {
  const afterDefault = stageDefaults[stageAfter] ?? 0;

  if (isCreate) {
    return probabilityBefore ?? afterDefault;
  }

  const stageChanged = stageBefore !== stageAfter;

  if (!stageChanged) {
    return probabilityBefore ?? afterDefault;
  }

  const beforeDefault = isDefined(stageBefore)
    ? stageDefaults[stageBefore] ?? 0
    : 0;
  const wasUntouched = probabilityBefore === beforeDefault;

  return wasUntouched ? afterDefault : probabilityBefore ?? afterDefault;
};

export const computeWeightedAmount = (
  amount: Currency,
  probability: number | null,
): Currency => {
  if (!isDefined(amount) || !isDefined(probability)) {
    return null;
  }

  return {
    amountMicros: Math.round((amount.amountMicros * probability) / 100),
    currencyCode: amount.currencyCode,
  };
};

export const isSameWeightedAmount = (a: Currency, b: Currency): boolean => {
  if (!isDefined(a) || !isDefined(b)) {
    return a === b;
  }

  return a.amountMicros === b.amountMicros && a.currencyCode === b.currencyCode;
};

type ChangeShape = {
  stage?: string | null;
  probability?: number | null;
  amount?: Currency;
};

export const shouldRecomputeProbability = (
  before: ChangeShape | undefined,
  after: ChangeShape | undefined,
): boolean => {
  if (!isDefined(before) || !isDefined(after)) {
    return false;
  }

  return (
    before.stage !== after.stage ||
    before.probability !== after.probability ||
    !isSameWeightedAmount(before.amount ?? null, after.amount ?? null)
  );
};
```

- [ ] **Step 4: Run the spec, expect pass.**

- [ ] **Step 5: Write the job.** Reads the record fresh (for amount + current values + idempotency), computes targets, updates only on a diff. Data carries the reset-decision context.

```ts
import { Logger, Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { OpportunityProbabilityConfigService } from 'src/modules/opportunity/services/opportunity-probability-config.service';
import {
  computeTargetProbability,
  computeWeightedAmount,
  isSameWeightedAmount,
} from 'src/modules/opportunity/listeners/opportunity-probability.util';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';

export type OpportunitySetProbabilityJobData = {
  workspaceId: string;
  opportunityId: string;
  isCreate: boolean;
  stageBefore: string | null;
  probabilityBefore: number | null;
};

@Processor({ queueName: MessageQueue.entityEventsToDbQueue, scope: Scope.REQUEST })
export class OpportunitySetProbabilityJob {
  protected readonly logger = new Logger(OpportunitySetProbabilityJob.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly probabilityConfigService: OpportunityProbabilityConfigService,
  ) {}

  @Process(OpportunitySetProbabilityJob.name)
  async handle({
    workspaceId,
    opportunityId,
    isCreate,
    stageBefore,
    probabilityBefore,
  }: OpportunitySetProbabilityJobData): Promise<void> {
    const stageDefaults =
      await this.probabilityConfigService.getProbabilityByStage(workspaceId);
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
          workspaceId,
          'opportunity',
          { shouldBypassPermissionChecks: true },
        );

      const opportunity = await repository.findOne({
        where: { id: opportunityId },
      });

      if (opportunity === null) {
        return;
      }

      const targetProbability = computeTargetProbability({
        isCreate,
        stageBefore,
        stageAfter: opportunity.stage,
        probabilityBefore,
        stageDefaults,
      });
      const targetWeighted = computeWeightedAmount(
        opportunity.amount,
        targetProbability,
      );

      const probabilitySame = opportunity.probability === targetProbability;
      const weightedSame = isSameWeightedAmount(
        opportunity.weightedAmount,
        targetWeighted,
      );

      if (probabilitySame && weightedSame) {
        return;
      }

      await repository.update(
        { id: opportunityId },
        { probability: targetProbability, weightedAmount: targetWeighted },
      );
    }, authContext);
  }
}
```

- [ ] **Step 6: Write the listener.** CREATE always enqueues (seed); UPDATE enqueues only when `shouldRecomputeProbability` is true. Idempotency in the job breaks the self-write loop.

```ts
import { Injectable } from '@nestjs/common';

import {
  type ObjectRecordCreateEvent,
  type ObjectRecordUpdateEvent,
} from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  OpportunitySetProbabilityJob,
  type OpportunitySetProbabilityJobData,
} from 'src/modules/opportunity/jobs/opportunity-set-probability.job';
import { shouldRecomputeProbability } from 'src/modules/opportunity/listeners/opportunity-probability.util';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';

@Injectable()
export class OpportunityProbabilityListener {
  constructor(
    @InjectMessageQueue(MessageQueue.entityEventsToDbQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.CREATED)
  async handleCreatedEvent(
    payload: WorkspaceEventBatch<ObjectRecordCreateEvent<OpportunityWorkspaceEntity>>,
  ) {
    for (const eventPayload of payload.events) {
      await this.messageQueueService.add<OpportunitySetProbabilityJobData>(
        OpportunitySetProbabilityJob.name,
        {
          workspaceId: payload.workspaceId,
          opportunityId: eventPayload.recordId,
          isCreate: true,
          stageBefore: null,
          probabilityBefore: eventPayload.properties.after.probability ?? null,
        },
      );
    }
  }

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)
  async handleUpdatedEvent(
    payload: WorkspaceEventBatch<ObjectRecordUpdateEvent<OpportunityWorkspaceEntity>>,
  ) {
    for (const eventPayload of payload.events) {
      const { before, after } = eventPayload.properties;

      if (!shouldRecomputeProbability(before, after)) {
        continue;
      }

      await this.messageQueueService.add<OpportunitySetProbabilityJobData>(
        OpportunitySetProbabilityJob.name,
        {
          workspaceId: payload.workspaceId,
          opportunityId: eventPayload.recordId,
          isCreate: false,
          stageBefore: before.stage ?? null,
          probabilityBefore: before.probability ?? null,
        },
      );
    }
  }
}
```

- [ ] **Step 7: Register in `opportunity.module.ts`.** Add `OpportunityProbabilityListener` + `OpportunitySetProbabilityJob` to providers. The job needs `OpportunityProbabilityConfigService`: import `OpportunityProbabilityConfigModule` (from Task 3) into `OpportunityModule`, OR provide the service there — pick whichever keeps DI acyclic (the config module already bundles `KeyValuePairModule` + `PermissionsModule`; importing it is cleanest). Do NOT move the config RESOLVER's exposure — it stays wired via core-engine.

- [ ] **Step 8: Typecheck + lint + boot smoke.**

Run: `npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server --configuration=fix`
Run: `npx nx start twenty-server` until "Nest application successfully started" (no circular-DI). Ctrl-C after.
Expected: 0 errors, clean boot.

- [ ] **Step 9: Commit.**

```bash
git add -A
git commit -m "feat(server): opportunity probability recompute listener + job"
```

---

## Task 6: Detail-page weighted-value component

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/utils/computeWeightedAmountDisplay.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/utils/__tests__/computeWeightedAmountDisplay.test.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityWeightedAmount.tsx`
- Modify: `packages/twenty-front/src/modules/object-record/record-show/components/RecordShowPage.tsx` (opportunity-gated block, add one unconditional read of `probability` + reuse `amount`)

**Interfaces:**
- Produces: `<OpportunityWeightedAmount recordId probability amount />` rendering `Gewichtet: 8.000 € (80%)`; renders null when amount or probability is missing.

- [ ] **Step 1: Read `OpportunityRottingBadge.tsx` + its wiring in `RecordShowPage.tsx`** to copy the opportunity-gated read + render pattern (`useAtomFamilySelectorValue(recordStoreFamilySelector, { recordId, fieldName })`).

- [ ] **Step 2: Write the failing display-util test.**

```ts
import { computeWeightedAmountDisplay } from '@/object-record/record-show/opportunity/utils/computeWeightedAmountDisplay';

describe('computeWeightedAmountDisplay', () => {
  it('is null when amount is missing', () => {
    expect(computeWeightedAmountDisplay({ amount: null, probability: 80 })).toBeNull();
  });
  it('is null when probability is missing', () => {
    expect(computeWeightedAmountDisplay({ amount: { amountMicros: 10_000_000, currencyCode: 'EUR' }, probability: null })).toBeNull();
  });
  it('returns weighted micros + probability', () => {
    expect(
      computeWeightedAmountDisplay({ amount: { amountMicros: 10_000_000, currencyCode: 'EUR' }, probability: 80 }),
    ).toEqual({ amountMicros: 8_000_000, currencyCode: 'EUR', probability: 80 });
  });
});
```

- [ ] **Step 3: Run it, expect fail.**

- [ ] **Step 4: Implement `computeWeightedAmountDisplay`** (pure, mirrors the server `computeWeightedAmount` math, adds `probability` to the return for the label). Return `{ amountMicros, currencyCode, probability } | null`.

- [ ] **Step 5: Run it, expect pass.**

- [ ] **Step 6: Implement `OpportunityWeightedAmount.tsx`.** Use the existing currency formatting helper the codebase uses for amount display (find it near the amount field display component — e.g. `formatAmount`/`formatCurrency`; grep `record-field` currency display). Render a Linaria label: `` t`Gewichtet` `` + formatted weighted amount + ` (${probability}%)`. Null when the util returns null. No `../` imports.

- [ ] **Step 7: Wire into `RecordShowPage.tsx`.** In the existing opportunity-gated header fragment (where the rotting badge + Won/Lost actions render), add an unconditional read of `probability` (via `recordStoreFamilySelector`, same as `stage`), reuse the already-read `amount` (add a read if not present), and render `<OpportunityWeightedAmount ... />`.

- [ ] **Step 8: Typecheck + lint + fmt.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix && npx nx fmt twenty-front`
Expected: 0.

- [ ] **Step 9: Commit.**

```bash
git add -A
git commit -m "feat(front): opportunity weighted-amount on record detail"
```

---

## Task 7: Board card probability badge + weighted SUM aggregate

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/hooks/useOpportunityProbabilityForRecord.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityProbabilityBadge.tsx`
- Modify: `packages/twenty-front/src/modules/object-record/record-board/record-board-card/components/RecordBoardCardHeader.tsx` (opportunity-gated badge, mirror the rotting indicator placement)

**Interfaces:**
- Consumes: the record's `probability` (fetch via `useFindOneRecord` recordGqlFields, exactly like `useOpportunityRottingForRecord`, because board only loads visible fields).
- Produces: `<OpportunityProbabilityBadge recordId />` rendering a small `80%` chip; null when probability is null.

- [ ] **Step 1: Read `useOpportunityRottingForRecord.ts` + `OpportunityRottingIndicator.tsx` + the gated one-liner in `RecordBoardCardHeader.tsx`.** Copy the pattern.

- [ ] **Step 2: Implement `useOpportunityProbabilityForRecord`.**

```ts
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';

export const useOpportunityProbabilityForRecord = (
  recordId: string,
): { probability: number | null } => {
  const { record } = useFindOneRecord({
    objectNameSingular: 'opportunity',
    objectRecordId: recordId,
    recordGqlFields: { probability: true },
  });

  return { probability: (record?.probability as number | null | undefined) ?? null };
};
```

- [ ] **Step 3: Implement `OpportunityProbabilityBadge.tsx`.** Linaria chip (neutral/secondary token, NOT the red rotting token), text `` t`${probability}%` ``; null when probability is null.

- [ ] **Step 4: Wire into `RecordBoardCardHeader.tsx`.** After the existing `<OpportunityRottingIndicator recordId={recordId} />`, add an opportunity-gated `<OpportunityProbabilityBadge recordId={recordId} />` under the same `objectMetadataItem.nameSingular === CoreObjectNameSingular.Opportunity` guard.

- [ ] **Step 5: Board weighted SUM default.** Locate how a board column's default aggregate is chosen (`buildRecordGqlFieldsAggregateForView` / the aggregate dropdown state). If a per-object sensible default can be set without touching generic hot-path behavior for other objects, set SUM on `weightedAmount` for opportunity boards; otherwise leave it user-selectable and note it in the commit body. Do NOT regress the existing amount SUM aggregate. Keep any change opportunity-scoped.

- [ ] **Step 6: Typecheck + lint + fmt.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix && npx nx fmt twenty-front`
Expected: 0.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "feat(front): opportunity probability badge on board card"
```

---

## Task 8: Settings page for per-stage probability

**Files:**
- Create: `packages/twenty-front/src/modules/settings/data-model/object-details/components/OpportunityProbabilityForm.tsx`
- Create: `.../object-details/components/__tests__/OpportunityProbabilityForm.test.tsx`
- Create: `packages/twenty-front/src/pages/settings/data-model/SettingsObjectOpportunityProbability.tsx`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/hooks/useOpportunityStageProbabilityConfig.ts`
- Create: `.../hooks/useUpdateOpportunityStageProbability.ts`
- Modify: `SettingsPath` enum + settings routes (add `ObjectProbability`)
- Modify: `.../settings/data-model/object-details/components/ObjectSettings.tsx` (opportunity-gated section link)

**Interfaces:**
- Consumes: Task 4 generated ops (`opportunityStageProbability` query, `updateOpportunityStageProbability` mutation).
- Produces: a Settings route `SettingsPath.ObjectProbability` with a per-stage number-input form.

- [ ] **Step 1: Read the rotting settings page set** (`SettingsObjectOpportunityRotting.tsx`, `OpportunityRottingForm.tsx`, `useOpportunityStageRottingConfig.ts`, `useUpdateOpportunityStageRottingDays.ts`, the `SettingsPath.ObjectRotting` route + `ObjectSettings.tsx` link). This task is a structural copy: rotting-days -> probability, route `ObjectRotting` -> `ObjectProbability`, gql ops swapped, labels changed.

- [ ] **Step 2: Implement the two hooks** (`useOpportunityStageProbabilityConfig` returns `{ config, loading }` from the `opportunityStageProbability` query; `useUpdateOpportunityStageProbability` runs the mutation and refetches the query), mirroring the rotting hooks.

- [ ] **Step 3: Write the failing form test.** Mirror `OpportunityRottingForm.test.tsx`: renders a number input per stage option seeded from config, Save calls `onSave` with the map, blanks omitted. Use the `t` macro (not `useLingui`) so it runs without an I18nProvider.

- [ ] **Step 4: Run it, expect fail.**

- [ ] **Step 5: Implement `OpportunityProbabilityForm.tsx`** (presentational, number input 0-100 per stage option) and `SettingsObjectOpportunityProbability.tsx` (reads stage options via `useObjectMetadataItem` + config + mutation; gate the form render behind `loading` via `SettingsSectionSkeletonLoader`, exactly like the rotting fix, to avoid the blank-save wipe).

- [ ] **Step 6: Run the form test, expect pass.**

- [ ] **Step 7: Add the route + section link.** `SettingsPath.ObjectProbability` enum value + lazy route to the page; opportunity-gated "Wahrscheinlichkeit" section link in `ObjectSettings.tsx` (use twenty-ui `Button`/section-link with `to={getSettingsPath(SettingsPath.ObjectProbability)}`, NOT `onClick navigate`, per the `no-navigate-prefer-link` rule).

- [ ] **Step 8: Typecheck + lint + fmt.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix && npx nx fmt twenty-front`
Expected: 0.

- [ ] **Step 9: i18n.** Wrap all new strings with `t` from `@lingui/core/macro`. Run `npx nx run twenty-front:lingui:extract`, fill the new `msgstr`s in `packages/twenty-front/src/locales/de-DE.po` (Probability->Wahrscheinlichkeit, Weighted->Gewichtet, etc.), run `npx nx run twenty-front:lingui:compile`.

- [ ] **Step 10: Commit.**

```bash
git add -A
git commit -m "feat(front): per-stage probability settings page + de-DE strings"
```

---

## Live verification (before final review)

Against the dev instance (in-app browser + Postgres MCP, workspace `workspace_78jtyayrql5p8djgplk9x6vy`, test opp Platform Migration `822639e5-9bf7-40f1-8882-a11140362339`):

1. Detail page shows `Gewichtet: ... (N%)` for an open opportunity with an amount.
2. Edit `probability` inline -> weightedAmount recomputes (DB + detail) after the worker runs.
3. Move stage on an untouched deal -> probability resets to the new stage default; on a manually-overridden deal -> probability kept. Verify DB.
4. Board card shows the `%` badge; column SUM(weightedAmount) available/defaulted.
5. Settings page edits per-stage defaults; new deals seed from them.
6. Won/Lost + rotting still work (no regression).

Worker must be running for the listener/job to fire: `npx nx run twenty-server:worker`.

---

## Notes for the executor

- The listener/job self-write terminates via the job's idempotency guard (target == current -> no update), plus the listener's `shouldRecomputeProbability` gate. Confirm no infinite recompute in the worker logs during live verify.
- Keep every board/detail/table touch opportunity-gated so non-opportunity objects are unaffected.
- Do not touch the stageChangedAt listener/job — the probability path is separate.
