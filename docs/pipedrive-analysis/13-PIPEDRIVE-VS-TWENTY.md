# 13 — Pipedrive vs Twenty (capability comparison)

Twenty facts are from `/docs/codebase-analysis/` (verified earlier in this repo analysis). Classification per capability:
READY AS-IS · READY BUT SIMPLIFY UI · PARTIALLY AVAILABLE · NEEDS EXTENSION · MISSING · TWENTY IS BETTER · SHOULD BE HIDDEN · NOT NEEDED.

| Capability | Pipedrive | Twenty (today) | Gap | Priority | Recommendation |
|---|---|---|---|---|---|
| **People / Organizations** | People + Orgs, link, rollups | Person + Company standard objects, list/board/show, custom fields, relations, search | Rollup columns (open/closed deals), enrichment | MUST | **READY BUT SIMPLIFY UI** — rename Company→Organization optional; add deal rollups |
| **Duplicate detection/merge** | Inline on contact | Not prominent | Merge UI + dup detection | MUST | **NEEDS EXTENSION** |
| **Deals** | Deal object, value/owner/close/labels | **Opportunity** standard object w/ custom fields | Naming, weighted value, days-in-stage | MUST | **READY BUT SIMPLIFY UI** (Opportunity ≈ Deal) |
| **Pipeline + stages** | Named pipelines, stages w/ probability + rotting | Kanban **View** grouped by a stage field; no first-class "pipeline" object | Multiple named pipelines, per-stage probability/rotting | MUST | **PARTIALLY AVAILABLE / NEEDS EXTENSION** |
| **Kanban drag-and-drop** | Yes | **RecordBoard** (dnd-kit) group-by field | Group-by = stage, drag updates stage | MUST | **READY AS-IS** |
| **Deal detail page** | Unified template, inline edit, timeline | **RecordShowPage** (page-layout driven), inline fields, timeline | Layout tuning | MUST | **READY BUT SIMPLIFY UI** |
| **Won/Lost + lost reasons** | Buttons + reason list | No close-state semantics | Won/Lost state + reason field + close date | MUST | **NEEDS EXTENSION** |
| **Deal rotting / days-in-stage** | Yes | No | Idle-stage flag + stage-entered timestamp | SHOULD | **MISSING / NEEDS EXTENSION** |
| **Weighted forecast view** | Forecast-by-month view | No | Bucket by close date × probability | MUST/SHOULD | **NEEDS EXTENSION** |
| **Activities/tasks** | Typed, overdue/today, deal-linked, won-nudge | **Task** + **Note** objects, timelines, Calendar module | Activity typing, overdue/today worklist, won→plan-next nudge | MUST | **PARTIALLY AVAILABLE / NEEDS EXTENSION** |
| **Notes** | Yes | **Note** object | — | MUST | **READY AS-IS** |
| **Email sync + link to records** | 2-way (Growth), Smart BCC | **Messaging** module: Gmail/Google + Microsoft + IMAP/SMTP, threads linked to records, worker sync | Templates, tracking UI | MUST | **READY AS-IS** (backend); UI polish |
| **Email templates / open-click tracking** | Yes | Not built-in | Templates + tracking | SHOULD | **NEEDS EXTENSION** |
| **Calendar sync** | Google/MS/Exchange | **Calendar** module (Google/MS/CalDAV) | — | SHOULD | **READY AS-IS** |
| **Meeting scheduler / booking pages** | Yes (Growth) | No | Booking pages | SHOULD/LATER | **MISSING** |
| **Custom fields** | Per entity, caps by plan | Metadata engine, 25 types incl. composites, per object | Twenty far richer | MUST | **TWENTY IS BETTER / SIMPLIFY-HIDE** |
| **Custom objects** | No (fixed entities) | Full custom objects | — | — | **TWENTY IS BETTER / SHOULD BE HIDDEN** by default |
| **Views (kanban/list/calendar)** | Per entity | **Views** module (table/board/calendar/list) | — | MUST | **READY AS-IS** |
| **Search** | Global search | Command menu + record search | — | MUST | **READY AS-IS** |
| **Filters / saved views** | Saved filters + columns | View filters/sorts/fields, saved | — | MUST | **READY AS-IS** |
| **Automations** | Trigger→cond→action, **capped** | **Workflow engine**: db-event/cron/webhook/manual triggers; create/update/email/HTTP/AI/branch/iterator/delay; versioned; run history; **uncapped** | UI simplification | SHOULD | **TWENTY IS BETTER / SIMPLIFY-HIDE** |
| **Reporting / dashboards** | Insights suite (funnel, win rate, forecast, activity, goals) | **Dashboards** (recent) + GraphQL/ClickHouse data | Pre-built sales reports + goals | MUST/SHOULD | **PARTIALLY AVAILABLE / NEEDS EXTENSION** |
| **Products / line items** | Catalog + deal line items | No product catalog | Catalog + line items | SHOULD | **MISSING / NEEDS EXTENSION** (custom object) |
| **Leads (separate inbox)** | Yes | No | — | — | **NOT NEEDED** (model as pipeline stage) |
| **Permissions** | Permission sets + visibility groups | **Roles** + object/field/**row-level** permissions | Twenty richer | MUST | **TWENTY IS BETTER / SIMPLIFY** to admin/member |
| **Import (CSV)** | Wizard, auto-map, dedupe | **spreadsheet-import** module | Dedupe polish, AI map | MUST | **READY BUT SIMPLIFY UI** |
| **Public API + webhooks** | REST v1/v2 + webhooks | **Auto-generated GraphQL + REST per workspace** + webhooks | — | MUST | **TWENTY IS BETTER** |
| **Metadata/dynamic schema** | Fixed | Metadata engine (core) | — | infra | **TWENTY IS BETTER / SHOULD BE HIDDEN** |
| **AI** | AI assistant, AI reports, AI email (Premium) | **AI agents + chat + tools** (record CRUD tools, workflow AI action) | — | differentiator | **TWENTY IS BETTER** |
| **Apps / SDK / marketplace** | 500+ marketplace | **twenty-sdk** apps, front components, logic functions | Ecosystem size | LATER | **TWENTY IS BETTER (foundation)** |
| **Mobile** | Native iOS/Android | Web responsive; no native app | Native mobile | SHOULD/LATER | **MISSING** |
| **Enrichment (contact/company)** | Smart data (Premium) | company-enrichment (People Data Labs) module | Wire into UI | SHOULD | **PARTIALLY AVAILABLE** |

## Summary read

- **Twenty already covers the hard infrastructure** (objects, views, kanban, record pages, email/calendar sync, workflows, permissions, API, AI) — often **better** than Pipedrive.
- The **real work is CRM-specific product surface + simplification**: deal/pipeline semantics (won/lost + lost reason, weighted forecast, rotting, multiple named pipelines), activity typing + worklist + won-nudge, pre-built sales reports/goals, duplicate merge, products, and **hiding Twenty's platform complexity** behind an opinionated SMB UI.
- **Verdict: Twenty is a strong technical foundation** — most gaps are "extend + simplify," few are "missing," almost none are "Twenty can't do this." See [15-MVP-V1-V2.md](15-MVP-V1-V2.md).
