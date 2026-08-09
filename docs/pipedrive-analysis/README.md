# Pipedrive Analysis → Twenty Competitor Blueprint

Product research on Pipedrive + a plan to build a simpler Pipedrive competitor for **freelancers and 2–50-person teams** on top of **Twenty** (the open-source CRM analyzed in [/docs/codebase-analysis/](../codebase-analysis/README.md)).

## Method & confidence

- **OBSERVED** — inspected live, read-only, in an authenticated Pipedrive account (`komdis.pipedrive.com`) via the user's Chrome: pipeline (Kanban/List/Forecast), deal detail, People + a person detail, Organizations + an org detail, Activities + activity settings, Leads inbox, Insights, Products, Mail, Data fields, Users & access, Company settings. Pricing observed via the live pricing page.
- **DOCUMENTED** — Pipedrive help/marketing/developer pages + reputable third-party reviews (where the live app area was gated or bot-blocked).
- **INFERRED** — our analysis/recommendations.
- Read-only throughout: nothing was created, edited, deleted, sent, or configured in Pipedrive or Twenty. Screenshots + provenance in [screenshots/](screenshots/README.md).

## Documents

| # | Doc | Contents |
|---|-----|----------|
| 01 | [Pipedrive product](01-PIPEDRIVE-PRODUCT.md) | Nav, all areas, unified record template, **data-model diagram** |
| 02 | [Deals & pipeline](02-DEALS-PIPELINE.md) | Kanban/list/forecast, deal detail, won/lost, rotting — deep |
| 03 | [Contacts & leads](03-CONTACTS-LEADS.md) | People/Orgs, duplicates; why leads exist + should we simplify |
| 04 | [Activities](04-ACTIVITIES.md) | Typed activities, worklist, won→plan-next nudge |
| 05 | [Email & calendar](05-EMAIL-CALENDAR.md) | Sync, templates, tracking, scheduler; what's essential |
| 06 | [Customization](06-CUSTOMIZATION.md) | Custom fields/pipelines/activity types; how much SMBs need |
| 07 | [Automations](07-AUTOMATIONS.md) | Trigger→condition→action, caps, vs Twenty workflows |
| 08 | [Reporting](08-REPORTING.md) | Insights, forecast, goals; the minimum credible set |
| 09 | [Onboarding & UX](09-ONBOARDING-UX.md) | Setup, import, daily loop, friction, simplification |
| 10 | [Pricing](10-PRICING.md) | Lite/Growth/Premium/Ultimate + add-ons (2026-08-09) |
| 11 | [User complaints](11-USER-COMPLAINTS.md) | Recurring complaints → opportunities |
| 12 | [Feature priorities](12-FEATURE-PRIORITIES.md) | MUST / SHOULD / LATER / DO-NOT-NEED |
| 13 | [Pipedrive vs Twenty](13-PIPEDRIVE-VS-TWENTY.md) | Capability comparison table |
| 14 | [Twenty reuse map](14-TWENTY-REUSE-MAP.md) | KEEP/SIMPLIFY/EXTEND/HIDE/REPLACE/REMOVE per system |
| 15 | [MVP / V1 / V2](15-MVP-V1-V2.md) | Scope by release |
| 16 | [Competitive opportunities](16-COMPETITIVE-OPPORTUNITIES.md) | Where we beat Pipedrive (incl. AI) |
| ★ | **[PIPEDRIVE-COMPETITOR-BLUEPRINT.md](PIPEDRIVE-COMPETITOR-BLUEPRINT.md)** | **The concise decision doc — read this** |

## TL;DR

- **Pipedrive's core** = contacts + a drag-and-drop deal pipeline + activities that tell you what to do next + email tied to records + a weighted forecast + a couple of reports. Everything else is upside or add-on.
- **Twenty already provides the hard infrastructure** (objects, kanban, record pages, email/calendar sync, uncapped workflows, permissions, auto-generated API, AI agents/tools) — often **better** than Pipedrive.
- **The work** = an opinionated CRM skin + a few CRM-specific extensions (won/lost + lost reason, weighted forecast, rotting, multiple pipelines, activity typing + worklist, pre-built sales reports, duplicate merge, products) + **hiding Twenty's platform complexity**.
- **Where we win** = transparent inclusive pricing, uncapped automation, no separate Leads, and **AI that does the data entry** (email→CRM auto-update, auto activities, NL create/search/report).
- **Verdict: Twenty is a good technical foundation.**

Nothing here is implemented — this is research → analysis → scope → blueprint, for review before any build decision.
