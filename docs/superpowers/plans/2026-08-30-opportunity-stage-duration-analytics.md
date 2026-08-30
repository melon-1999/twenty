# Opportunity Days-in-Stage Analytics (Slice A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A frontend-only report page at `/opportunities/stage-analytics` that shows, per pipeline stage, the number of open deals and the average days those deals have currently spent in that stage.

**Architecture:** Mirrors the merged Forecast and Lost-reason report slices exactly: `useFindManyRecords` (filtered to open deals) → pure aggregation util (TDD) → plain `Table` page inside `PageContainer`/`PageHeader` → lazy route under `MainAppLayoutWithSidePanel` → gated `NavigationDrawerItem`. No backend, no new field (reuses the existing `stageChangedAt`).

**Tech Stack:** React 18, TypeScript (strict, no `any`), Jotai, Linaria, Lingui, Jest. Frontend package `twenty-front`.

## Global Constraints

- Caveman chat prose only; code/commits/PRs written normally in English.
- No signatures / Co-Authored-By / "Generated with Claude" tags in commits or anywhere.
- Never modify `/* @license Enterprise */` files.
- Named exports only, no default exports. Functional components only. `type` over `interface`. String literals over enums (except GraphQL enums). No `any`. No abbreviations. Short `//` comments only, WHY not WHAT, only when non-obvious.
- Stage option VALUES are canonical English (`NEW`/`SCREENING`/`MEETING`/`PROPOSAL`/`CUSTOMER`); stage LABELS stay English (board-consistent). Status filter value is `OPEN`.
- Run `npx nx typecheck twenty-front` and `npx nx lint:diff-with-main twenty-front` after code changes; both must be 0.
- Icon: `IconHourglassHigh` (exists in `twenty-ui/icon`; `IconHourglass` does NOT exist).

---

### Task 1: Pure aggregation util `computeStageDurationBreakdown`

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/opportunity-stage-duration-report/utils/computeStageDurationBreakdown.ts`
- Test: `packages/twenty-front/src/modules/object-record/opportunity-stage-duration-report/utils/__tests__/computeStageDurationBreakdown.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type StageOption = { value: string; label: string };
  type StageDurationInput = { stage: string | null; stageChangedAt: string | null };
  export type StageDurationBucket = { stage: string; label: string; openCount: number; averageDays: number | null };
  export type StageDurationBreakdownResult = { buckets: StageDurationBucket[]; totalOpenCount: number };
  export const computeStageDurationBreakdown = (orderedStages: StageOption[], deals: StageDurationInput[], now: Date): StageDurationBreakdownResult;
  ```

- [ ] **Step 1: Write the failing test**

```ts
import {
  computeStageDurationBreakdown,
  type StageDurationBucket,
} from '../computeStageDurationBreakdown';

const STAGES = [
  { value: 'NEW', label: 'New' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'MEETING', label: 'Meeting' },
];

// Fixed reference "now" so day math is deterministic.
const NOW = new Date('2026-08-30T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

describe('computeStageDurationBreakdown', () => {
  it('returns one bucket per stage in the given order, including empty stages', () => {
    const result = computeStageDurationBreakdown(STAGES, [], NOW);

    expect(result.buckets.map((bucket) => bucket.stage)).toEqual([
      'NEW',
      'SCREENING',
      'MEETING',
    ]);
    expect(result.buckets.every((bucket) => bucket.openCount === 0)).toBe(true);
    expect(result.buckets.every((bucket) => bucket.averageDays === null)).toBe(
      true,
    );
    expect(result.totalOpenCount).toBe(0);
  });

  it('averages current stage age over dated deals and counts them per stage', () => {
    const result = computeStageDurationBreakdown(
      STAGES,
      [
        { stage: 'NEW', stageChangedAt: daysAgo(2) },
        { stage: 'NEW', stageChangedAt: daysAgo(4) },
        { stage: 'SCREENING', stageChangedAt: daysAgo(10) },
      ],
      NOW,
    );

    const byStage = Object.fromEntries(
      result.buckets.map((bucket): [string, StageDurationBucket] => [
        bucket.stage,
        bucket,
      ]),
    );
    expect(byStage.NEW.openCount).toBe(2);
    expect(byStage.NEW.averageDays).toBe(3);
    expect(byStage.SCREENING.openCount).toBe(1);
    expect(byStage.SCREENING.averageDays).toBe(10);
    expect(byStage.MEETING.averageDays).toBeNull();
    expect(result.totalOpenCount).toBe(3);
  });

  it('counts a deal with no stageChangedAt in openCount but excludes it from the average', () => {
    const result = computeStageDurationBreakdown(
      STAGES,
      [
        { stage: 'NEW', stageChangedAt: daysAgo(6) },
        { stage: 'NEW', stageChangedAt: null },
      ],
      NOW,
    );

    const newBucket = result.buckets.find((bucket) => bucket.stage === 'NEW');
    expect(newBucket?.openCount).toBe(2);
    expect(newBucket?.averageDays).toBe(6);
  });

  it('ignores deals whose stage is null or matches no known stage option', () => {
    const result = computeStageDurationBreakdown(
      STAGES,
      [
        { stage: null, stageChangedAt: daysAgo(3) },
        { stage: 'ARCHIVED', stageChangedAt: daysAgo(3) },
      ],
      NOW,
    );

    expect(result.buckets.every((bucket) => bucket.openCount === 0)).toBe(true);
    expect(result.totalOpenCount).toBe(0);
  });

  it('floors per-deal age at 0 for a future timestamp', () => {
    const result = computeStageDurationBreakdown(
      STAGES,
      [{ stage: 'NEW', stageChangedAt: daysAgo(-5) }],
      NOW,
    );

    const newBucket = result.buckets.find((bucket) => bucket.stage === 'NEW');
    expect(newBucket?.averageDays).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/twenty-front && npx jest computeStageDurationBreakdown`
Expected: FAIL — "Cannot find module '../computeStageDurationBreakdown'".

- [ ] **Step 3: Write minimal implementation**

```ts
const MS_PER_DAY = 1000 * 60 * 60 * 24;

type StageOption = { value: string; label: string };

type StageDurationInput = {
  stage: string | null;
  stageChangedAt: string | null;
};

export type StageDurationBucket = {
  stage: string;
  label: string;
  openCount: number;
  averageDays: number | null;
};

export type StageDurationBreakdownResult = {
  buckets: StageDurationBucket[];
  totalOpenCount: number;
};

export const computeStageDurationBreakdown = (
  orderedStages: StageOption[],
  deals: StageDurationInput[],
  now: Date,
): StageDurationBreakdownResult => {
  const nowMs = now.getTime();

  const buckets = orderedStages.map(({ value, label }): StageDurationBucket => {
    const stageDeals = deals.filter((deal) => deal.stage === value);

    const ages = stageDeals
      .map((deal) => deal.stageChangedAt)
      .filter((changedAt): changedAt is string => changedAt !== null && changedAt !== '')
      .map((changedAt) =>
        Math.max(0, Math.floor((nowMs - new Date(changedAt).getTime()) / MS_PER_DAY)),
      );

    const averageDays =
      ages.length > 0
        ? ages.reduce((sum, age) => sum + age, 0) / ages.length
        : null;

    return { stage: value, label, openCount: stageDeals.length, averageDays };
  });

  const totalOpenCount = buckets.reduce(
    (sum, bucket) => sum + bucket.openCount,
    0,
  );

  return { buckets, totalOpenCount };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/twenty-front && npx jest computeStageDurationBreakdown`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck + lint**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front`
Expected: 0 errors. If oxfmt/oxlint flags the new files, run `npx nx fmt twenty-front` and re-check.

- [ ] **Step 6: Commit**

```bash
git add packages/twenty-front/src/modules/object-record/opportunity-stage-duration-report/utils
git commit -m "feat(front): opportunity stage-duration breakdown util"
```

---

### Task 2: Table component + report page + route

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/opportunity-stage-duration-report/components/OpportunityStageDurationTable.tsx`
- Create: `packages/twenty-front/src/pages/opportunity-stage-duration-report/OpportunityStageDurationReportPage.tsx`
- Modify: `packages/twenty-shared/src/types/AppPath.ts` (add enum member after `LostReasonReportPage`)
- Modify: `packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx` (lazy import + route)

**Interfaces:**
- Consumes: `computeStageDurationBreakdown`, `StageDurationBreakdownResult` from Task 1.
- Produces: `OpportunityStageDurationTable` (named), `OpportunityStageDurationReportPage` (named), `AppPath.StageAnalyticsPage`.

- [ ] **Step 1: Add the AppPath enum member**

In `packages/twenty-shared/src/types/AppPath.ts`, directly after the `LostReasonReportPage = '/opportunities/lost-reasons',` line, add:

```ts
  StageAnalyticsPage = '/opportunities/stage-analytics',
```

- [ ] **Step 2: Rebuild twenty-shared (AppPath consumed by front from the built package)**

Run: `npx nx build twenty-shared`
Expected: build success. (`AppPath` is imported from `twenty-shared/types`; the front resolves the built output.)

- [ ] **Step 3: Create the table component**

`OpportunityStageDurationTable.tsx`:

```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';

import { type StageDurationBreakdownResult } from '@/object-record/opportunity-stage-duration-report/utils/computeStageDurationBreakdown';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const StyledNumeric = styled.span`
  font-variant-numeric: tabular-nums;
`;

type OpportunityStageDurationTableProps = {
  result: StageDurationBreakdownResult;
};

export const OpportunityStageDurationTable = ({
  result,
}: OpportunityStageDurationTableProps) => {
  const formatDays = (averageDays: number | null) =>
    averageDays === null ? '-' : String(Math.round(averageDays));

  return (
    <Table>
      <TableRow>
        <TableHeader>{t`Phase`}</TableHeader>
        <TableHeader>{t`Offene Deals`}</TableHeader>
        <TableHeader>{t`Ø Tage in Phase`}</TableHeader>
      </TableRow>
      <TableBody>
        {result.buckets.map((bucket) => (
          <TableRow key={bucket.stage}>
            <TableCell>{bucket.label}</TableCell>
            <TableCell>
              <StyledNumeric>{bucket.openCount}</StyledNumeric>
            </TableCell>
            <TableCell>
              <StyledNumeric>{formatDays(bucket.averageDays)}</StyledNumeric>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

- [ ] **Step 4: Create the report page**

`OpportunityStageDurationReportPage.tsx`. Reads the ordered stage options from the Opportunity `stage` field metadata (sorted by `position` to guarantee pipeline order), fetches open deals, calls the util with `new Date()`, renders the table. Mirrors `OpportunityLostReasonReportPage`.

```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { IconHourglassHigh } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { OpportunityStageDurationTable } from '@/object-record/opportunity-stage-duration-report/components/OpportunityStageDurationTable';
import { computeStageDurationBreakdown } from '@/object-record/opportunity-stage-duration-report/utils/computeStageDurationBreakdown';
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

type OpportunityStageDurationRecord = {
  id: string;
  __typename: 'Opportunity';
  stage: string | null;
  stageChangedAt: string | null;
  status: string;
};

export const OpportunityStageDurationReportPage = () => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const stageField = objectMetadataItem.fields.find(
    (field) => field.name === 'stage',
  );

  const orderedStages = [...(stageField?.options ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((option) => ({ value: option.value, label: option.label }));

  const { records, loading } =
    useFindManyRecords<OpportunityStageDurationRecord>({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      filter: { status: { eq: 'OPEN' } },
      recordGqlFields: {
        stage: true,
        stageChangedAt: true,
        status: true,
      },
      limit: 1000,
    });

  const result = computeStageDurationBreakdown(
    orderedStages,
    records.map((record) => ({
      stage: record.stage,
      stageChangedAt: record.stageChangedAt,
    })),
    new Date(),
  );

  return (
    <PageContainer>
      <PageHeader title={t`Phasen-Dauer`} Icon={IconHourglassHigh} />
      <StyledBody>
        {loading ? null : result.totalOpenCount === 0 ? (
          <StyledEmpty>{t`Keine offenen Opportunities.`}</StyledEmpty>
        ) : (
          <OpportunityStageDurationTable result={result} />
        )}
      </StyledBody>
    </PageContainer>
  );
};
```

Note: if `option.position` is not a typed number on the field-metadata option type, sort with `(a.position ?? 0) - (b.position ?? 0)`. Verify against the `stageField.options` type during implementation (the Rotting settings page reads the same `.options`).

- [ ] **Step 5: Register the lazy route**

In `useCreateWorkspaceAppRouter.tsx`, after the `OpportunityLostReasonReportPage` lazy block (around line 132), add:

```tsx
const OpportunityStageDurationReportPage = lazy(() =>
  import(
    '~/pages/opportunity-stage-duration-report/OpportunityStageDurationReportPage'
  ).then((module) => ({
    default: module.OpportunityStageDurationReportPage,
  })),
);
```

And after the `AppPath.LostReasonReportPage` `<Route>` block (around line 216), add:

```tsx
              <Route
                path={AppPath.StageAnalyticsPage}
                element={
                  <LazyRoute>
                    <OpportunityStageDurationReportPage />
                  </LazyRoute>
                }
              />
```

- [ ] **Step 6: Clear vite cache (twenty-shared changed) + typecheck + lint**

Run:
```bash
rm -rf packages/twenty-front/node_modules/.vite
npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front
```
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add packages/twenty-shared/src/types/AppPath.ts packages/twenty-front/src/modules/object-record/opportunity-stage-duration-report/components packages/twenty-front/src/pages/opportunity-stage-duration-report packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx
git commit -m "feat(front): opportunity stage-duration report page + route"
```

---

### Task 3: Navigation link + de-DE strings

**Files:**
- Modify: `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx`
- Modify: `packages/twenty-front/src/locales/de-DE.po` (filled by extract, then translated)

**Interfaces:**
- Consumes: `AppPath.StageAnalyticsPage` (Task 2).

- [ ] **Step 1: Add the gated nav item**

In `MainNavigationDrawerScrollableItems.tsx`, extend the icon import and add a third `NavigationDrawerItem` after the Verlustgründe link, inside the existing `{hasOpportunityObject && ( <> ... </> )}` fragment.

Change the icon import line:
```tsx
import { IconChartBar, IconHourglassHigh, IconTrendingDown } from 'twenty-ui/icon';
```

Add after the `Verlustgründe` `NavigationDrawerItem` (after line 67), still inside the fragment:
```tsx
          <NavigationDrawerItem
            label={t`Phasen-Dauer`}
            to={AppPath.StageAnalyticsPage}
            Icon={IconHourglassHigh}
            active={pathname === AppPath.StageAnalyticsPage}
          />
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front`
Expected: 0 errors.

- [ ] **Step 3: Extract + translate de-DE**

Run: `npx nx run twenty-front:lingui:extract`
(This touches ~40 locale catalogs mechanically; only `de-DE.po` gets real translations.)

Then in `packages/twenty-front/src/locales/de-DE.po`, fill the `msgstr` for the new German-source keys. All new strings are German in source, so their `msgstr` equals the `msgid` (identity):
- `Phase` → `Phase`
- `Offene Deals` → `Offene Deals`
- `Ø Tage in Phase` → `Ø Tage in Phase`
- `Phasen-Dauer` → `Phasen-Dauer`
- `Keine offenen Opportunities.` → `Keine offenen Opportunities.`

(If any of these keys already exist from a sibling report, leave the existing translation intact.)

- [ ] **Step 4: Compile catalogs**

Run: `npx nx run twenty-front:lingui:compile`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx packages/twenty-front/src/locales
git commit -m "feat(front): opportunity stage-duration report nav link + de-DE strings"
```

---

## Live-verify (after all tasks, before merge)

Reuses the manual/DB verification pattern from the Forecast + Lost-reason slices (read-only, nothing to restore):

1. Start front (`npx nx start twenty-front`), log in (user does this), open `/opportunities/stage-analytics` via the "Phasen-Dauer" nav link.
2. Query the DB (Postgres MCP, read-only) for open opportunities' `stage` + `stageChangedAt` in schema `workspace_78jtyayrql5p8djgplk9x6vy`:
   ```sql
   SELECT stage, "stageChangedAt" FROM workspace_78jtyayrql5p8djgplk9x6vy.opportunity WHERE status = 'OPEN';
   ```
3. Hand-compute expected open counts + average days per stage from those rows and confirm the table matches (each stage's count and rounded average). Confirm stages with no open deals show `-` in the days column and `0` count, in pipeline order.
4. No writes, no restore needed.

## Self-review notes

- Spec coverage: util (Task 1) covers all documented semantics incl. zero-count stages, null-`stageChangedAt` exclusion-from-average-but-count, unknown/null stage ignore, day-floor, null average, `totalOpenCount`. Page/table/route (Task 2) + nav/i18n (Task 3) cover the pattern wiring. No total row (per spec).
- Rounding lives only in the table (`Math.round`); util returns the raw mean. Single source, matches spec.
- Icon is `IconHourglassHigh` (verified present; `IconHourglass` absent).
- Stage order sourced from `stageField.options` sorted by `position` (board/pipeline order).
