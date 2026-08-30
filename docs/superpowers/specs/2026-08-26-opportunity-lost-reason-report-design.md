# Opportunity Lost-Reason Report — Design

Date: 2026-08-26
Status: Approved (pending user spec review)
Sub-project 5 of the Pipedrive-semantics track. Makes the captured lost reason analytically usable.

## Goal

A dedicated page that shows why deals are lost: lost opportunities grouped by `lostReason`,
with count and summed lost amount per reason, sorted by amount so the costliest reasons are on
top. Reuses the shipped Forecast page architecture (findMany + pure aggregation util + table
page + gated nav link).

Builds on the merged lostReason field (`lostReason` SELECT, `OPPORTUNITY_LOST_REASONS`,
`getLostReasonLabel`) and the Forecast page (`computeOpportunityForecast`,
`OpportunityForecastPage`/`Table`, `AppPath.ForecastPage` route + nav link).

## Data

Fetch via `useFindManyRecords`: `objectNameSingular: 'opportunity'`, filter
`{ status: { eq: 'LOST' } }`, `recordGqlFields: { lostReason: true, amount: true }`, high limit.

Aggregation is a pure util `computeLostReasonBreakdown(rows)`:
- Input row: `{ lostReason: string | null; amountMicros: number | null }`.
- Groups by `lostReason` value; each group accumulates `count` and `totalMicros` (sum of
  `amountMicros ?? 0`).
- A null/empty `lostReason` collects into a `'no-reason'` bucket.
- Result: `{ buckets: LostReasonBucket[]; totalCount: number; totalMicros: number }` where
  `LostReasonBucket = { reason: string; hasReason: boolean; count: number; totalMicros: number }`.
- Buckets sorted by `totalMicros` descending; the `'no-reason'` bucket is always last
  regardless of its amount.

Weighted values are irrelevant for lost deals — only count and raw lost amount are shown.

## Frontend

- **Route:** `AppPath.LostReasonReportPage = '/opportunities/lost-reasons'`, registered under
  `MainAppLayoutWithSidePanel` in `useCreateWorkspaceAppRouter.tsx`, exactly like the Forecast
  route.
- **Page:** `OpportunityLostReasonReportPage` — fetches LOST opportunities, runs the util,
  renders a table inside the page shell (`PageContainer` + `PageHeader` title "Verlustgründe",
  icon), with loading and empty states (empty = "Keine verlorenen Opportunities.").
- **Table:** `OpportunityLostReasonTable` — columns Grund / Anzahl / Verlorener Betrag, one row
  per bucket + a grand-total row. Reason labels via `getLostReasonLabel` (the shipped
  single-source lookup); the `'no-reason'` bucket renders "Ohne Grund". Amounts formatted by
  dividing micros by 1_000_000 and using `useNumberFormat().formatNumber` + a currency symbol,
  the same pattern as `OpportunityForecastTable`. Currency code = first non-null `currencyCode`
  among the fetched deals (fallback USD), consistent with the Forecast page's single-currency
  simplification.
- **Nav link:** a gated "Verlustgründe" `NavigationDrawerItem` in
  `MainNavigationDrawerScrollableItems.tsx` (shown only when the Opportunity object exists),
  pointing at the new route via `to=`, next to the existing "Prognose" link.

## Testing

- `computeLostReasonBreakdown` pure unit test (TDD): grouping by reason, count + amount sums,
  null → no-reason bucket last, sort by amount desc, empty input.
- Live-verify against the dev DB: cross-check the page's per-reason count + amount against a
  Postgres aggregate over `status='LOST'` grouped by `lostReason`.

## i18n

New strings via Lingui `t` ("Verlustgründe", "Grund", "Anzahl", "Verlorener Betrag", "Gesamt",
"Ohne Grund", "Keine verlorenen Opportunities."), filled in `de-DE.po` + compiled. Reason
labels come from the existing `OPPORTUNITY_LOST_REASONS` constant (already German).

## Non-goals

Time-range filter (later); charts/bars (plain table only); a won-reason report; conversion
rates or stage analytics (separate sub-project); editing deals from the report.

## Build order

Single slice (own plan): aggregation util + page/route + nav link/i18n. Mirrors Forecast
Slice B. Merge.
