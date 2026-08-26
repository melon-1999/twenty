# Opportunity Lost Reason — Design

Date: 2026-08-26
Status: Approved (pending user spec review)
Sub-project 4 of the Pipedrive-semantics track. Completes the Won/Lost lifecycle.

## Goal

When a deal is marked Lost, capture WHY. Add a `lostReason` SELECT field to Opportunity,
captured through a dropdown on the existing "Mark as Lost" action, shown in the record
header when the deal is Lost, and cleared on Reopen. German instance: option labels render
German natively.

Builds on the merged Won/Lost lifecycle (`status`, `closedAt`, `OpportunityWonLostActions`).

## Data model

New standard field on Opportunity, added the established way (twenty-shared
`standard-object-fields.constant.ts` entry + `npx nx build twenty-shared` + both snapshots
regenerated + backfill upgrade command):

- **`lostReason`** — SELECT, nullable. `universalIdentifier` `20202020-5701-4a11-9c31-7e6b2d4f8a15`.

Options are defined in `compute-opportunity-standard-flat-field-metadata.util.ts` with
**explicit English VALUES + German LABELS** (this is a brand-new field created fresh by the
standard application, so the frontend value-derivation gotcha that hit the stage/status
rename does NOT apply — the server stores exactly the value+label we define, and no
label-localization command is needed):

| value | label | color |
|-------|-------|-------|
| TOO_EXPENSIVE | Zu teuer | red |
| LOST_TO_COMPETITOR | Konkurrenz | orange |
| NO_BUDGET | Kein Budget | yellow |
| BAD_TIMING | Timing | blue |
| NO_DECISION | Keine Entscheidung | purple |
| OTHER | Sonstiges | gray |

(Exact color tokens picked from the standard SELECT color palette during implementation;
the list above is the intended mapping.)

The field label ("Verlustgrund") is localized server-side via the existing
`translateStandardLabel` + server de-DE catalog path, consistent with other standard field
labels; the English metadata label stays "Lost reason".

Backfill upgrade command **2.35.0** (timestamp > 1786700000000, added to
`TWENTY_NEXT_VERSIONS`): creates the field metadata for existing workspaces. No data
migration — every existing opportunity's `lostReason` stays NULL (only future Lost actions
set it). Idempotent, dry-run guarded, mirrors the 2-31 field-only command shape (no companion
fields, no raw SQL backfill needed).

## Capture flow

`OpportunityWonLostActions` currently renders a plain "Mark as Lost" button that calls
`setOutcome('LOST')` → `updateOneRecord({ status: 'LOST', closedAt: now })`.

Change: the "Mark as Lost" button opens a dropdown (twenty-ui `Dropdown` + `MenuItem`
pattern) listing the six reasons (German labels) plus a "Ohne Grund" (no reason) entry.
Selecting an item performs ONE `updateOneRecord`:

- a reason → `{ status: 'LOST', closedAt: now, lostReason: <VALUE> }`
- "Ohne Grund" → `{ status: 'LOST', closedAt: now, lostReason: null }`

The "Mark as Won" button is unchanged except it also clears the reason:
`{ status: 'WON', closedAt: now, lostReason: null }`.

Reopen: `{ status: 'OPEN', closedAt: null, lostReason: null }`.

## Display

The header (`OpportunityWonLostActions`) shows, when `status === 'LOST'` and `lostReason` is
set, the German reason label next to the existing `closedAt` label — via an in-component
`getLostReasonLabel(value)` map (mirrors the existing `getStatusLabel`), using Lingui `t`
with an `'Opportunity lost reason'` context to disambiguate. Null lostReason on a Lost deal
renders no reason chip.

The field is a normal SELECT, so it appears in the record detail Fields panel and can be
added to table/board views by the user — with German option labels rendered natively (no
per-field localization needed since the labels are stored German). No forced table column.

## Reason source of truth

A single frontend constant `OPPORTUNITY_LOST_REASONS` (array of `{ value, label }` using the
`t` macro for labels) drives BOTH the capture dropdown and the `getLostReasonLabel` lookup, so
the list is defined once. The values match the server field option values exactly (canonical
English).

## Testing

- `getLostReasonLabel` / the reasons constant: pure unit test (value → German label; unknown
  value → empty or fallback).
- `OpportunityWonLostActions`: extend the existing TDD — Lost-with-reason sets
  status+closedAt+lostReason in one update; "Ohne Grund" sets lostReason null; Won and Reopen
  clear lostReason; the reason chip renders for a Lost deal with a reason and not otherwise.
- Backfill command: run live against the dev DB (no reset), verify the `lostReason` field
  metadata row exists and all existing rows are NULL. Idempotent re-run.

## i18n

New strings via Lingui `t` (the six reason labels, "Ohne Grund", "Verlustgrund" where shown),
filled in `de-DE.po` + compiled. The field label "Lost reason" → "Verlustgrund" in the server
de-DE catalog.

## Non-goals

Free-text reason; making a reason mandatory; a lost-reason analytics report (a natural later
slice, pairs with the forecast/analytics layer); a won-reason field; editing the reason from
the board.

## Build order

Single slice (own plan): field + backfill (2.35.0) + reasons constant + capture dropdown +
header display + tests + i18n. Merge.
