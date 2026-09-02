# Opportunity Monthly Goal (Sales Target) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A workspace-wide monthly revenue target (stored as a config), with a Goals page showing this month's progress (won revenue vs target) plus a 6-month history, and a settings page to set the target.

**Architecture:** Backend config = a KeyValuePair CONFIG_VARIABLE exposed via a GraphQL query + mutation, mirroring the existing `OpportunityProbabilityConfig` service/resolver. Frontend = a settings page (mirrors the Probability/Rotting settings) + a Goals page that client-side-aggregates won deals against the target (pure util, TDD). No new opportunity field, listener, job, or migration.

**Tech Stack:** NestJS + KeyValuePairService (backend), React 18 + TS strict + Jotai + Linaria + Lingui + Jest (frontend), Nx monorepo.

## Global Constraints

- Caveman chat prose only; code/commits/PRs in normal English.
- No signatures / Co-Authored-By / "Generated with Claude" tags anywhere.
- Never modify `/* @license Enterprise */` files.
- Named exports only, no default exports. Functional components only. `type` over `interface`. String literals over enums (except GraphQL/metadata enums). No `any`. No abbreviations. Short `//` comments, WHY not WHAT, only when non-obvious.
- Config key `OPPORTUNITY_MONTHLY_GOAL`; config shape `{ targetAmount: number }` in MAJOR currency units. Getter returns `null` when unset (NO default). A `targetAmount` of `0` (or null/unset config) means "no goal": `targetMicros = null`, no ratio, no progress bar.
- Progress = sum of `amount` (micros) of `status = 'WON'` deals whose `closedAt` falls in the month. Utils return raw micros; the page rounds/formats.
- Icon `IconTarget` (verified present in `twenty-ui/icon`).
- After backend code: `npx nx typecheck twenty-server`, `npx nx lint:diff-with-main twenty-server` = 0. After twenty-shared change: `npx nx build twenty-shared`. After frontend: `rm -rf packages/twenty-front/node_modules/.vite` (only after the shared build), `npx nx typecheck twenty-front`, `npx nx lint:diff-with-main twenty-front` = 0. Run `nx fmt` on the touched project if oxfmt/oxlint flags files. `lint:diff-with-main` may report "no changed files" pre-commit — also run oxlint directly on new files and report both.

---

### Task 1: Backend config (service + resolver + module)

Mirrors `OpportunityProbabilityConfig` exactly (service/resolver/module/dto/type + core-engine registration), except the getter returns `null` when unset.

**Files:**
- Create: `packages/twenty-server/src/modules/opportunity/types/opportunity-monthly-goal-key-value.type.ts`
- Create: `packages/twenty-server/src/modules/opportunity/services/opportunity-monthly-goal-config.service.ts`
- Test: `packages/twenty-server/src/modules/opportunity/services/__tests__/opportunity-monthly-goal-config.service.spec.ts`
- Create: `packages/twenty-server/src/modules/opportunity/dtos/update-opportunity-monthly-goal.input.ts`
- Create: `packages/twenty-server/src/modules/opportunity/resolvers/opportunity-monthly-goal-config.resolver.ts`
- Create: `packages/twenty-server/src/modules/opportunity/opportunity-monthly-goal-config.module.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/core-engine.module.ts` (import + register module)

**Interfaces:**
- Produces GraphQL: `Query opportunityMonthlyGoal → JSON` (config object or null); `Mutation updateOpportunityMonthlyGoal(input: UpdateOpportunityMonthlyGoalInput!) → JSON`.

- [ ] **Step 1: Key-value type**

`opportunity-monthly-goal-key-value.type.ts`:
```ts
export const OPPORTUNITY_MONTHLY_GOAL_KEY = 'OPPORTUNITY_MONTHLY_GOAL';

// Monthly revenue target in major currency units (e.g. 100000 = 100k).
export type OpportunityMonthlyGoal = { targetAmount: number };

export type OpportunityMonthlyGoalKeyValueTypeMap = {
  [OPPORTUNITY_MONTHLY_GOAL_KEY]: OpportunityMonthlyGoal;
};
```

- [ ] **Step 2: Service**

`opportunity-monthly-goal-config.service.ts`:
```ts
import { Injectable } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  OPPORTUNITY_MONTHLY_GOAL_KEY,
  type OpportunityMonthlyGoal,
  type OpportunityMonthlyGoalKeyValueTypeMap,
} from 'src/modules/opportunity/types/opportunity-monthly-goal-key-value.type';

@Injectable()
export class OpportunityMonthlyGoalConfigService {
  constructor(
    private readonly keyValuePairService: KeyValuePairService<OpportunityMonthlyGoalKeyValueTypeMap>,
  ) {}

  async getMonthlyGoal(
    workspaceId: string,
  ): Promise<OpportunityMonthlyGoal | null> {
    const stored = await this.keyValuePairService.get({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: OPPORTUNITY_MONTHLY_GOAL_KEY,
    });

    const value = (
      stored[0] as { value?: OpportunityMonthlyGoal } | undefined
    )?.value;

    return value ?? null;
  }

  async setMonthlyGoal(
    workspaceId: string,
    config: OpportunityMonthlyGoal,
  ): Promise<OpportunityMonthlyGoal> {
    await this.keyValuePairService.set({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: OPPORTUNITY_MONTHLY_GOAL_KEY,
      value: config,
    });

    return config;
  }
}
```

- [ ] **Step 3: Service unit test (mirror the probability service spec)**

Open `packages/twenty-server/src/modules/opportunity/services/__tests__/opportunity-probability-config.service.spec.ts` as the template; write `opportunity-monthly-goal-config.service.spec.ts` covering: `getMonthlyGoal` returns the stored `value` when present; returns `null` when the store is empty; `setMonthlyGoal` calls `keyValuePairService.set` with the right key/type/workspaceId/value and returns the config. Mock `KeyValuePairService` the same way the probability spec does.

Run: `cd packages/twenty-server && npx jest opportunity-monthly-goal-config.service`
Expected: PASS.

- [ ] **Step 4: DTO**

`update-opportunity-monthly-goal.input.ts`:
```ts
import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsObject } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

import { type OpportunityMonthlyGoal } from 'src/modules/opportunity/types/opportunity-monthly-goal-key-value.type';

@InputType('UpdateOpportunityMonthlyGoalInput')
export class UpdateOpportunityMonthlyGoalInput {
  @IsObject()
  @IsNotEmpty()
  @Field(() => GraphQLJSON)
  value: OpportunityMonthlyGoal;
}
```

- [ ] **Step 5: Resolver**

`opportunity-monthly-goal-config.resolver.ts` — mirror `OpportunityProbabilityConfigResolver`:
```ts
import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';
import { PermissionFlagType } from 'twenty-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { UpdateOpportunityMonthlyGoalInput } from 'src/modules/opportunity/dtos/update-opportunity-monthly-goal.input';
import { OpportunityMonthlyGoalConfigService } from 'src/modules/opportunity/services/opportunity-monthly-goal-config.service';
import { type OpportunityMonthlyGoal } from 'src/modules/opportunity/types/opportunity-monthly-goal-key-value.type';

@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class OpportunityMonthlyGoalConfigResolver {
  constructor(
    private readonly opportunityMonthlyGoalConfigService: OpportunityMonthlyGoalConfigService,
  ) {}

  @UseGuards(NoPermissionGuard)
  @Query(() => GraphQLJSON, { nullable: true })
  async opportunityMonthlyGoal(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<OpportunityMonthlyGoal | null> {
    return this.opportunityMonthlyGoalConfigService.getMonthlyGoal(workspaceId);
  }

  @UseGuards(SettingsPermissionGuard(PermissionFlagType.DATA_MODEL))
  @Mutation(() => GraphQLJSON)
  async updateOpportunityMonthlyGoal(
    @Args('input') input: UpdateOpportunityMonthlyGoalInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<OpportunityMonthlyGoal> {
    return this.opportunityMonthlyGoalConfigService.setMonthlyGoal(
      workspaceId,
      input.value,
    );
  }
}
```

- [ ] **Step 6: Module + core-engine registration**

`opportunity-monthly-goal-config.module.ts` (mirror the probability config module: imports `KeyValuePairModule`, `PermissionsModule`; providers service + resolver; exports service).

In `core-engine.module.ts`: add the import next to `OpportunityProbabilityConfigModule` (line ~82) and add `OpportunityMonthlyGoalConfigModule,` to the module array next to `OpportunityProbabilityConfigModule` (line ~142).

- [ ] **Step 7: Typecheck + lint + verify + commit**

Run: `npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server`
Expected: 0. Controller will confirm the `opportunityMonthlyGoal` query is exposed via `/metadata` introspection after the server restarts (as was done for the probability resolver).
```bash
git add packages/twenty-server/src/modules/opportunity/types/opportunity-monthly-goal-key-value.type.ts packages/twenty-server/src/modules/opportunity/services/opportunity-monthly-goal-config.service.ts packages/twenty-server/src/modules/opportunity/services/__tests__/opportunity-monthly-goal-config.service.spec.ts packages/twenty-server/src/modules/opportunity/dtos/update-opportunity-monthly-goal.input.ts packages/twenty-server/src/modules/opportunity/resolvers/opportunity-monthly-goal-config.resolver.ts packages/twenty-server/src/modules/opportunity/opportunity-monthly-goal-config.module.ts packages/twenty-server/src/engine/core-modules/core-engine.module.ts
git commit -m "feat(server): opportunity monthly goal config resolver"
```

---

### Task 2: Frontend config hooks + settings page

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/graphql/queries/getOpportunityMonthlyGoal.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/graphql/mutations/updateOpportunityMonthlyGoal.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/hooks/useOpportunityMonthlyGoal.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/hooks/useUpdateOpportunityMonthlyGoal.ts`
- Create: `packages/twenty-front/src/modules/settings/data-model/object-details/components/OpportunityGoalForm.tsx`
- Create: `packages/twenty-front/src/pages/settings/data-model/SettingsObjectOpportunityGoal.tsx`
- Modify: `packages/twenty-shared/src/types/SettingsPath.ts` (add `ObjectGoal`)
- Modify: `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx` (lazy import + route)
- Modify: `packages/twenty-front/src/modules/settings/data-model/object-details/components/tabs/ObjectSettings.tsx` (section link)

- [ ] **Step 1: GraphQL docs**

`getOpportunityMonthlyGoal.ts`:
```ts
import { gql } from '@apollo/client';

export const GET_OPPORTUNITY_MONTHLY_GOAL = gql`
  query GetOpportunityMonthlyGoal {
    opportunityMonthlyGoal
  }
`;
```
`updateOpportunityMonthlyGoal.ts`:
```ts
import { gql } from '@apollo/client';

export const UPDATE_OPPORTUNITY_MONTHLY_GOAL = gql`
  mutation UpdateOpportunityMonthlyGoal(
    $input: UpdateOpportunityMonthlyGoalInput!
  ) {
    updateOpportunityMonthlyGoal(input: $input)
  }
`;
```

- [ ] **Step 2: Hooks**

`useOpportunityMonthlyGoal.ts`:
```ts
import { useQuery } from '@apollo/client/react';

import { GET_OPPORTUNITY_MONTHLY_GOAL } from '@/object-record/record-show/opportunity/graphql/queries/getOpportunityMonthlyGoal';

type OpportunityMonthlyGoal = { targetAmount: number };

type GetOpportunityMonthlyGoalResult = {
  opportunityMonthlyGoal: OpportunityMonthlyGoal | null;
};

export const useOpportunityMonthlyGoal = (): {
  config: OpportunityMonthlyGoal | null;
  loading: boolean;
} => {
  const { data, loading } = useQuery<GetOpportunityMonthlyGoalResult>(
    GET_OPPORTUNITY_MONTHLY_GOAL,
  );

  return { config: data?.opportunityMonthlyGoal ?? null, loading };
};
```
`useUpdateOpportunityMonthlyGoal.ts`:
```ts
import { useMutation } from '@apollo/client/react';

import { UPDATE_OPPORTUNITY_MONTHLY_GOAL } from '@/object-record/record-show/opportunity/graphql/mutations/updateOpportunityMonthlyGoal';
import { GET_OPPORTUNITY_MONTHLY_GOAL } from '@/object-record/record-show/opportunity/graphql/queries/getOpportunityMonthlyGoal';

export const useUpdateOpportunityMonthlyGoal = () => {
  const [mutate] = useMutation(UPDATE_OPPORTUNITY_MONTHLY_GOAL, {
    refetchQueries: [{ query: GET_OPPORTUNITY_MONTHLY_GOAL }],
  });

  const updateMonthlyGoal = (targetAmount: number) =>
    mutate({ variables: { input: { value: { targetAmount } } } });

  return { updateMonthlyGoal };
};
```

- [ ] **Step 3: Goal form component**

`OpportunityGoalForm.tsx` — one number input seeded once from the initial target, plus a Save button. Mirror `OpportunityProbabilityForm`'s seed-once/controlled pattern with a single field. `TextInput` from `twenty-ui/input`, `Button` from `twenty-ui/input`.
```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { TextInput } from '@/ui/input/components/TextInput';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  max-width: 320px;
`;

type OpportunityGoalFormProps = {
  initialTargetAmount: number | null;
  onSave: (targetAmount: number) => void;
};

export const OpportunityGoalForm = ({
  initialTargetAmount,
  onSave,
}: OpportunityGoalFormProps) => {
  const [value, setValue] = useState<string>(
    initialTargetAmount ? String(initialTargetAmount) : '',
  );

  const handleSave = () => {
    const parsed = Number(value);
    onSave(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
  };

  return (
    <StyledContainer>
      <TextInput
        label={t`Monatsziel (Umsatz)`}
        type="number"
        value={value}
        onChange={(text) => setValue(text)}
      />
      <Button
        title={t`Speichern`}
        variant="primary"
        accent="blue"
        onClick={handleSave}
      />
    </StyledContainer>
  );
};
```
Note: `TextInput` is imported from `@/ui/input/components/TextInput` and `Button` from `twenty-ui/input` (verified against `OpportunityProbabilityForm`); `TextInput`'s `onChange` yields the string value. `color.green`, `background.transparent.light`, `border.radius.sm` are verified-present theme tokens.

- [ ] **Step 4: Settings page**

`SettingsObjectOpportunityGoal.tsx` — mirror `SettingsObjectOpportunityProbability.tsx` (breadcrumb links, skeleton gating, snackbar), with the single-field form:
```tsx
import { useParams } from 'react-router-dom';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useOpportunityMonthlyGoal } from '@/object-record/record-show/opportunity/hooks/useOpportunityMonthlyGoal';
import { useUpdateOpportunityMonthlyGoal } from '@/object-record/record-show/opportunity/hooks/useUpdateOpportunityMonthlyGoal';
import { OpportunityGoalForm } from '@/settings/data-model/object-details/components/OpportunityGoalForm';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSectionSkeletonLoader } from '@/settings/components/SettingsSectionSkeletonLoader';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';

export const SettingsObjectOpportunityGoal = () => {
  const { objectNamePlural = '' } = useParams();
  const { enqueueSuccessSnackBar } = useSnackBar();

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const { config, loading } = useOpportunityMonthlyGoal();
  const { updateMonthlyGoal } = useUpdateOpportunityMonthlyGoal();

  const handleSave = async (targetAmount: number) => {
    await updateMonthlyGoal(targetAmount);
    enqueueSuccessSnackBar({ message: t`Verkaufsziel aktualisiert` });
  };

  return (
    <SettingsPageLayout
      title={t`Verkaufsziel`}
      links={[
        { children: t`Workspace`, href: getSettingsPath(SettingsPath.General) },
        { children: t`Objects`, href: getSettingsPath(SettingsPath.Objects) },
        {
          children: objectMetadataItem.labelPlural,
          href: getSettingsPath(SettingsPath.ObjectDetail, {
            objectNamePlural: objectNamePlural || objectMetadataItem.namePlural,
          }),
        },
        { children: t`Verkaufsziel` },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Monatsziel`}
            description={t`Monatliches Umsatzziel fürs Team; der Fortschritt zählt gewonnene Deals des Monats`}
          />
          {loading ? (
            <SettingsSectionSkeletonLoader />
          ) : (
            <OpportunityGoalForm
              initialTargetAmount={config?.targetAmount ?? null}
              onSave={handleSave}
            />
          )}
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
```

- [ ] **Step 5: SettingsPath + route**

In `SettingsPath.ts`, after `ObjectProbability`, add:
```ts
  ObjectGoal = 'objects/:objectNamePlural/goal',
```
Rebuild twenty-shared: `npx nx build twenty-shared`.

In `SettingsRoutes.tsx`, add a lazy block next to the probability one:
```tsx
const SettingsObjectOpportunityGoal = lazy(() =>
  import('~/pages/settings/data-model/SettingsObjectOpportunityGoal').then(
    (module) => ({ default: module.SettingsObjectOpportunityGoal }),
  ),
);
```
and a route next to `ObjectProbability`:
```tsx
        <Route
          path={SettingsPath.ObjectGoal}
          element={<SettingsObjectOpportunityGoal />}
        />
```

- [ ] **Step 6: ObjectSettings section link**

In `ObjectSettings.tsx`, add a third opportunity-gated `StyledFormSectionContainer` after the Probability one (import `IconTarget`):
```tsx
      {objectMetadataItem.nameSingular ===
        CoreObjectNameSingular.Opportunity && (
        <StyledFormSectionContainer>
          <Section>
            <H2Title
              title={t`Verkaufsziel`}
              description={t`Monatliches Umsatzziel fürs Team festlegen`}
            />
            <Button
              Icon={IconTarget}
              title={t`Monatsziel konfigurieren`}
              variant="secondary"
              size="small"
              to={getSettingsPath(SettingsPath.ObjectGoal, {
                objectNamePlural: objectMetadataItem.namePlural,
              })}
            />
          </Section>
        </StyledFormSectionContainer>
      )}
```

- [ ] **Step 7: Build + typecheck + lint + commit**

```bash
npx nx build twenty-shared
rm -rf packages/twenty-front/node_modules/.vite
npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front
```
```bash
git add packages/twenty-shared/src/types/SettingsPath.ts packages/twenty-front/src/modules/object-record/record-show/opportunity/graphql packages/twenty-front/src/modules/object-record/record-show/opportunity/hooks packages/twenty-front/src/modules/settings/data-model/object-details/components/OpportunityGoalForm.tsx packages/twenty-front/src/pages/settings/data-model/SettingsObjectOpportunityGoal.tsx packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx packages/twenty-front/src/modules/settings/data-model/object-details/components/tabs/ObjectSettings.tsx
git commit -m "feat(front): opportunity monthly goal settings page"
```

---

### Task 3: `computeMonthlyGoalProgress` util

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/opportunity-goal/utils/computeMonthlyGoalProgress.ts`
- Test: `packages/twenty-front/src/modules/object-record/opportunity-goal/utils/__tests__/computeMonthlyGoalProgress.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type WonDealInput = { amountMicros: number | null; closedAt: string | null };
  export type GoalMonthBucket = { year: number; month: number; achievedMicros: number };
  export type MonthlyGoalProgressResult = { current: { achievedMicros: number; targetMicros: number | null; ratio: number | null }; history: GoalMonthBucket[] };
  export const computeMonthlyGoalProgress = (wonDeals: WonDealInput[], targetMicros: number | null, now: Date, monthsBack?: number): MonthlyGoalProgressResult;
  ```

- [ ] **Step 1: Write the failing test**

```ts
import { computeMonthlyGoalProgress } from '../computeMonthlyGoalProgress';

// now = 15 June 2026
const NOW = new Date('2026-06-15T12:00:00.000Z');
const M = 1_000_000;
const iso = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d, 12)).toISOString();

describe('computeMonthlyGoalProgress', () => {
  it('sums won amounts closed in the current month into achievedMicros', () => {
    const result = computeMonthlyGoalProgress(
      [
        { amountMicros: 10 * M, closedAt: iso(2026, 6, 3) },
        { amountMicros: 5 * M, closedAt: iso(2026, 6, 20) },
        { amountMicros: 99 * M, closedAt: iso(2026, 5, 30) }, // last month
      ],
      100 * M,
      NOW,
    );
    expect(result.current.achievedMicros).toBe(15 * M);
    expect(result.current.targetMicros).toBe(100 * M);
    expect(result.current.ratio).toBeCloseTo(0.15);
  });

  it('ignores deals with null closedAt or null amount', () => {
    const result = computeMonthlyGoalProgress(
      [
        { amountMicros: 10 * M, closedAt: null },
        { amountMicros: null, closedAt: iso(2026, 6, 3) },
        { amountMicros: 7 * M, closedAt: iso(2026, 6, 10) },
      ],
      null,
      NOW,
    );
    expect(result.current.achievedMicros).toBe(7 * M);
  });

  it('returns a null ratio when the target is null or zero', () => {
    expect(
      computeMonthlyGoalProgress([], null, NOW).current.ratio,
    ).toBeNull();
    expect(
      computeMonthlyGoalProgress([], 0, NOW).current.ratio,
    ).toBeNull();
  });

  it('returns monthsBack months ending at now, oldest first, with per-month sums', () => {
    const result = computeMonthlyGoalProgress(
      [
        { amountMicros: 4 * M, closedAt: iso(2026, 4, 5) },
        { amountMicros: 6 * M, closedAt: iso(2026, 6, 5) },
      ],
      50 * M,
      NOW,
      3,
    );
    expect(result.history).toEqual([
      { year: 2026, month: 4, achievedMicros: 4 * M },
      { year: 2026, month: 5, achievedMicros: 0 },
      { year: 2026, month: 6, achievedMicros: 6 * M },
    ]);
  });

  it('defaults history to 6 months and handles year rollover', () => {
    // now Jan 2026 → 6 months back reaches Aug 2025
    const result = computeMonthlyGoalProgress(
      [{ amountMicros: 3 * M, closedAt: iso(2025, 9, 9) }],
      null,
      new Date('2026-01-10T12:00:00.000Z'),
    );
    expect(result.history).toHaveLength(6);
    expect(result.history[0]).toEqual({
      year: 2025,
      month: 8,
      achievedMicros: 0,
    });
    expect(result.history[5]).toEqual({
      year: 2026,
      month: 1,
      achievedMicros: 0,
    });
    expect(
      result.history.find((b) => b.year === 2025 && b.month === 9)
        ?.achievedMicros,
    ).toBe(3 * M);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/twenty-front && npx jest computeMonthlyGoalProgress`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
type WonDealInput = { amountMicros: number | null; closedAt: string | null };

export type GoalMonthBucket = {
  year: number;
  month: number; // 1-12
  achievedMicros: number;
};

export type MonthlyGoalProgressResult = {
  current: {
    achievedMicros: number;
    targetMicros: number | null;
    ratio: number | null;
  };
  history: GoalMonthBucket[];
};

const monthKey = (year: number, month: number) => `${year}-${month}`;

export const computeMonthlyGoalProgress = (
  wonDeals: WonDealInput[],
  targetMicros: number | null,
  now: Date,
  monthsBack: number = 6,
): MonthlyGoalProgressResult => {
  const sumByMonth = new Map<string, number>();

  for (const deal of wonDeals) {
    if (deal.closedAt === null || deal.amountMicros === null) {
      continue;
    }
    const closed = new Date(deal.closedAt);
    const key = monthKey(closed.getFullYear(), closed.getMonth() + 1);
    sumByMonth.set(key, (sumByMonth.get(key) ?? 0) + deal.amountMicros);
  }

  const currentAchieved =
    sumByMonth.get(monthKey(now.getFullYear(), now.getMonth() + 1)) ?? 0;

  const ratio =
    targetMicros !== null && targetMicros > 0
      ? currentAchieved / targetMicros
      : null;

  const history: GoalMonthBucket[] = [];
  for (let offset = monthsBack - 1; offset >= 0; offset--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;
    history.push({
      year,
      month,
      achievedMicros: sumByMonth.get(monthKey(year, month)) ?? 0,
    });
  }

  return {
    current: { achievedMicros: currentAchieved, targetMicros, ratio },
    history,
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/twenty-front && npx jest computeMonthlyGoalProgress`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck + lint + commit**

```bash
git add packages/twenty-front/src/modules/object-record/opportunity-goal/utils
git commit -m "feat(front): opportunity monthly-goal-progress util"
```

---

### Task 4: Goal progress component + page + AppPath + route

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/opportunity-goal/components/OpportunityGoalProgress.tsx`
- Create: `packages/twenty-front/src/pages/opportunity-goal/OpportunityGoalPage.tsx`
- Modify: `packages/twenty-shared/src/types/AppPath.ts` (add member after `NextActionsPage`)
- Modify: `packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx` (lazy import + route)

**Interfaces:**
- Consumes: `computeMonthlyGoalProgress`, `MonthlyGoalProgressResult` (Task 3); `useOpportunityMonthlyGoal` (Task 2).
- Produces: `OpportunityGoalProgress`, `OpportunityGoalPage`, `AppPath.GoalsPage`.

- [ ] **Step 1: AppPath enum**

In `AppPath.ts`, after `NextActionsPage = '/opportunities/next-actions',`, add:
```ts
  GoalsPage = '/opportunities/goals',
```
Run: `npx nx build twenty-shared`.

- [ ] **Step 2: Progress component**

`OpportunityGoalProgress.tsx` — current-month header (Ziel / Erreicht / progress bar + %) and a 6-month history table. Currency helper mirrors the Lost-reason/Forecast tables; month names via `dateLocaleState`.
```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { format } from 'date-fns';

import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { type MonthlyGoalProgressResult } from '@/object-record/opportunity-goal/utils/computeMonthlyGoalProgress';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const getCurrencySymbol = (currencyCode: string): string => {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0);

  return parts.find((part) => part.type === 'currency')?.value ?? currencyCode;
};

const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[6]};
`;

const StyledStatRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[6]};
  font-variant-numeric: tabular-nums;
`;

const StyledStatLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  margin-right: ${themeCssVariables.spacing[1]};
`;

const StyledBarTrack = styled.div`
  background-color: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  height: 10px;
  overflow: hidden;
  width: 100%;
`;

const StyledBarFill = styled.div<{ ratio: number }>`
  background-color: ${themeCssVariables.color.green};
  height: 100%;
  width: ${({ ratio }) => Math.min(1, Math.max(0, ratio)) * 100}%;
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledAmount = styled.span`
  font-variant-numeric: tabular-nums;
`;

type OpportunityGoalProgressProps = {
  result: MonthlyGoalProgressResult;
  currencyCode: string;
};

export const OpportunityGoalProgress = ({
  result,
  currencyCode,
}: OpportunityGoalProgressProps) => {
  const { formatNumber } = useNumberFormat();
  const dateLocale = useAtomStateValue(dateLocaleState);
  const symbol = getCurrencySymbol(currencyCode);

  const formatMicros = (micros: number) =>
    `${symbol}${formatNumber(micros / 1_000_000, { decimals: 0 })}`;

  const { current, history } = result;

  return (
    <div>
      <StyledHeader>
        <StyledStatRow>
          <span>
            <StyledStatLabel>{t`Ziel`}</StyledStatLabel>
            {current.targetMicros === null
              ? t`Kein Ziel gesetzt`
              : formatMicros(current.targetMicros)}
          </span>
          <span>
            <StyledStatLabel>{t`Erreicht`}</StyledStatLabel>
            {formatMicros(current.achievedMicros)}
          </span>
        </StyledStatRow>
        {current.ratio === null ? (
          <StyledHint>{t`Lege ein Monatsziel in den Einstellungen fest.`}</StyledHint>
        ) : (
          <>
            <StyledBarTrack>
              <StyledBarFill ratio={current.ratio} />
            </StyledBarTrack>
            <span>{Math.round(current.ratio * 100)}%</span>
          </>
        )}
      </StyledHeader>

      <Table>
        <TableRow>
          <TableHeader>{t`Monat`}</TableHeader>
          <TableHeader>{t`Gewonnen`}</TableHeader>
          <TableHeader>{t`Ziel`}</TableHeader>
          <TableHeader>%</TableHeader>
        </TableRow>
        <TableBody>
          {history.map((bucket) => {
            const rowRatio =
              current.targetMicros !== null && current.targetMicros > 0
                ? bucket.achievedMicros / current.targetMicros
                : null;

            return (
              <TableRow key={`${bucket.year}-${bucket.month}`}>
                <TableCell>
                  {format(new Date(bucket.year, bucket.month - 1, 1), 'MMMM yyyy', {
                    locale: dateLocale.localeCatalog,
                  })}
                </TableCell>
                <TableCell>
                  <StyledAmount>{formatMicros(bucket.achievedMicros)}</StyledAmount>
                </TableCell>
                <TableCell>
                  <StyledAmount>
                    {current.targetMicros === null
                      ? '-'
                      : formatMicros(current.targetMicros)}
                  </StyledAmount>
                </TableCell>
                <TableCell>
                  {rowRatio === null ? '-' : `${Math.round(rowRatio * 100)}%`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
```
Note: verify token names `themeCssVariables.color.green`, `background.transparent.light`, `border.radius.sm` exist (the rotting/next-action badges use `tag.*` and `background.transparent.light`; if `color.green` is not present, use the green token those badges use, e.g. `tag.text.green`). Confirm the `StyledBarFill<{ ratio }>` Linaria dynamic-prop form compiles (Linaria supports the `${({ ratio }) => ...}` interpolation); if the project forbids dynamic styled props, set the width via an inline `style={{ width: ... }}` instead.

- [ ] **Step 3: Goal page**

`OpportunityGoalPage.tsx`:
```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import {
  CoreObjectNameSingular,
  type CurrencyMetadata,
} from 'twenty-shared/types';
import { IconTarget } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useOpportunityMonthlyGoal } from '@/object-record/record-show/opportunity/hooks/useOpportunityMonthlyGoal';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { OpportunityGoalProgress } from '@/object-record/opportunity-goal/components/OpportunityGoalProgress';
import { computeMonthlyGoalProgress } from '@/object-record/opportunity-goal/utils/computeMonthlyGoalProgress';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

type GoalWonDealRecord = {
  id: string;
  __typename: 'Opportunity';
  amount: CurrencyMetadata | null;
  closedAt: string | null;
  status: string;
};

export const OpportunityGoalPage = () => {
  const { config, loading: goalLoading } = useOpportunityMonthlyGoal();

  const { records, loading: recordsLoading } =
    useFindManyRecords<GoalWonDealRecord>({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      filter: { status: { eq: 'WON' } },
      recordGqlFields: { amount: true, closedAt: true, status: true },
      limit: 1000,
    });

  const loading = goalLoading || recordsLoading;

  const targetMicros =
    config?.targetAmount && config.targetAmount > 0
      ? config.targetAmount * 1_000_000
      : null;

  const result = computeMonthlyGoalProgress(
    records.map((record) => ({
      amountMicros: record.amount?.amountMicros ?? null,
      closedAt: record.closedAt,
    })),
    targetMicros,
    new Date(),
  );

  const currencyCode =
    records
      .map((record) => record.amount?.currencyCode)
      .find((code): code is string => typeof code === 'string') ?? 'USD';

  return (
    <PageContainer>
      <PageHeader title={t`Ziele`} Icon={IconTarget} />
      <StyledBody>
        {loading ? null : (
          <OpportunityGoalProgress result={result} currencyCode={currencyCode} />
        )}
      </StyledBody>
    </PageContainer>
  );
};
```

- [ ] **Step 4: Register the lazy route**

In `useCreateWorkspaceAppRouter.tsx`, after the `OpportunityNextActionReportPage` lazy block, add:
```tsx
const OpportunityGoalPage = lazy(() =>
  import('~/pages/opportunity-goal/OpportunityGoalPage').then((module) => ({
    default: module.OpportunityGoalPage,
  })),
);
```
and after the `AppPath.NextActionsPage` `<Route>` block, add:
```tsx
              <Route
                path={AppPath.GoalsPage}
                element={
                  <LazyRoute>
                    <OpportunityGoalPage />
                  </LazyRoute>
                }
              />
```

- [ ] **Step 5: Clear vite cache + typecheck + lint + commit**

```bash
rm -rf packages/twenty-front/node_modules/.vite
npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front
```
```bash
git add packages/twenty-shared/src/types/AppPath.ts packages/twenty-front/src/modules/object-record/opportunity-goal/components packages/twenty-front/src/pages/opportunity-goal packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx
git commit -m "feat(front): opportunity goals page + route"
```

---

### Task 5: Navigation link + de-DE strings

**Files:**
- Modify: `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx`
- Modify: `packages/twenty-front/src/locales/de-DE.po`

- [ ] **Step 1: Add the gated nav item**

Extend the icon import with `IconTarget` (alphabetical), and add a 6th `NavigationDrawerItem` after "Nächste Aktionen", inside the `{hasOpportunityObject && (<>...</>)}` fragment:
```tsx
          <NavigationDrawerItem
            label={t`Ziele`}
            to={AppPath.GoalsPage}
            Icon={IconTarget}
            active={pathname === AppPath.GoalsPage}
          />
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front`
Expected: 0.

- [ ] **Step 3: Extract + fill de-DE + compile**

Run: `npx nx run twenty-front:lingui:extract`
Then fill identity `msgstr` in `de-DE.po` for the new German-source keys (leave already-present sibling keys — `Ziel`, `Monat`, `Speichern` — intact):
- `Ziele`, `Verkaufsziel`, `Monatsziel`, `Monatsziel (Umsatz)`, `Erreicht`, `Gewonnen`,
  `Kein Ziel gesetzt`, `Verkaufsziel aktualisiert`, `Monatsziel konfigurieren`,
  `Monatliches Umsatzziel fürs Team; der Fortschritt zählt gewonnene Deals des Monats`,
  `Monatliches Umsatzziel fürs Team festlegen`,
  `Lege ein Monatsziel in den Einstellungen fest.` — each `msgstr` == `msgid`.

Run: `npx nx run twenty-front:lingui:compile`

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx packages/twenty-front/src/locales
git commit -m "feat(front): opportunity goals nav link + de-DE strings"
```

---

## Live-verify (after all tasks, before merge)

1. Start dev env + server + worker + front; log in.
2. Settings → Objects → Opportunity → **Verkaufsziel**: set a monthly target (e.g. 200000), Save.
3. Open `/opportunities/goals` via the "Ziele" nav link: **Ziel** shows the target; **Erreicht** = sum of WON deals closed this month; the bar + % reflect achieved/target; the history table lists the last 6 months.
4. Mark a deal Won with a close date in the current month → Erreicht + bar + % + this month's history row increase accordingly. Cross-check achieved against the DB (Postgres MCP, read-only): sum(amount) of WON deals with closedAt in the month.
5. Clear the target (empty → 0) → the page shows "Kein Ziel gesetzt" + the settings hint, no bar. Restore the deal + target afterwards.

## Self-review notes

- Spec coverage: backend config (T1) + settings (T2) + util TDD (T3) + goals page/route (T4) + nav/i18n (T5) — every spec section maps to a task.
- Utils return raw micros; the component formats currency + rounds %. Target `0`/null ⇒ `targetMicros = null` ⇒ no ratio/bar, consistently in the page and util.
- The two integration risks are flagged inline: the settings form's `TextInput`/`Button` prop names (T2 Step 3) and the progress-bar theme tokens / Linaria dynamic-prop (T4 Step 2) — both to verify against existing components.
- `IconTarget` verified present. Resolver mirrors the probability resolver (query nullable for the unset case).
