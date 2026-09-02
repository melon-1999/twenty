# Opportunity Next Action (Activities, Slice A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface open opportunities that have no upcoming action (no open task due in the future), show each deal's next due date on its detail page, and add a report of deals missing a next action.

**Architecture:** Client-side only, derived from existing Task objects via the TaskTarget junction (`targetOpportunityId` + `task { dueAt, status }`). Two pure aggregation utils (TDD), a per-record detail badge, and a report page mirroring the merged Forecast / Lost-reason / analytics report pattern. No backend, no new field.

**Tech Stack:** React 18, TypeScript strict (no `any`), Jotai, Linaria, Lingui, Jest, `twenty-front`.

## Global Constraints

- Caveman chat prose only; code/commits/PRs in normal English.
- No signatures / Co-Authored-By / "Generated with Claude" tags anywhere.
- Named exports only, no default exports. Functional components only. `type` over `interface`. String literals over enums. No `any`. No abbreviations. Short `//` comments only when non-obvious.
- Open task = `status !== 'DONE'`. Upcoming = open task with `dueAt != null` and `dueAt >= now`. `nextActivityAt` = earliest upcoming dueAt, else `null`. Missing next action = open opportunity with `nextActivityAt === null`. Rounding/formatting for display only; utils return raw values.
- Icon: `IconCalendarDue` (verified present in `twenty-ui/icon`).
- `is: 'NOT_NULL'` is a valid Twenty filter operator; the util also ignores null-target rows so correctness never depends on the filter.
- After frontend code: `rm -rf packages/twenty-front/node_modules/.vite` (only after the twenty-shared AppPath change), `npx nx typecheck twenty-front`, `npx nx lint:diff-with-main twenty-front` = 0. Run `npx nx fmt twenty-front` if oxfmt/oxlint flags files. `lint:diff-with-main` may report "no changed files" pre-commit — also run oxlint directly on new files and report both.

---

### Task 1: `computeNextActivityAt` util

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/opportunity-next-action/utils/computeNextActivityAt.ts`
- Test: `packages/twenty-front/src/modules/object-record/opportunity-next-action/utils/__tests__/computeNextActivityAt.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ActivityTaskInput = { dueAt: string | null; status: string | null };
  export const computeNextActivityAt = (tasks: ActivityTaskInput[], now: Date): string | null;
  ```

- [ ] **Step 1: Write the failing test**

```ts
import { computeNextActivityAt } from '../computeNextActivityAt';

const NOW = new Date('2026-09-01T12:00:00.000Z');
const at = (iso: string) => iso;

describe('computeNextActivityAt', () => {
  it('returns null when there are no tasks', () => {
    expect(computeNextActivityAt([], NOW)).toBeNull();
  });

  it('returns the earliest future open due date', () => {
    const tasks = [
      { dueAt: at('2026-09-10T00:00:00.000Z'), status: 'TODO' },
      { dueAt: at('2026-09-05T00:00:00.000Z'), status: 'IN_PROGRESS' },
      { dueAt: at('2026-09-20T00:00:00.000Z'), status: 'TODO' },
    ];
    expect(computeNextActivityAt(tasks, NOW)).toBe('2026-09-05T00:00:00.000Z');
  });

  it('ignores DONE tasks even if their due date is sooner', () => {
    const tasks = [
      { dueAt: at('2026-09-03T00:00:00.000Z'), status: 'DONE' },
      { dueAt: at('2026-09-08T00:00:00.000Z'), status: 'TODO' },
    ];
    expect(computeNextActivityAt(tasks, NOW)).toBe('2026-09-08T00:00:00.000Z');
  });

  it('ignores past-due tasks', () => {
    const tasks = [
      { dueAt: at('2026-08-01T00:00:00.000Z'), status: 'TODO' },
      { dueAt: at('2026-09-09T00:00:00.000Z'), status: 'TODO' },
    ];
    expect(computeNextActivityAt(tasks, NOW)).toBe('2026-09-09T00:00:00.000Z');
  });

  it('ignores open tasks with no due date', () => {
    const tasks = [
      { dueAt: null, status: 'TODO' },
      { dueAt: at('2026-09-07T00:00:00.000Z'), status: 'TODO' },
    ];
    expect(computeNextActivityAt(tasks, NOW)).toBe('2026-09-07T00:00:00.000Z');
  });

  it('returns null when every open task is past-due, done, or dateless', () => {
    const tasks = [
      { dueAt: at('2026-08-01T00:00:00.000Z'), status: 'TODO' },
      { dueAt: at('2026-09-30T00:00:00.000Z'), status: 'DONE' },
      { dueAt: null, status: 'IN_PROGRESS' },
    ];
    expect(computeNextActivityAt(tasks, NOW)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/twenty-front && npx jest computeNextActivityAt`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
export type ActivityTaskInput = { dueAt: string | null; status: string | null };

export const computeNextActivityAt = (
  tasks: ActivityTaskInput[],
  now: Date,
): string | null => {
  const nowMs = now.getTime();

  const upcoming = tasks
    .filter((task) => task.status !== 'DONE' && task.dueAt !== null)
    .map((task) => task.dueAt as string)
    .filter((dueAt) => new Date(dueAt).getTime() >= nowMs);

  if (upcoming.length === 0) {
    return null;
  }

  return upcoming.reduce((earliest, dueAt) =>
    new Date(dueAt).getTime() < new Date(earliest).getTime() ? dueAt : earliest,
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/twenty-front && npx jest computeNextActivityAt`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck + lint + commit**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front`
```bash
git add packages/twenty-front/src/modules/object-record/opportunity-next-action/utils/computeNextActivityAt.ts packages/twenty-front/src/modules/object-record/opportunity-next-action/utils/__tests__/computeNextActivityAt.test.ts
git commit -m "feat(front): opportunity next-activity util"
```

---

### Task 2: `computeMissingNextAction` util

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/opportunity-next-action/utils/computeMissingNextAction.ts`
- Test: `packages/twenty-front/src/modules/object-record/opportunity-next-action/utils/__tests__/computeMissingNextAction.test.ts`

**Interfaces:**
- Consumes: `computeNextActivityAt`, `ActivityTaskInput` (Task 1).
- Produces:
  ```ts
  export type MissingNextActionOpportunity = { id: string; name: string | null; stage: string | null; amountMicros: number | null };
  export type TaskTargetInput = { targetOpportunityId: string | null; dueAt: string | null; status: string | null };
  export type NextActionResult = { opportunities: MissingNextActionOpportunity[]; totalMissing: number };
  export const computeMissingNextAction = (openOpportunities: MissingNextActionOpportunity[], taskTargets: TaskTargetInput[], now: Date): NextActionResult;
  ```

- [ ] **Step 1: Write the failing test**

```ts
import { computeMissingNextAction } from '../computeMissingNextAction';

const NOW = new Date('2026-09-01T12:00:00.000Z');

const opp = (id: string): { id: string; name: string | null; stage: string | null; amountMicros: number | null } => ({
  id,
  name: `Deal ${id}`,
  stage: 'NEW',
  amountMicros: 1000000,
});

describe('computeMissingNextAction', () => {
  it('excludes an opportunity that has an upcoming open task', () => {
    const result = computeMissingNextAction(
      [opp('a'), opp('b')],
      [
        { targetOpportunityId: 'a', dueAt: '2026-09-10T00:00:00.000Z', status: 'TODO' },
      ],
      NOW,
    );
    expect(result.opportunities.map((o) => o.id)).toEqual(['b']);
    expect(result.totalMissing).toBe(1);
  });

  it('includes an opportunity whose only task is DONE, past-due, or dateless', () => {
    const result = computeMissingNextAction(
      [opp('a'), opp('b'), opp('c')],
      [
        { targetOpportunityId: 'a', dueAt: '2026-09-10T00:00:00.000Z', status: 'DONE' },
        { targetOpportunityId: 'b', dueAt: '2026-08-01T00:00:00.000Z', status: 'TODO' },
        { targetOpportunityId: 'c', dueAt: null, status: 'TODO' },
      ],
      NOW,
    );
    expect(result.opportunities.map((o) => o.id)).toEqual(['a', 'b', 'c']);
  });

  it('includes an opportunity with no task targets at all', () => {
    const result = computeMissingNextAction([opp('a')], [], NOW);
    expect(result.opportunities.map((o) => o.id)).toEqual(['a']);
  });

  it('ignores task targets whose targetOpportunityId is null', () => {
    const result = computeMissingNextAction(
      [opp('a')],
      [{ targetOpportunityId: null, dueAt: '2026-09-10T00:00:00.000Z', status: 'TODO' }],
      NOW,
    );
    expect(result.opportunities.map((o) => o.id)).toEqual(['a']);
  });

  it('preserves input order of opportunities', () => {
    const result = computeMissingNextAction([opp('x'), opp('y'), opp('z')], [], NOW);
    expect(result.opportunities.map((o) => o.id)).toEqual(['x', 'y', 'z']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/twenty-front && npx jest computeMissingNextAction`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
import {
  type ActivityTaskInput,
  computeNextActivityAt,
} from '@/object-record/opportunity-next-action/utils/computeNextActivityAt';

export type MissingNextActionOpportunity = {
  id: string;
  name: string | null;
  stage: string | null;
  amountMicros: number | null;
};

export type TaskTargetInput = {
  targetOpportunityId: string | null;
  dueAt: string | null;
  status: string | null;
};

export type NextActionResult = {
  opportunities: MissingNextActionOpportunity[];
  totalMissing: number;
};

export const computeMissingNextAction = (
  openOpportunities: MissingNextActionOpportunity[],
  taskTargets: TaskTargetInput[],
  now: Date,
): NextActionResult => {
  const tasksByOpportunity = new Map<string, ActivityTaskInput[]>();

  for (const taskTarget of taskTargets) {
    if (taskTarget.targetOpportunityId === null) {
      continue;
    }
    const tasks = tasksByOpportunity.get(taskTarget.targetOpportunityId) ?? [];
    tasks.push({ dueAt: taskTarget.dueAt, status: taskTarget.status });
    tasksByOpportunity.set(taskTarget.targetOpportunityId, tasks);
  }

  const opportunities = openOpportunities.filter(
    (opportunity) =>
      computeNextActivityAt(
        tasksByOpportunity.get(opportunity.id) ?? [],
        now,
      ) === null,
  );

  return { opportunities, totalMissing: opportunities.length };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/twenty-front && npx jest computeMissingNextAction`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck + lint + commit**

```bash
git add packages/twenty-front/src/modules/object-record/opportunity-next-action/utils/computeMissingNextAction.ts packages/twenty-front/src/modules/object-record/opportunity-next-action/utils/__tests__/computeMissingNextAction.test.ts
git commit -m "feat(front): opportunity missing-next-action util"
```

---

### Task 3: Detail badge (hook + component + wiring)

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/hooks/useOpportunityNextActivity.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityNextActivityBadge.tsx`
- Modify: `packages/twenty-front/src/pages/object-record/RecordShowPage.tsx` (add badge in the opportunity header fragment)

**Interfaces:**
- Consumes: `computeNextActivityAt` (Task 1).
- Produces: `useOpportunityNextActivity(recordId): string | null`; `OpportunityNextActivityBadge({ recordId, status })`.

- [ ] **Step 1: Create the per-record hook**

`useOpportunityNextActivity.ts` — fetches the deal's task targets and computes the next activity date. Mirrors `useOpportunityRottingForRecord`'s per-record-fetch shape but over `taskTarget`.

```ts
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { computeNextActivityAt } from '@/object-record/opportunity-next-action/utils/computeNextActivityAt';

type OpportunityTaskTargetRecord = {
  id: string;
  __typename: 'TaskTarget';
  task: { dueAt: string | null; status: string | null } | null;
};

// The record store only holds visible fields, so fetch the deal's task targets
// (with each task's dueAt/status) directly to compute the next activity date.
export const useOpportunityNextActivity = (recordId: string): string | null => {
  const { records } = useFindManyRecords<OpportunityTaskTargetRecord>({
    objectNameSingular: 'taskTarget',
    filter: { targetOpportunityId: { eq: recordId } },
    recordGqlFields: {
      task: { dueAt: true, status: true },
    },
    limit: 100,
  });

  const tasks = records.map((record) => ({
    dueAt: record.task?.dueAt ?? null,
    status: record.task?.status ?? null,
  }));

  return computeNextActivityAt(tasks, new Date());
};
```

Note: if `taskTarget`'s GraphQL exposes the relation id as a different field name than `targetOpportunityId`, or the `task` relation cannot be nested via `recordGqlFields`, adapt the query minimally and report it (the util contract stays `{ dueAt, status }[]`). Confirm the shape against the running schema during implementation.

- [ ] **Step 2: Create the badge component**

`OpportunityNextActivityBadge.tsx`:

```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { format } from 'date-fns';
import { IconCalendarDue } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useOpportunityNextActivity } from '@/object-record/record-show/opportunity/hooks/useOpportunityNextActivity';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { dateLocaleState } from '~/localization/states/dateLocaleState';

const StyledBadge = styled.span`
  align-items: center;
  border-radius: ${themeCssVariables.border.radius.sm};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledMissing = styled(StyledBadge)`
  background-color: ${themeCssVariables.tag.background.red};
  color: ${themeCssVariables.tag.text.red};
`;

const StyledUpcoming = styled(StyledBadge)`
  background-color: ${themeCssVariables.background.transparent.light};
  color: ${themeCssVariables.font.color.secondary};
`;

type OpportunityNextActivityBadgeProps = {
  recordId: string;
  status: string;
};

export const OpportunityNextActivityBadge = ({
  recordId,
  status,
}: OpportunityNextActivityBadgeProps) => {
  const dateLocale = useAtomStateValue(dateLocaleState);
  const nextActivityAt = useOpportunityNextActivity(recordId);

  // Closed deals do not need a next action.
  if (status !== 'OPEN') {
    return null;
  }

  if (nextActivityAt === null) {
    return (
      <StyledMissing>
        <IconCalendarDue size={14} />
        {t`Keine nächste Aktion`}
      </StyledMissing>
    );
  }

  const formatted = format(new Date(nextActivityAt), 'd. MMMM yyyy', {
    locale: dateLocale.localeCatalog,
  });

  return (
    <StyledUpcoming>
      <IconCalendarDue size={14} />
      {t`Nächste Aktion: ${formatted}`}
    </StyledUpcoming>
  );
};
```

Note: verify the exact token names `themeCssVariables.background.transparent.light` and `themeCssVariables.font.color.secondary` exist; if not, use the nearest neutral surface/secondary-text tokens the rotting badge file imports from. The red tokens (`tag.background.red`, `tag.text.red`) are the same ones `OpportunityRottingBadge` uses.

- [ ] **Step 3: Wire the badge into RecordShowPage**

In `RecordShowPage.tsx`, import the badge and render it inside the existing
`objectNameSingular === CoreObjectNameSingular.Opportunity` fragment, directly after
`<OpportunityRottingBadge .../>` (before `OpportunityWeightedAmount`):

```tsx
import { OpportunityNextActivityBadge } from '@/object-record/record-show/opportunity/components/OpportunityNextActivityBadge';
```
```tsx
                    <OpportunityNextActivityBadge
                      recordId={objectRecordId}
                      status={opportunityStatus ?? 'OPEN'}
                    />
```

- [ ] **Step 4: Typecheck + lint**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front`
Expected: 0 errors. (No unit test for the hook/component — per precedent the rotting badge/indicator have none; the logic lives in the tested util. Wiring is live-verified at the end.)

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-front/src/modules/object-record/record-show/opportunity/hooks/useOpportunityNextActivity.ts packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityNextActivityBadge.tsx packages/twenty-front/src/pages/object-record/RecordShowPage.tsx
git commit -m "feat(front): opportunity next-activity detail badge"
```

---

### Task 4: Report table + page + AppPath + route

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/opportunity-next-action/components/OpportunityNextActionTable.tsx`
- Create: `packages/twenty-front/src/pages/opportunity-next-action-report/OpportunityNextActionReportPage.tsx`
- Modify: `packages/twenty-shared/src/types/AppPath.ts` (add member after `PipelineAnalysisPage`)
- Modify: `packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx` (lazy import + route)

**Interfaces:**
- Consumes: `computeMissingNextAction`, `NextActionResult` (Task 2).
- Produces: `OpportunityNextActionTable`, `OpportunityNextActionReportPage`, `AppPath.NextActionsPage`.

- [ ] **Step 1: Add the AppPath enum member**

In `packages/twenty-shared/src/types/AppPath.ts`, after `PipelineAnalysisPage = '/opportunities/pipeline-analysis',`, add:
```ts
  NextActionsPage = '/opportunities/next-actions',
```

- [ ] **Step 2: Rebuild twenty-shared**

Run: `npx nx build twenty-shared`

- [ ] **Step 3: Create the table component**

`OpportunityNextActionTable.tsx`. Columns Deal | Phase | Betrag. Currency helper mirrors the Lost-reason table.

```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';

import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { type NextActionResult } from '@/object-record/opportunity-next-action/utils/computeMissingNextAction';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const getCurrencySymbol = (currencyCode: string): string => {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0);

  return parts.find((part) => part.type === 'currency')?.value ?? currencyCode;
};

const StyledAmount = styled.span`
  font-variant-numeric: tabular-nums;
`;

type OpportunityNextActionTableProps = {
  result: NextActionResult;
  stageLabelByValue: Record<string, string>;
  currencyCode: string;
};

export const OpportunityNextActionTable = ({
  result,
  stageLabelByValue,
  currencyCode,
}: OpportunityNextActionTableProps) => {
  const { formatNumber } = useNumberFormat();
  const symbol = getCurrencySymbol(currencyCode);

  const formatAmount = (amountMicros: number | null) =>
    amountMicros === null
      ? '-'
      : `${symbol}${formatNumber(amountMicros / 1_000_000, { decimals: 0 })}`;

  return (
    <Table>
      <TableRow>
        <TableHeader>{t`Deal`}</TableHeader>
        <TableHeader>{t`Phase`}</TableHeader>
        <TableHeader>{t`Betrag`}</TableHeader>
      </TableRow>
      <TableBody>
        {result.opportunities.map((opportunity) => (
          <TableRow key={opportunity.id}>
            <TableCell>{opportunity.name ?? '-'}</TableCell>
            <TableCell>
              {opportunity.stage !== null
                ? (stageLabelByValue[opportunity.stage] ?? opportunity.stage)
                : '-'}
            </TableCell>
            <TableCell>
              <StyledAmount>
                {formatAmount(opportunity.amountMicros)}
              </StyledAmount>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

- [ ] **Step 4: Create the report page**

`OpportunityNextActionReportPage.tsx`. Fetches open opportunities + their task targets, computes the missing set, resolves stage labels from metadata.

```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import {
  CoreObjectNameSingular,
  type CurrencyMetadata,
} from 'twenty-shared/types';
import { IconCalendarDue } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { OpportunityNextActionTable } from '@/object-record/opportunity-next-action/components/OpportunityNextActionTable';
import { computeMissingNextAction } from '@/object-record/opportunity-next-action/utils/computeMissingNextAction';
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

type NextActionOpportunityRecord = {
  id: string;
  __typename: 'Opportunity';
  name: string | null;
  stage: string | null;
  amount: CurrencyMetadata | null;
  status: string;
};

type NextActionTaskTargetRecord = {
  id: string;
  __typename: 'TaskTarget';
  targetOpportunityId: string | null;
  task: { dueAt: string | null; status: string | null } | null;
};

export const OpportunityNextActionReportPage = () => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const stageField = objectMetadataItem.fields.find(
    (field) => field.name === 'stage',
  );
  const stageLabelByValue = Object.fromEntries(
    (stageField?.options ?? []).map((option) => [option.value, option.label]),
  );

  const { records: opportunities, loading: opportunitiesLoading } =
    useFindManyRecords<NextActionOpportunityRecord>({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      filter: { status: { eq: 'OPEN' } },
      recordGqlFields: { name: true, stage: true, amount: true, status: true },
      limit: 1000,
    });

  const { records: taskTargets, loading: taskTargetsLoading } =
    useFindManyRecords<NextActionTaskTargetRecord>({
      objectNameSingular: CoreObjectNameSingular.TaskTarget,
      filter: { targetOpportunityId: { is: 'NOT_NULL' } },
      recordGqlFields: {
        targetOpportunityId: true,
        task: { dueAt: true, status: true },
      },
      limit: 1000,
    });

  const loading = opportunitiesLoading || taskTargetsLoading;

  const result = computeMissingNextAction(
    opportunities.map((opportunity) => ({
      id: opportunity.id,
      name: opportunity.name,
      stage: opportunity.stage,
      amountMicros: opportunity.amount?.amountMicros ?? null,
    })),
    taskTargets.map((taskTarget) => ({
      targetOpportunityId: taskTarget.targetOpportunityId,
      dueAt: taskTarget.task?.dueAt ?? null,
      status: taskTarget.task?.status ?? null,
    })),
    new Date(),
  );

  const currencyCode =
    opportunities
      .map((opportunity) => opportunity.amount?.currencyCode)
      .find((code): code is string => typeof code === 'string') ?? 'USD';

  return (
    <PageContainer>
      <PageHeader title={t`Nächste Aktionen`} Icon={IconCalendarDue} />
      <StyledBody>
        {loading ? null : result.totalMissing === 0 ? (
          <StyledEmpty>{t`Alle offenen Opportunities haben eine nächste Aktion.`}</StyledEmpty>
        ) : (
          <OpportunityNextActionTable
            result={result}
            stageLabelByValue={stageLabelByValue}
            currencyCode={currencyCode}
          />
        )}
      </StyledBody>
    </PageContainer>
  );
};
```

Note: confirm `CoreObjectNameSingular.TaskTarget` is `'taskTarget'` (it is) and that the `taskTarget` relation-id field is named `targetOpportunityId` in the GraphQL schema; if it differs, adjust the filter key, the `recordGqlFields` key, and the record type together, keeping the util input `{ targetOpportunityId, dueAt, status }`.

- [ ] **Step 5: Register the lazy route**

In `useCreateWorkspaceAppRouter.tsx`, after the `OpportunityPipelineAnalysisPage` lazy block, add:
```tsx
const OpportunityNextActionReportPage = lazy(() =>
  import(
    '~/pages/opportunity-next-action-report/OpportunityNextActionReportPage'
  ).then((module) => ({
    default: module.OpportunityNextActionReportPage,
  })),
);
```
and after the `AppPath.PipelineAnalysisPage` `<Route>` block, add:
```tsx
              <Route
                path={AppPath.NextActionsPage}
                element={
                  <LazyRoute>
                    <OpportunityNextActionReportPage />
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
git add packages/twenty-shared/src/types/AppPath.ts packages/twenty-front/src/modules/object-record/opportunity-next-action/components packages/twenty-front/src/pages/opportunity-next-action-report packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx
git commit -m "feat(front): opportunity next-action report page + route"
```

---

### Task 5: Navigation link + de-DE strings

**Files:**
- Modify: `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx`
- Modify: `packages/twenty-front/src/locales/de-DE.po`

- [ ] **Step 1: Add the gated nav item**

Extend the icon import to include `IconCalendarDue`:
```tsx
import {
  IconCalendarDue,
  IconChartBar,
  IconHourglassHigh,
  IconTrendingDown,
  IconTrendingUp,
} from 'twenty-ui/icon';
```
Add after the "Pipeline-Analyse" `NavigationDrawerItem`, still inside the `{hasOpportunityObject && (<>...</>)}` fragment:
```tsx
          <NavigationDrawerItem
            label={t`Nächste Aktionen`}
            to={AppPath.NextActionsPage}
            Icon={IconCalendarDue}
            active={pathname === AppPath.NextActionsPage}
          />
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front`
Expected: 0 errors.

- [ ] **Step 3: Extract + fill de-DE + compile**

Run: `npx nx run twenty-front:lingui:extract`
Then in `packages/twenty-front/src/locales/de-DE.po`, fill identity `msgstr` for the new German-source keys (leave already-present sibling keys — `Phase`, `Betrag` — intact):
- `Nächste Aktionen` → `Nächste Aktionen`
- `Keine nächste Aktion` → `Keine nächste Aktion`
- `Alle offenen Opportunities haben eine nächste Aktion.` → identity
- `Deal` → `Deal`
- The `Nächste Aktion: {formatted}` badge string → identity (its `msgstr` mirrors the msgid with the `{formatted}` placeholder preserved).

Run: `npx nx run twenty-front:lingui:compile`

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx packages/twenty-front/src/locales
git commit -m "feat(front): opportunity next-action nav link + de-DE strings"
```

---

## Live-verify (after all tasks, before merge)

1. Start dev env (`bash packages/twenty-utils/setup-dev-env.sh`), server, worker, front; log in.
2. On one open opportunity, create a Task with a due date in the future and link it to that deal (Tasks tab on the record). Leave the other open deals without an upcoming task.
3. Detail page of the deal with the task: badge shows `Nächste Aktion: <date>`. Detail page of a deal without one: red `Keine nächste Aktion`.
4. Open `/opportunities/next-actions` via the "Nächste Aktionen" nav link: the report lists exactly the open deals WITHOUT an upcoming task, and not the one that has it. Cross-check against the DB (Postgres MCP, read-only): task `dueAt`/`status` and its `taskTarget.targetOpportunityId`.
5. Mark the task DONE (or move its dueAt to the past): the deal moves into the report and its badge flips to `Keine nächste Aktion`. Restore afterwards.

## Self-review notes

- Spec coverage: util (T1) + report util (T2) + detail badge (T3) + report page/route (T4) + nav/i18n (T5) — every spec section maps to a task.
- Utils return raw values; the table formats currency; the badge formats the date. Rounding/formatting only at the edges.
- Icons: `IconCalendarDue` (verified). Red badge reuses `tag.*.red` tokens like the rotting badge; verify the neutral-badge tokens exist and swap to the rotting file's imports if not.
- Fetch shape (`taskTarget.targetOpportunityId` + nested `task { dueAt status }`) is the one uncertain integration point — the plan flags it in T3 and T4 to verify against the live schema, and the pure utils are decoupled from it.
- Slice B (table/board per-record indicators) is intentionally out of scope.
