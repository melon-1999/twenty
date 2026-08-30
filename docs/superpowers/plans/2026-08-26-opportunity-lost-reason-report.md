# Opportunity Lost-Reason Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/opportunities/lost-reasons` page that groups lost opportunities by `lostReason`, showing count and summed lost amount per reason (sorted by amount, "Ohne Grund" last), plus a grand total; reachable from a gated nav link "Verlustgründe".

**Architecture:** Mirrors the shipped Forecast page. A pure `computeLostReasonBreakdown` util aggregates lost deals by reason. A page fetches status=LOST opportunities via `useFindManyRecords`, runs the util, and renders a plain table. A second gated `NavigationDrawerItem` points at the new route.

**Tech Stack:** React 18, Apollo (`useFindManyRecords`), Linaria, Lingui, Jest + Testing Library. No server changes (the `lostReason` field already exists).

## Global Constraints

- Never modify `/* @license Enterprise */` files.
- No signatures / Co-Authored-By in commits.
- Named exports only, no default exports (React.lazy `default:` wrapper is the exception), no `any`, types over interfaces.
- Import via `@/` alias (or the existing `~/` alias where a precedent uses it); the repo bans `../` parent imports including in tests.
- Wrap user-facing strings with `t` from `@lingui/core/macro`; after adding strings run `nx run twenty-front:lingui:extract`, fill `packages/twenty-front/src/locales/de-DE.po`, then `nx run twenty-front:lingui:compile`.
- Filter over the canonical English status VALUE `'LOST'`; reason labels come from the shipped `getLostReasonLabel` (German).
- Sum `amountMicros` as integers; divide by 1_000_000 once at display time.
- Lint: `npx nx lint:diff-with-main twenty-front --configuration=fix`; typecheck: `npx nx typecheck twenty-front`; format: `npx nx fmt twenty-front`.

**Precedent files — this feature is a near-copy of the Forecast page; read the matching one before each task:**
- Util: `packages/twenty-front/src/modules/object-record/opportunity-forecast/utils/computeOpportunityForecast.ts` (+ its `__tests__`).
- Page: `packages/twenty-front/src/pages/opportunity-forecast/OpportunityForecastPage.tsx`.
- Table: `packages/twenty-front/src/modules/object-record/opportunity-forecast/components/OpportunityForecastTable.tsx` (currency formatting, `useNumberFormat`, `getCurrencySymbol`, Table primitives).
- Route: `AppPath.ForecastPage` in `packages/twenty-shared/src/types/AppPath.ts:28` + the lazy import + `<Route>` at `packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx:120` and `:194`.
- Nav: the gated forecast `NavigationDrawerItem` in `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx:54`.
- Reason labels: `packages/twenty-front/src/modules/object-record/record-show/opportunity/utils/getLostReasonLabel.ts` + the `OPPORTUNITY_LOST_REASONS` constant.

---

## Task 1: Lost-reason aggregation util

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/opportunity-lost-reason-report/utils/computeLostReasonBreakdown.ts`
- Test: `packages/twenty-front/src/modules/object-record/opportunity-lost-reason-report/utils/__tests__/computeLostReasonBreakdown.test.ts`

**Interfaces:**
- Produces:
  - `LostReasonInput = { lostReason: string | null; amountMicros: number | null }`.
  - `computeLostReasonBreakdown(rows: LostReasonInput[]): LostReasonBreakdownResult` where
    `LostReasonBreakdownResult = { buckets: LostReasonBucket[]; totalCount: number; totalMicros: number }`
    and `LostReasonBucket = { reason: string; hasReason: boolean; count: number; totalMicros: number }`.
  - `reason` is the stored English value for reasoned rows, and the literal `'no-reason'` for
    rows with null/empty `lostReason`. Buckets sorted by `totalMicros` descending; the
    `'no-reason'` bucket is always last. `totalMicros` sums `amountMicros ?? 0`.

- [ ] **Step 1: Write the failing test.**

```ts
import {
  computeLostReasonBreakdown,
  type LostReasonInput,
} from '@/object-record/opportunity-lost-reason-report/utils/computeLostReasonBreakdown';

const row = (
  lostReason: string | null,
  amountMicros: number | null,
): LostReasonInput => ({ lostReason, amountMicros });

describe('computeLostReasonBreakdown', () => {
  it('groups by reason and sums count + amount, sorted by amount desc', () => {
    const result = computeLostReasonBreakdown([
      row('TOO_EXPENSIVE', 10_000_000),
      row('LOST_TO_COMPETITOR', 50_000_000),
      row('TOO_EXPENSIVE', 20_000_000),
    ]);

    expect(result.buckets).toEqual([
      { reason: 'LOST_TO_COMPETITOR', hasReason: true, count: 1, totalMicros: 50_000_000 },
      { reason: 'TOO_EXPENSIVE', hasReason: true, count: 2, totalMicros: 30_000_000 },
    ]);
    expect(result.totalCount).toBe(3);
    expect(result.totalMicros).toBe(80_000_000);
  });

  it('collects null/empty reason into a no-reason bucket sorted last', () => {
    const result = computeLostReasonBreakdown([
      row(null, 90_000_000),
      row('NO_BUDGET', 10_000_000),
    ]);

    expect(result.buckets.map((bucket) => bucket.reason)).toEqual([
      'NO_BUDGET',
      'no-reason',
    ]);
    expect(result.buckets[1]).toEqual({
      reason: 'no-reason',
      hasReason: false,
      count: 1,
      totalMicros: 90_000_000,
    });
  });

  it('treats null amount as zero', () => {
    const result = computeLostReasonBreakdown([row('OTHER', null)]);
    expect(result.buckets[0]).toEqual({
      reason: 'OTHER',
      hasReason: true,
      count: 1,
      totalMicros: 0,
    });
    expect(result.totalMicros).toBe(0);
  });

  it('returns empty aggregates for no rows', () => {
    expect(computeLostReasonBreakdown([])).toEqual({
      buckets: [],
      totalCount: 0,
      totalMicros: 0,
    });
  });
});
```

- [ ] **Step 2: Run it, expect fail.**

Run: `cd packages/twenty-front && npx jest computeLostReasonBreakdown`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the util.**

```ts
import { isDefined } from 'twenty-shared/utils';

export type LostReasonInput = {
  lostReason: string | null;
  amountMicros: number | null;
};

export type LostReasonBucket = {
  reason: string;
  hasReason: boolean;
  count: number;
  totalMicros: number;
};

export type LostReasonBreakdownResult = {
  buckets: LostReasonBucket[];
  totalCount: number;
  totalMicros: number;
};

const NO_REASON_KEY = 'no-reason';

export const computeLostReasonBreakdown = (
  rows: LostReasonInput[],
): LostReasonBreakdownResult => {
  const bucketsByReason = new Map<string, LostReasonBucket>();

  let totalCount = 0;
  let totalMicros = 0;

  for (const row of rows) {
    const amount = row.amountMicros ?? 0;
    const hasReason = isDefined(row.lostReason) && row.lostReason !== '';
    const reason = hasReason ? (row.lostReason as string) : NO_REASON_KEY;

    totalCount += 1;
    totalMicros += amount;

    const existing = bucketsByReason.get(reason);

    if (isDefined(existing)) {
      existing.count += 1;
      existing.totalMicros += amount;
    } else {
      bucketsByReason.set(reason, {
        reason,
        hasReason,
        count: 1,
        totalMicros: amount,
      });
    }
  }

  const buckets = [...bucketsByReason.values()].sort((a, b) => {
    if (a.reason === NO_REASON_KEY) return 1;
    if (b.reason === NO_REASON_KEY) return -1;

    return b.totalMicros - a.totalMicros;
  });

  return { buckets, totalCount, totalMicros };
};
```

- [ ] **Step 4: Run it, expect pass.**

Run: `cd packages/twenty-front && npx jest computeLostReasonBreakdown`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck + lint + commit.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix`
```bash
git add packages/twenty-front/src/modules/object-record/opportunity-lost-reason-report/utils/
git commit -m "feat(front): opportunity lost-reason breakdown util"
```

---

## Task 2: Lost-reason report page + route

**Files:**
- Create: `packages/twenty-front/src/pages/opportunity-lost-reason-report/OpportunityLostReasonReportPage.tsx`
- Create: `packages/twenty-front/src/modules/object-record/opportunity-lost-reason-report/components/OpportunityLostReasonTable.tsx`
- Modify: `packages/twenty-shared/src/types/AppPath.ts` (add `LostReasonReportPage = '/opportunities/lost-reasons'`)
- Modify: `packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx` (lazy import + route)

**Interfaces:**
- Consumes: `computeLostReasonBreakdown` (Task 1); `getLostReasonLabel`; `useFindManyRecords`; `useNumberFormat`.
- Produces: `OpportunityLostReasonReportPage` + `OpportunityLostReasonTable` (`{ result, currencyCode }`).

- [ ] **Step 1: Read the Forecast precedents** — `OpportunityForecastTable.tsx` (copy the `getCurrencySymbol` + `useNumberFormat` + Table-primitives pattern verbatim), `OpportunityForecastPage.tsx` (copy the fetch + compute + shell + loading/empty pattern), and the router entry for `ForecastPage`.

- [ ] **Step 2: Add the route path.** In `packages/twenty-shared/src/types/AppPath.ts`, right after `ForecastPage` (line 28), add:

```ts
  LostReasonReportPage = '/opportunities/lost-reasons',
```

Then rebuild shared: `npx nx build twenty-shared`.

- [ ] **Step 3: Implement `OpportunityLostReasonTable.tsx`.** Copy `OpportunityForecastTable.tsx`'s imports + `getCurrencySymbol` + `formatMicros` helper exactly; render Grund / Anzahl / Verlorener Betrag columns.

```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';

import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { getLostReasonLabel } from '@/object-record/record-show/opportunity/utils/getLostReasonLabel';
import { type LostReasonBreakdownResult } from '@/object-record/opportunity-lost-reason-report/utils/computeLostReasonBreakdown';
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

type OpportunityLostReasonTableProps = {
  result: LostReasonBreakdownResult;
  currencyCode: string;
};

export const OpportunityLostReasonTable = ({
  result,
  currencyCode,
}: OpportunityLostReasonTableProps) => {
  const { formatNumber } = useNumberFormat();
  const symbol = getCurrencySymbol(currencyCode);

  const formatMicros = (micros: number) =>
    `${symbol}${formatNumber(micros / 1_000_000, { decimals: 0 })}`;

  const reasonLabel = (bucket: LostReasonBreakdownResult['buckets'][number]) =>
    bucket.hasReason ? getLostReasonLabel(bucket.reason) : t`Ohne Grund`;

  return (
    <Table>
      <TableRow>
        <TableHeader>{t`Reason`}</TableHeader>
        <TableHeader>{t`Count`}</TableHeader>
        <TableHeader>{t`Lost amount`}</TableHeader>
      </TableRow>
      <TableBody>
        {result.buckets.map((bucket) => (
          <TableRow key={bucket.reason}>
            <TableCell>{reasonLabel(bucket)}</TableCell>
            <TableCell>{bucket.count}</TableCell>
            <TableCell>
              <StyledAmount>{formatMicros(bucket.totalMicros)}</StyledAmount>
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell>{t`Total`}</TableCell>
          <TableCell>{result.totalCount}</TableCell>
          <TableCell>
            <StyledAmount>{formatMicros(result.totalMicros)}</StyledAmount>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
```

Match `OpportunityForecastTable.tsx`'s actual Table/TableHeader/TableCell usage — if it wraps or props them differently, mirror that exactly (it is the working precedent).

- [ ] **Step 4: Implement `OpportunityLostReasonReportPage.tsx`.** Copy `OpportunityForecastPage.tsx` structure; filter `status=LOST`, fetch `lostReason` + `amount`.

```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { IconThumbDown } from 'twenty-ui/icon';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { computeLostReasonBreakdown } from '@/object-record/opportunity-lost-reason-report/utils/computeLostReasonBreakdown';
import { OpportunityLostReasonTable } from '@/object-record/opportunity-lost-reason-report/components/OpportunityLostReasonTable';
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

export const OpportunityLostReasonReportPage = () => {
  const { records, loading } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    filter: { status: { eq: 'LOST' } },
    recordGqlFields: { lostReason: true, amount: true },
    limit: 1000,
  });

  const result = computeLostReasonBreakdown(
    records.map((record) => ({
      lostReason: (record.lostReason as string | null) ?? null,
      amountMicros:
        (record.amount as { amountMicros?: number } | null)?.amountMicros ??
        null,
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
      <PageHeader title={t`Lost reasons`} Icon={IconThumbDown} />
      <StyledBody>
        {loading ? null : result.totalCount === 0 ? (
          <StyledEmpty>{t`No lost opportunities.`}</StyledEmpty>
        ) : (
          <OpportunityLostReasonTable
            result={result}
            currencyCode={currencyCode}
          />
        )}
      </StyledBody>
    </PageContainer>
  );
};
```

Notes: match `OpportunityForecastPage.tsx`'s exact generic/typing of `useFindManyRecords` (it defined a small record type to avoid an `any` index-signature — do the same for `{ lostReason, amount }`). If `{ status: { eq: 'LOST' } }` is rejected by the filter type, use `{ status: { in: ['LOST'] } }` (the Forecast page used `eq`; match whatever typechecks).

- [ ] **Step 5: Register the route.** In `useCreateWorkspaceAppRouter.tsx`, add a lazy import next to `OpportunityForecastPage` (line ~120):

```ts
const OpportunityLostReasonReportPage = lazy(() =>
  import(
    '~/pages/opportunity-lost-reason-report/OpportunityLostReasonReportPage'
  ).then((module) => ({
    default: module.OpportunityLostReasonReportPage,
  })),
);
```

and a route next to the `ForecastPage` route (~line 194), copying its exact `LazyRoute` wrapper shape:

```tsx
<Route
  path={AppPath.LostReasonReportPage}
  element={
    <LazyRoute>
      <OpportunityLostReasonReportPage />
    </LazyRoute>
  }
/>
```

- [ ] **Step 6: Typecheck + lint + fmt.**

Run: `npx nx build twenty-shared && npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix && npx nx fmt twenty-front`
Expected: 0 on touched files.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "feat(front): opportunity lost-reason report page + route"
```

---

## Task 3: Nav link + i18n

**Files:**
- Modify: `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx`
- Modify: `packages/twenty-front/src/locales/de-DE.po`

**Interfaces:**
- Consumes: `AppPath.LostReasonReportPage` (Task 2).

- [ ] **Step 1: Read** `MainNavigationDrawerScrollableItems.tsx` — it already has `hasOpportunityObject`, `pathname`, and a gated `NavigationDrawerItem` for `ForecastPage`. Add a second one for the lost-reason report right after it.

- [ ] **Step 2: Add the nav link.** Inside the existing `{hasOpportunityObject && (...)}` block, render both the existing forecast item and a new one. Since the block currently renders a single `NavigationDrawerItem`, wrap the two in a fragment. The new item:

```tsx
<NavigationDrawerItem
  label={t`Lost reasons`}
  to={AppPath.LostReasonReportPage}
  Icon={IconThumbDown}
  active={pathname === AppPath.LostReasonReportPage}
/>
```

Import `IconThumbDown` from `twenty-ui/icon` (add to the existing `twenty-ui/icon` import). Keep the existing `IconChartBar` forecast item unchanged. Follow `no-navigate-prefer-link` (use `to`).

- [ ] **Step 3: Typecheck + lint + fmt.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix && npx nx fmt twenty-front`
Expected: 0.

- [ ] **Step 4: i18n.** Run `npx nx run twenty-front:lingui:extract`, then fill the new German `msgstr`s in `packages/twenty-front/src/locales/de-DE.po`:
  - `Lost reasons` -> `Verlustgründe`
  - `Reason` -> `Grund`
  - `Count` -> `Anzahl`
  - `Lost amount` -> `Verlorener Betrag`
  - `Total` -> `Gesamt` (likely already present)
  - `Ohne Grund` -> `Ohne Grund` (already present from the lostReason slice)
  - `No lost opportunities.` -> `Keine verlorenen Opportunities.`

  Then `npx nx run twenty-front:lingui:compile`.

- [ ] **Step 5: Commit.**

```bash
git add -A
git commit -m "feat(front): lost-reason report nav link + de-DE strings"
```

---

## Live verification (before final review)

Log in to the dev instance (in-app browser, workspace `workspace_78jtyayrql5p8djgplk9x6vy`). Mark a
couple of opportunities Lost with different reasons first (via the record header dropdown) so the
report has data. Then navigate to `/opportunities/lost-reasons` (and via the nav link):

1. Each reason row shows the correct count + summed lost amount; sorted by amount descending.
2. Deals lost without a reason appear in an "Ohne Grund" row, last.
3. The grand-total row sums all lost deals.
4. German labels render (Verlustgründe, Grund, Anzahl, Verlorener Betrag, reason labels).
5. Only status=LOST deals are counted (open/won excluded).

Cross-check against:
`SELECT "lostReason", count(*), sum("amountAmountMicros") FROM workspace_78jtyayrql5p8djgplk9x6vy.opportunity WHERE "status"='LOST' GROUP BY 1 ORDER BY 3 DESC;`

Restore any test opportunities you closed back to their prior state afterwards.

---

## Notes for the executor

- This is a near-copy of the Forecast page (Slice B). When in doubt about a component/hook
  signature or the router wrapper, mirror `OpportunityForecast*` exactly — it is the working
  precedent on main.
- Reason labels come from the shipped `getLostReasonLabel` single source; do not redefine them.
- Single-currency simplification (first non-null currencyCode) is intentional, same as Forecast.
- Additive only; do not alter generic record-index/board/nav behavior beyond the one new gated link.
