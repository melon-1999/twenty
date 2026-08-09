# 12 — Feature Priorities (the real Pipedrive core)

Aggressive simplification. Target: freelancers + 2–50-person teams. We are NOT cloning Pipedrive.

## MUST HAVE (required to seriously compete)

- **Contacts**: People + Organizations, person↔org link, custom fields, search, list views, **duplicate detection/merge**.
- **Deals** on a **visual pipeline (Kanban)** with **drag-and-drop** stage changes, deal value + currency, owner, linked org + contact, expected close date, labels, custom fields.
- **Multiple pipelines**, each with editable **stages**.
- **Deal detail page**: unified template, inline editing, timeline/history, linked activities/notes/emails/files.
- **Won / Lost** with a **lost-reason** list; closed-deal handling.
- **Activities**: typed (call/meeting/task + custom), due dates, **overdue/today worklist**, done state, deal/contact linkage, and the **won → plan-next-activity** nudge.
- **Deal list view** + basic filters/saved filters + configurable columns.
- **Email**: at minimum log/link emails to contacts/deals; ideally **2-way sync (Gmail + Outlook)** in the base tier.
- **Reporting floor**: pipeline funnel by stage, win rate/conversion, activities completed, a **weighted revenue forecast** (the Forecast view), one dashboard, simple goals.
- **Import** (CSV/spreadsheet, column auto-map, dedupe).
- **Basic roles** (admin/member) + basic record visibility.
- **Onboarding**: default pipeline/fields/activity types + a setup checklist.
- **Public API + webhooks** (ecosystem table stakes).

## SHOULD HAVE (V1, not MVP)

- **Calendar sync** (Google + Microsoft) + activity calendar view.
- **Email extras**: templates, open/click tracking, send-from-record, scheduled send.
- **Meeting scheduler** (booking pages).
- **Automation** (trigger→condition→action) with the ~5 essential recipes (see [07](07-AUTOMATIONS.md)), **uncapped**.
- **Deal rotting** (idle-stage flag) + days-in-stage.
- **Rollup columns** on contacts/orgs (open/closed deals, last activity).
- **Products / line items** on deals (catalog + qty×price).
- **More reports** (deal duration, conversion, cross-object) + MRR/ARR.
- **Contact enrichment** (company data).
- **Mobile** (responsive first; native later).

## LATER (after product-market fit)

- Team shared inbox + AI email compose/summaries.
- Email-marketing **Campaigns** (or lean on a dedicated ESP integration).
- **Projects** / post-sale lifecycle (onboarding/renewals/upsell pipelines).
- E-sign / documents (**Smart Docs** equivalent) — or integrate DocuSign/PandaDoc.
- Advanced permissions (visibility groups, per-field, row-level), teams.
- Goals/forecasting depth, custom-report builder, public dashboard links.
- Telephony/caller, chatbot/live-chat lead capture.
- Marketplace / third-party app ecosystem.

## DO NOT NEED (intentionally avoid — complexity Pipedrive users complain about)

- **A separate Lead entity/inbox by default** — model qualification as a first pipeline stage instead ([03](03-CONTACTS-LEADS.md)).
- **Artificial automation caps** (50/150/250 workflows, ~10 actions, 90-day, no email trigger) — Pipedrive's self-inflicted friction; don't copy.
- **Add-on nickel-and-diming** — no paywalling email sync / basic reporting / basic automation.
- **300–500 custom fields, formula fields, pipeline-specific required fields** surfaced to everyone — power-user only.
- **Full custom-object builder / metadata engine exposed to end users** — keep hidden by default.
- **Deep enterprise permission matrices** for the SMB tier.
- **Heavy email-marketing suite** as core — most SMBs already have one.

## The irreducible core (one line)

**Contacts + a drag-and-drop deal pipeline + activities that tell you what to do next + email tied to records + a weighted forecast + a couple of reports.** Everything else is upside, not table stakes.
