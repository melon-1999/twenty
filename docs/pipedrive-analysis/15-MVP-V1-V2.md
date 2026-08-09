# 15 — MVP / V1 / V2

Scope for a Pipedrive competitor built on Twenty, for freelancers + 2–50-person teams. Each item tagged with the reuse action from [14](14-TWENTY-REUSE-MAP.md).

## MVP — smallest thing that could replace Pipedrive for a freelancer / small team

Goal: a solo or tiny team can run their whole sales day in it.

- **Contacts** — People + Organizations, link, custom fields, search, list views. (KEEP)
- **Deals on a Kanban pipeline** — drag-to-change-stage, value+currency, owner, org+contact, close date, labels. (KEEP RecordBoard + EXTEND Opportunity)
- **One editable pipeline with stages** (multiple pipelines can slip to late-MVP/V1). (EXTEND)
- **Deal detail** — unified page, inline edit, timeline, linked activities/notes/emails. (KEEP + SIMPLIFY)
- **Won / Lost + lost reason + close date.** (EXTEND)
- **Activities** — call/meeting/task types, due date, **overdue/today worklist**, done, deal/contact link, **won→plan-next nudge**. (EXTEND)
- **Notes.** (KEEP)
- **Email** — 2-way sync (Gmail + Outlook), auto-link to contacts/deals, timeline, send-from-record. (KEEP Messaging + light UI)
- **Deal list view** + saved filters + configurable columns. (KEEP)
- **Reporting floor** — pipeline funnel, win rate, activities completed, **weighted forecast**, one dashboard. (EXTEND)
- **CSV import** with column mapping + dedupe. (KEEP + SIMPLIFY)
- **Onboarding** — default pipeline/fields/activity types + setup checklist. (EXTEND)
- **Admin/member roles** + basic visibility. (SIMPLIFY)
- **Opinionated UI that hides** custom objects, metadata, raw workflows, deep permissions. (HIDE)

Explicitly **not** in MVP: separate Leads, products, automations, calendar view, templates/tracking, meeting scheduler, native mobile.

## V1 — commercially credible Pipedrive competitor

Adds the "run a team" and "look professional" layer.

- **Multiple pipelines** with per-stage probability + **rotting/days-in-stage**. (EXTEND)
- **Automation** — trigger→condition→action with the ~5 essential recipes, **uncapped**, plain-language builder. (KEEP engine, SIMPLIFY)
- **Calendar sync + activity calendar view**; **meeting scheduler** (booking pages). (KEEP + EXTEND)
- **Email extras** — templates, open/click tracking, scheduled send, signatures. (EXTEND)
- **More reports** — deal duration, conversion, cross-object, **MRR/ARR**, simple **goals**. (EXTEND)
- **Contact/company enrichment** wired into the UI. (PARTIAL → EXTEND)
- **Duplicate detection/merge** UI. (EXTEND)
- **Products / line items** on deals. (EXTEND)
- **Rollup columns** (open/closed deals, last activity) on contacts/orgs. (EXTEND)
- **Public API + webhooks** surfaced/documented (already there). (KEEP)
- **Responsive mobile web** polish. (BUILD)
- **Transparent, inclusive pricing** (email + automation + basic reporting in the base tier). (product/GTM)

## V2 — meaningful differentiation (don't just copy Pipedrive)

Lean into Twenty's AI + platform strengths.

- **AI that removes real work** (see [16](16-COMPETITIVE-OPPORTUNITIES.md)): natural-language record creation, **email→CRM auto-update**, automatic activity creation, follow-up suggestions, automatic contact/deal association, NL search, NL reporting, smart reminders, pipeline-hygiene suggestions.
- **Post-sale / customer lifecycle** — onboarding/renewals/upsell pipelines, lightweight account view (the "great for deals, not customers" gap).
- **Team shared inbox + AI email compose/summaries.** (LATER)
- **Native mobile apps.** (BUILD)
- **Integrations marketplace** via twenty-sdk apps + front components. (KEEP foundation)
- **E-sign / documents** (integrate or Smart-Docs-equivalent). (LATER)
- Optional **email-marketing Campaigns** or deep ESP integration. (LATER)

## Sequencing logic

MVP proves the core loop (pipeline + activities + email + forecast) with Twenty's infra doing the heavy lifting. V1 closes the credibility gap vs Pipedrive (automation, reports, multi-pipeline, scheduler) — mostly **simplify + extend**, little net-new infra. V2 is where we **win**, not match: AI-native workflows and lifecycle, exploiting Twenty's AI/agents/tools that Pipedrive can't cheaply replicate.
