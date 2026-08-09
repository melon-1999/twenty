# 02 — Deals & Pipeline (deep)

The most important part of Pipedrive. OBSERVED live on `komdis.pipedrive.com` unless labeled.

## Pipeline (Kanban) view — OBSERVED

- **Columns = stages** of one pipeline (e.g. "Neuer Kontakt → Excel erhalten → Antragsunterlagen/Upload → Antrag hochgeladen → Bewilligt → Abgelehnt"). Each column header shows **stage total value + deal count** (e.g. "0 € · 160 Deals").
- **Cards** show: deal title, linked organization + contact, value, and a **rotting indicator** (yellow warning triangle) when a deal has been idle past a stage's rotting threshold. Cards are **drag-and-drop** between stages (moving a card changes the deal's stage).
- **Multiple pipelines**: a pipeline selector switches pipelines; list/forecast views also offer an "All Pipelines" aggregate.
- **Controls**: view toggle (Kanban / List / Forecast / Archive), "+ Deal", deal count ("211 Deals"), pipeline picker, edit-pipeline pencil, **Filter**, "…" menu, "Add condition" quick filter, "Show closed deals", and **sort** (default "Sort by: Next activity" — surfaces deals needing action first).

## Deal views — OBSERVED

- **Kanban** (above) — visual, drag-driven.
- **List** — spreadsheet-style: columns Title, Value, Organization, Contact, Expected close date, Next activity date; configurable columns (gear); bulk-select checkboxes per row for bulk actions; "All Pipelines" selector; filters; show-closed toggle.
- **Forecast** — deals bucketed into **columns by month of expected close date**, each column showing a **weighted (probability-adjusted) value**, delta, and total. Deals without a close date are collected separately ("211 more deals"). This is the built-in revenue-forecasting view.

## Deal fields — OBSERVED / DOCUMENTED

Value, currency, owner, organization, contact person, expected close date, label(s), **probability** (custom/optional), stage, pipeline, source (e.g. "Manually created" + source channel), plus **custom fields** (up to 30/100/300/500 by plan). **Products** attach as priced line items (qty × price; supports one-off, subscription, installment billing per DOCUMENTED). Weighted value = value × probability (used in Forecast + revenue reports).

## Deal detail page — OBSERVED (structure)

```
┌ Header: "Fynal AG Deal"  | Owner(Marcel) | Followers | [Won] [Lost] | view | … ┐
│ Stage progress bar: [53d · Neuer Kontakt] › Excel › Upload › Antrag › Bewilligt › Abgelehnt
│ Breadcrumb: Pipeline › current stage
├ LEFT SIDEBAR                          │ MAIN COLUMN
│  Summary                              │  Action tabs: Activity | Notes | Meeting scheduler |
│  Details (Salesperson, custom…)       │              Call | WhatsApp | Email | Files | Docs | Invoice
│  Source (origin, channel, id)         │  "Click to add an activity…"
│  Contact (person, label, phone)       │  FOCUS: planned activities, pinned notes, email drafts
│  Organization (rollup)                │  HISTORY/timeline: All | Activities | Notes | Emails |
│                                       │           Files | Docs | Invoices | Changelog
```

Key details:
- **Stage progress bar** doubles as status + a stage switcher; the current stage shows **days-in-stage** ("53 T").
- **Won / Lost** buttons are always visible top-right. (Not clicked — read-only. DOCUMENTED: Won prompts to plan a follow-up activity; Lost opens a modal requiring a **lost reason** from a configurable list — see [06-CUSTOMIZATION.md](06-CUSTOMIZATION.md) and the OBSERVED "when a deal is won, pop up to plan next activity (Task, +3 months)" setting.)
- **Inline editing** everywhere — click a field in the sidebar to edit in place; add activity inline in the main column.
- **Focus** section is the "what needs my attention on this deal" zone (planned activities, pinned notes, drafts).
- **History** is a unified, type-filterable timeline of everything that happened to the deal, each entry stamped with actor + source (e.g. "Deal created: 17 Jun 14:31 · Marcel (Mobile)").
- **Contextual actions** per tab: log a call, send/track an email, schedule a meeting, attach files, generate documents/invoices (add-ons), message via WhatsApp (integration).

## Won / Lost, probability, rotting — DOCUMENTED (+ OBSERVED settings)

- **Won/Lost** close a deal; Lost captures a **lost reason** (configurable list under Company settings → Lost reasons, OBSERVED tab). Closed deals are hidden by default ("Show closed deals" toggle).
- **Rotting**: per-stage idle threshold flags stale deals (yellow triangle on cards) — a nudge to act.
- **Weighted value / probability** feeds Forecast + revenue-forecast reports.

## Filtering, sorting, totals — OBSERVED

- **Filters**: user filter (e.g. "Marcel"), quick "Add condition", saved filters, per-view. Sort options (default "Next activity") keep action-needed deals on top.
- **Totals**: per-stage value + count in Kanban; weighted + total per month in Forecast; deal count in List.

## Why the deal UX works (INFERRED)

1. **The pipeline IS the status** — drag = update; no form. Direct manipulation beats data entry.
2. **Days-in-stage + rotting** make neglect visible without a report.
3. **"Sort by next activity" + Focus** operationalize activity-based selling: the tool always shows what to do next.
4. **One detail template** with inline editing minimizes clicks and context-switching.
5. **Forecast view reuses the same deal + expected-close-date data** — no separate forecasting tool to configure.

## Implications for our product (INFERRED)

The pipeline Kanban + drag + rotting + "next activity" sort + weighted forecast + a consistent inline-edit detail page are the **irreducible deal experience**. A competitor must match this. Everything else on the deal page (WhatsApp, Invoice, Documents) is add-on surface that can be omitted or deferred. See Twenty mapping in [13-PIPEDRIVE-VS-TWENTY.md](13-PIPEDRIVE-VS-TWENTY.md) (Twenty's Opportunities + RecordBoard Kanban + record show page cover most of this; rotting, days-in-stage, weighted forecast, and Won/Lost+lost-reason are the notable gaps).
