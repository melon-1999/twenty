# Opportunity Forecast Page — Slice B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A dedicated `/opportunities/forecast` page that lists open opportunities grouped by expected-close month, showing per month the deal count, unweighted amount total, and weighted (amount x probability / 100) total, plus a grand total; reachable from a nav link.

**Architecture:** A pure aggregation util buckets open deals by close-date month and sums unweighted + weighted micros. A page component fetches open opportunities via `useFindManyRecords` (filter status=OPEN), runs the util, and renders a plain table with month-labelled rows (date-fns locale-aware) and simple proportional bars. A manual nav link points at the new route. Weighted values are computed client-side from `amount` + `probability` (same math as the detail display) so the page never depends on the async-maintained `weightedAmount` column.

**Tech Stack:** React 18, Jotai, Apollo (`useFindManyRecords`), date-fns (locale-aware), Linaria, Lingui, Jest + Testing Library.

## Global Constraints

- Never modify `/* @license Enterprise */` files.
- No signatures / Co-Authored-By in commits.
- Named exports only, no default exports (React.lazy `default:` wrapper is the allowed exception), no `any`, types over interfaces.
- Import via the `@/` alias; the repo bans `../` parent imports including in tests (`no-restricted-imports`).
- Wrap all user-facing strings with `t` from `@lingui/core/macro`; after adding strings run `nx run twenty-front:lingui:extract`, fill `packages/twenty-front/src/locales/de-DE.po`, then `nx run twenty-front:lingui:compile`.
- Weighted micros = `Math.round((amountMicros * probability) / 100)` — identical to the server `computeWeightedAmount` and the detail `computeWeightedAmountDisplay`.
- Filter/aggregate over the canonical English `status` VALUE `'OPEN'` (never a German label).
- Lint: `npx nx lint:diff-with-main twenty-front --configuration=fix`; typecheck: `npx nx typecheck twenty-front`; format: `npx nx fmt twenty-front`.

**Precedent files (read the ones named in a task before starting it):**
- Routing: `packages/twenty-shared/src/types/AppPath.ts` (enum) + `packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx` (lazy import + `<Route>` under `<MainAppLayoutWithSidePanel />`, e.g. the `AiChat` route).
- Page shell: `packages/twenty-front/src/modules/ui/layout/page/components/PageContainer.tsx` + `PageHeader.tsx`; example page `packages/twenty-front/src/pages/ai-chat/AiChatPage.tsx`.
- Data fetch: `packages/twenty-front/src/modules/object-record/hooks/useFindManyRecords.ts` (signature) + usage in `FormMultiRecordPicker.tsx:97`.
- Currency/number format: `packages/twenty-front/src/modules/localization/hooks/useNumberFormat.ts` (`formatNumber(value,{decimals})`) + the `getCurrencySymbol` inline pattern in `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityWeightedAmount.tsx`.
- Date/month: `packages/twenty-front/src/localization/states/dateLocaleState.ts` + `DateDisplay.tsx` (read `dateLocaleState.localeCatalog`, call date-fns `format(date, 'MMMM yyyy', { locale })`).
- Table primitives: `packages/twenty-front/src/modules/ui/layout/table/components/Table.tsx` / `TableRow.tsx` / `TableHeader.tsx` / `TableCell.tsx` / `TableBody.tsx`.
- Nav link: `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx` + item `packages/twenty-front/src/modules/ui/navigation/navigation-drawer/components/NavigationDrawerItem.tsx` (props `label`, `Icon`, `to`, `active`).

---

## Task 1: Forecast aggregation util

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/opportunity-forecast/utils/computeOpportunityForecast.ts`
- Test: `packages/twenty-front/src/modules/object-record/opportunity-forecast/utils/__tests__/computeOpportunityForecast.test.ts`

**Interfaces:**
- Produces:
  - Input row type `OpportunityForecastInput = { closeDate: string | null; amountMicros: number | null; probability: number | null }`.
  - `computeOpportunityForecast(rows: OpportunityForecastInput[]): OpportunityForecastResult` where
    `OpportunityForecastResult = { buckets: OpportunityForecastBucket[]; totalCount: number; totalMicros: number; totalWeightedMicros: number }`
    and `OpportunityForecastBucket = { monthKey: string; year: number; month: number; hasDate: boolean; count: number; totalMicros: number; weightedMicros: number }`.
  - `monthKey` is `` `${year}-${String(month + 1).padStart(2, '0')}` `` for dated rows (month is 0-indexed) and the literal `'no-date'` for rows with a null closeDate. Buckets are sorted ascending by monthKey, with the `'no-date'` bucket always last. `weightedMicros` per row = `Math.round((amountMicros * probability) / 100)`, treating null amount or null probability as 0 contribution. `totalMicros` sums `amountMicros ?? 0`.

- [ ] **Step 1: Write the failing test.**

```ts
import {
  computeOpportunityForecast,
  type OpportunityForecastInput,
} from '@/object-record/opportunity-forecast/utils/computeOpportunityForecast';

const row = (
  closeDate: string | null,
  amountMicros: number | null,
  probability: number | null,
): OpportunityForecastInput => ({ closeDate, amountMicros, probability });

describe('computeOpportunityForecast', () => {
  it('buckets by close month and sums unweighted + weighted micros', () => {
    const result = computeOpportunityForecast([
      row('2026-08-10T00:00:00.000Z', 10_000_000, 80),
      row('2026-08-25T00:00:00.000Z', 20_000_000, 50),
      row('2026-09-01T00:00:00.000Z', 40_000_000, 25),
    ]);

    expect(result.buckets).toHaveLength(2);
    expect(result.buckets[0]).toMatchObject({
      monthKey: '2026-08',
      year: 2026,
      month: 7,
      hasDate: true,
      count: 2,
      totalMicros: 30_000_000,
      weightedMicros: 18_000_000, // 8_000_000 + 10_000_000
    });
    expect(result.buckets[1]).toMatchObject({
      monthKey: '2026-09',
      count: 1,
      totalMicros: 40_000_000,
      weightedMicros: 10_000_000,
    });
    expect(result.totalCount).toBe(3);
    expect(result.totalMicros).toBe(70_000_000);
    expect(result.totalWeightedMicros).toBe(28_000_000);
  });

  it('puts null-closeDate rows in a no-date bucket sorted last', () => {
    const result = computeOpportunityForecast([
      row(null, 5_000_000, 100),
      row('2026-08-10T00:00:00.000Z', 10_000_000, 50),
    ]);

    expect(result.buckets.map((b) => b.monthKey)).toEqual(['2026-08', 'no-date']);
    expect(result.buckets[1]).toMatchObject({
      monthKey: 'no-date',
      hasDate: false,
      count: 1,
      totalMicros: 5_000_000,
      weightedMicros: 5_000_000,
    });
  });

  it('treats null amount or null probability as zero contribution', () => {
    const result = computeOpportunityForecast([
      row('2026-08-10T00:00:00.000Z', null, 80),
      row('2026-08-11T00:00:00.000Z', 10_000_000, null),
    ]);

    expect(result.buckets[0]).toMatchObject({
      count: 2,
      totalMicros: 10_000_000,
      weightedMicros: 0,
    });
    expect(result.totalWeightedMicros).toBe(0);
  });

  it('returns empty aggregates for no rows', () => {
    const result = computeOpportunityForecast([]);
    expect(result).toEqual({
      buckets: [],
      totalCount: 0,
      totalMicros: 0,
      totalWeightedMicros: 0,
    });
  });
});
```

- [ ] **Step 2: Run it, expect fail.**

Run: `cd packages/twenty-front && npx jest computeOpportunityForecast`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the util.**

```ts
import { isDefined } from 'twenty-shared/utils';

export type OpportunityForecastInput = {
  closeDate: string | null;
  amountMicros: number | null;
  probability: number | null;
};

export type OpportunityForecastBucket = {
  monthKey: string;
  year: number;
  month: number;
  hasDate: boolean;
  count: number;
  totalMicros: number;
  weightedMicros: number;
};

export type OpportunityForecastResult = {
  buckets: OpportunityForecastBucket[];
  totalCount: number;
  totalMicros: number;
  totalWeightedMicros: number;
};

const NO_DATE_KEY = 'no-date';

const weightedMicrosOf = (
  amountMicros: number | null,
  probability: number | null,
): number => {
  if (!isDefined(amountMicros) || !isDefined(probability)) {
    return 0;
  }

  return Math.round((amountMicros * probability) / 100);
};

export const computeOpportunityForecast = (
  rows: OpportunityForecastInput[],
): OpportunityForecastResult => {
  const bucketsByKey = new Map<string, OpportunityForecastBucket>();

  let totalCount = 0;
  let totalMicros = 0;
  let totalWeightedMicros = 0;

  for (const row of rows) {
    const amount = row.amountMicros ?? 0;
    const weighted = weightedMicrosOf(row.amountMicros, row.probability);

    totalCount += 1;
    totalMicros += amount;
    totalWeightedMicros += weighted;

    const hasDate = isDefined(row.closeDate);
    const date = hasDate ? new Date(row.closeDate as string) : null;
    const year = date?.getFullYear() ?? 0;
    const month = date?.getMonth() ?? 0;
    const monthKey = hasDate
      ? `${year}-${String(month + 1).padStart(2, '0')}`
      : NO_DATE_KEY;

    const existing = bucketsByKey.get(monthKey);

    if (isDefined(existing)) {
      existing.count += 1;
      existing.totalMicros += amount;
      existing.weightedMicros += weighted;
    } else {
      bucketsByKey.set(monthKey, {
        monthKey,
        year,
        month,
        hasDate,
        count: 1,
        totalMicros: amount,
        weightedMicros: weighted,
      });
    }
  }

  const buckets = [...bucketsByKey.values()].sort((a, b) => {
    if (a.monthKey === NO_DATE_KEY) return 1;
    if (b.monthKey === NO_DATE_KEY) return -1;

    return a.monthKey < b.monthKey ? -1 : a.monthKey > b.monthKey ? 1 : 0;
  });

  return { buckets, totalCount, totalMicros, totalWeightedMicros };
};
```

- [ ] **Step 4: Run it, expect pass.**

Run: `cd packages/twenty-front && npx jest computeOpportunityForecast`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck + lint + commit.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix`
```bash
git add packages/twenty-front/src/modules/object-record/opportunity-forecast/utils/
git commit -m "feat(front): opportunity forecast aggregation util"
```

---

## Task 2: Forecast page + route

**Files:**
- Create: `packages/twenty-front/src/pages/opportunity-forecast/OpportunityForecastPage.tsx`
- Create: `packages/twenty-front/src/modules/object-record/opportunity-forecast/components/OpportunityForecastTable.tsx`
- Modify: `packages/twenty-shared/src/types/AppPath.ts` (add `ForecastPage = '/opportunities/forecast'`)
- Modify: `packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx` (lazy import + route)

**Interfaces:**
- Consumes: `computeOpportunityForecast` (Task 1); `useFindManyRecords`; `useNumberFormat`; `dateLocaleState`.
- Produces: `OpportunityForecastPage` (route component) and `OpportunityForecastTable` (`{ result: OpportunityForecastResult }`).

- [ ] **Step 1: Read the precedents.** `AiChatPage.tsx` (page-shell + how a lazy page is structured), `useCreateWorkspaceAppRouter.tsx` (the `AiChat` lazy import + `<Route>`), `OpportunityWeightedAmount.tsx` (the `getCurrencySymbol` + `useNumberFormat` currency formatting), `DateDisplay.tsx` (reading `dateLocaleState.localeCatalog` and date-fns `format`), and the `Table` primitives.

- [ ] **Step 2: Add the route path.** In `packages/twenty-shared/src/types/AppPath.ts`, add inside the enum (near `RecordIndexPage`):

```ts
  ForecastPage = '/opportunities/forecast',
```

Then rebuild shared: `npx nx build twenty-shared`.

- [ ] **Step 3: Implement `OpportunityForecastTable.tsx`.** Presentational; formats micros + month labels. Sum a bucket's `totalMicros`/`weightedMicros` are integers; divide by 1_000_000 once for display.

```tsx
import { format } from 'date-fns';
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';

import { dateLocaleState } from '@/localization/states/dateLocaleState';
import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { type OpportunityForecastResult } from '@/object-record/opportunity-forecast/utils/computeOpportunityForecast';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { useRecoilValue } from 'recoil'; // NOTE: confirm the state lib — see Step 3a

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

type OpportunityForecastTableProps = {
  result: OpportunityForecastResult;
  currencyCode: string;
};

export const OpportunityForecastTable = ({
  result,
  currencyCode,
}: OpportunityForecastTableProps) => {
  const { formatNumber } = useNumberFormat();
  const dateLocale = useRecoilValue(dateLocaleState);
  const symbol = getCurrencySymbol(currencyCode);

  const formatMicros = (micros: number) =>
    `${symbol}${formatNumber(micros / 1_000_000, { decimals: 0 })}`;

  const monthLabel = (bucket: OpportunityForecastResult['buckets'][number]) =>
    bucket.hasDate
      ? format(new Date(bucket.year, bucket.month, 1), 'MMMM yyyy', {
          locale: dateLocale.localeCatalog,
        })
      : t`No close date`;

  return (
    <Table>
      <TableRow>
        <TableHeader>{t`Month`}</TableHeader>
        <TableHeader>{t`Deals`}</TableHeader>
        <TableHeader>{t`Total`}</TableHeader>
        <TableHeader>{t`Weighted`}</TableHeader>
      </TableRow>
      <TableBody>
        {result.buckets.map((bucket) => (
          <TableRow key={bucket.monthKey}>
            <TableCell>{monthLabel(bucket)}</TableCell>
            <TableCell>{bucket.count}</TableCell>
            <TableCell>
              <StyledAmount>{formatMicros(bucket.totalMicros)}</StyledAmount>
            </TableCell>
            <TableCell>
              <StyledAmount>{formatMicros(bucket.weightedMicros)}</StyledAmount>
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell>{t`Total`}</TableCell>
          <TableCell>{result.totalCount}</TableCell>
          <TableCell>
            <StyledAmount>{formatMicros(result.totalMicros)}</StyledAmount>
          </TableCell>
          <TableCell>
            <StyledAmount>{formatMicros(result.totalWeightedMicros)}</StyledAmount>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
```

- [ ] **Step 3a: Confirm the state library for `dateLocaleState`.** The codebase mixes Jotai and Recoil. Open `packages/twenty-front/src/localization/states/dateLocaleState.ts` and `DateDisplay.tsx` to see whether it is read with `useRecoilValue` or a Jotai hook (e.g. `useAtomValue`/`useAtomStateValue`). Use whichever `DateDisplay.tsx` uses, and fix the import in Step 3 to match. Do the same check for the `Table`/`TableHeader`/`TableCell` prop shapes (some accept `align`/`width` props) — match their real signatures.

- [ ] **Step 4: Implement `OpportunityForecastPage.tsx`.** Fetches open opportunities, computes the forecast, renders the table inside the page shell. Loading + empty states.

```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { IconChartBar } from 'twenty-ui/icon';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { computeOpportunityForecast } from '@/object-record/opportunity-forecast/utils/computeOpportunityForecast';
import { OpportunityForecastTable } from '@/object-record/opportunity-forecast/components/OpportunityForecastTable';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(4)};
`;

const StyledEmpty = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
`;

export const OpportunityForecastPage = () => {
  const { records, loading } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    filter: { status: { eq: 'OPEN' } },
    recordGqlFields: {
      name: true,
      amount: true,
      closeDate: true,
      probability: true,
      status: true,
    },
    limit: 1000,
  });

  const result = computeOpportunityForecast(
    records.map((record) => ({
      closeDate: (record.closeDate as string | null) ?? null,
      amountMicros:
        (record.amount as { amountMicros?: number } | null)?.amountMicros ??
        null,
      probability: (record.probability as number | null) ?? null,
    })),
  );

  const currencyCode =
    records
      .map(
        (record) =>
          (record.amount as { currencyCode?: string } | null)?.currencyCode,
      )
      .find((code): code is string => typeof code === 'string') ?? 'USD';

  return (
    <PageContainer>
      <PageHeader title={t`Forecast`} Icon={IconChartBar} />
      <StyledBody>
        {loading ? null : result.totalCount === 0 ? (
          <StyledEmpty>{t`No open opportunities to forecast.`}</StyledEmpty>
        ) : (
          <OpportunityForecastTable result={result} currencyCode={currencyCode} />
        )}
      </StyledBody>
    </PageContainer>
  );
};
```

Notes for the implementer: confirm the `PageHeader` prop name (`title`, `Icon`) against its real signature; confirm `useFindManyRecords` returns `records` (it does per the hook). If the SELECT filter `{ status: { eq: 'OPEN' } }` is rejected by the generated filter type, use `{ status: { in: ['OPEN'] } }` (both are valid Twenty SELECT filter shapes) — pick whichever typechecks.

- [ ] **Step 5: Register the route.** In `useCreateWorkspaceAppRouter.tsx`, add a lazy import next to the other page imports:

```ts
const OpportunityForecastPage = lazy(() =>
  import('~/pages/opportunity-forecast/OpportunityForecastPage').then(
    (module) => ({ default: module.OpportunityForecastPage }),
  ),
);
```

and a route inside the `<Route element={<MainAppLayoutWithSidePanel />}>` block (before the `NotFoundWildcard` route):

```tsx
<Route
  path={AppPath.ForecastPage}
  element={
    <LazyRoute>
      <OpportunityForecastPage />
    </LazyRoute>
  }
/>
```

Match the exact `LazyRoute`/wrapper form used by the sibling `AiChat` route in that file (copy its shape verbatim).

- [ ] **Step 6: Typecheck + lint + fmt.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix && npx nx fmt twenty-front`
Expected: 0 on touched files.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "feat(front): opportunity forecast page + route"
```

---

## Task 3: Nav link + i18n

**Files:**
- Modify: `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx` (add a manual forecast link)
- Modify: `packages/twenty-front/src/locales/de-DE.po` (fill new msgstrs)

**Interfaces:**
- Consumes: `AppPath.ForecastPage` (Task 2).

- [ ] **Step 1: Read** `MainNavigationDrawerScrollableItems.tsx` + `NavigationDrawerItem.tsx` + a real usage of `NavigationDrawerItem` (e.g. `NavigationDrawerItemForObjectMetadataItem.tsx`) to copy the `to`/`active`/`Icon`/`label` prop usage and the `useLocation` active-detection pattern.

- [ ] **Step 2: Add the forecast nav link.** Inside `MainNavigationDrawerScrollableItems.tsx`, render one `NavigationDrawerItem` for the forecast page. Gate it so it only shows when the Opportunity object is present in the workspace (mirror however the file already accesses `objectMetadataItems`; if it does not, import `useFilteredObjectMetadataItemsForNav` / the existing metadata-items hook the file uses and check for an item with `nameSingular === CoreObjectNameSingular.Opportunity`). Use:

```tsx
<NavigationDrawerItem
  label={t`Forecast`}
  to={AppPath.ForecastPage}
  Icon={IconChartBar}
  active={useLocation().pathname === AppPath.ForecastPage}
/>
```

Place it adjacent to the objects section (after it is fine). Import `IconChartBar` from `twenty-ui/icon`, `t` from `@lingui/core/macro`, `AppPath` from `twenty-shared/types`, `useLocation` from `react-router-dom`, `NavigationDrawerItem` from its module. Follow `no-navigate-prefer-link` (use `to`, not onClick).

- [ ] **Step 3: Typecheck + lint + fmt.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix && npx nx fmt twenty-front`
Expected: 0.

- [ ] **Step 4: i18n.** Run `npx nx run twenty-front:lingui:extract`, then fill the new German `msgstr`s in `packages/twenty-front/src/locales/de-DE.po`:
  - `Forecast` -> `Prognose`
  - `Month` -> `Monat`
  - `Deals` -> `Deals`
  - `Total` -> `Gesamt`
  - `Weighted` -> `Gewichtet`
  - `No close date` -> `Kein Abschlussdatum`
  - `No open opportunities to forecast.` -> `Keine offenen Opportunities für die Prognose.`

  Then `npx nx run twenty-front:lingui:compile`.

- [ ] **Step 5: Commit.**

```bash
git add -A
git commit -m "feat(front): forecast nav link + de-DE strings"
```

---

## Live verification (before final review)

Log in to the dev instance (in-app browser, workspace `workspace_78jtyayrql5p8djgplk9x6vy`). Navigate to `/opportunities/forecast` (and via the new nav link):

1. The page lists months containing open deals with correct deal counts.
2. Per-month `Total` = sum of `amount` of that month's open deals; `Weighted` = sum of `amount x probability / 100`. Spot-check against the DB (Postgres MCP) for one month.
3. The grand-total row sums all open deals.
4. German labels render (Prognose, Monat, Gesamt, Gewichtet, German month names like "August 2026").
5. Won/Lost deals are excluded (only status=OPEN).

Cross-check one month's weighted total against:
`SELECT date_trunc('month',"closeDate") m, count(*), sum("amountAmountMicros") tot, sum(round("amountAmountMicros"*"probability"/100.0)) weighted FROM workspace_78jtyayrql5p8djgplk9x6vy.opportunity WHERE "status"='OPEN' GROUP BY 1 ORDER BY 1;`

---

## Notes for the executor

- Weighted is computed CLIENT-SIDE from amount+probability (not read from the stored `weightedAmount` column), so the page is correct immediately regardless of worker timing.
- Mixed-currency workspaces are out of scope: the page displays all sums with the first non-null `currencyCode` found. A single-currency workspace (the norm) renders correctly. Do not add multi-currency conversion.
- Keep everything additive; do not alter the generic record-index/board code.
