# 14 — Twenty Reuse Map

For each Twenty system: **KEEP** (use as-is), **SIMPLIFY** (reuse but reduce/opinionate UI), **EXTEND** (build on top), **HIDE** (keep in core, remove from default UX), **REPLACE** (swap implementation), **REMOVE/IGNORE** (don't use for this product). Grounded in `/docs/codebase-analysis/`.

| Twenty system | Action | Why / how |
|---|---|---|
| **People (Person object)** | **KEEP** | Standard object already fits. Add deal rollups + enrichment wiring. |
| **Companies (Company object)** | **KEEP + SIMPLIFY** | = Organizations. Optionally relabel; add open/closed-deal rollups. |
| **Opportunities** | **KEEP + EXTEND** | = Deals. Extend with weighted value, close state (won/lost), lost reason, stage-entered timestamp (days-in-stage/rotting). |
| **Pipeline / stages** | **EXTEND** | Today = a Kanban View grouped by a stage field. Add a first-class **Pipeline** concept (named pipelines, ordered stages w/ probability + rotting threshold) — either a lightweight object or view-config. |
| **Kanban (RecordBoard, dnd-kit)** | **KEEP** | Drag-to-change-stage is already there; point it at the stage field. |
| **Record show page (page-layout driven)** | **KEEP + SIMPLIFY** | Reuse the unified detail template; ship an opinionated deal/contact layout; keep inline editing + timeline. |
| **Activities (Task/Note)** | **EXTEND** | Add activity **typing** (call/meeting/task/custom), overdue/today worklist framing, and the **won→plan-next-activity** nudge. |
| **Notes** | **KEEP** | As-is. |
| **Email (Messaging module)** | **KEEP + EXTEND** | Gmail/Google + Microsoft + IMAP/SMTP sync + record linking already exist. Extend: templates, open/click tracking, send-from-record UI. |
| **Calendar module** | **KEEP** | Google/MS/CalDAV sync + events on records. Add activity calendar view. |
| **Custom fields (metadata engine)** | **KEEP core, HIDE + SIMPLIFY UI** | Reuse the engine; expose only SMB-relevant field types + per-entity custom fields in a friendly settings UI. Hide the full 25-type zoo, formula fields, composites by default. |
| **Custom objects** | **HIDE** | Powerful but confusing for SMBs. Available to admins/power users only; default users never see "create an object." |
| **Views (table/board/calendar/list)** | **KEEP** | Reuse for pipeline/list/calendar. Pre-seed default views. |
| **Search (command menu)** | **KEEP + SIMPLIFY** | Keep global search; simplify command-menu surface for non-power users; add NL search later. |
| **Filters / saved views** | **KEEP** | As-is. |
| **Workflows (engine + editor)** | **KEEP core, SIMPLIFY + HIDE** | Engine is better than Pipedrive and **uncapped** — a selling point. Hide raw power (code steps, iterators, HTTP) by default; ship **recipe templates** for the ~5 essential automations with plain-language pickers. |
| **Reports / Dashboards** | **EXTEND** | Reuse dashboard + data layer; **build the standard sales reports** (funnel, win rate, weighted forecast, activity, goals) as pre-configured widgets. |
| **Permissions (roles + object/field/row)** | **KEEP core, SIMPLIFY** | Default to **admin/member**; expose only simple record visibility. Keep the rich model available for teams that grow. |
| **Integrations (connected accounts, webhooks)** | **KEEP** | Email/calendar providers, webhooks reused directly. |
| **API (auto-generated GraphQL + REST)** | **KEEP** | Better than Pipedrive; the ecosystem/API story out of the box. |
| **Metadata engine** | **KEEP core, HIDE** | It's what makes objects/fields/views work; end users must never encounter it directly. |
| **AI (agents/chat/tools)** | **KEEP + EXTEND** | The differentiator. Extend with CRM-specific tools/agents: email→CRM update, next-step suggestions, NL create/search/report. |
| **Apps / SDK / front components** | **KEEP (LATER)** | Basis for a future integrations marketplace + customer-specific extensions. Not MVP-critical. |
| **Leads** (Pipedrive concept) | **REMOVE/IGNORE** | Don't build a separate lead entity; model qualification as a pipeline stage. |
| **Products / line items** | **EXTEND (SHOULD)** | Add a Product catalog object + deal line-item relation. Not MVP. |
| **Multi-tenancy / workspaces** | **KEEP** | Twenty is already multi-tenant (schema-per-workspace) — ideal for SaaS. |
| **Onboarding module** | **KEEP + EXTEND** | Reuse activation/sync/invite steps; add a Pipedrive-style progress checklist + opinionated CRM defaults + AI-assisted import. |
| **Mobile** | **REPLACE/BUILD (LATER)** | No native app today; ship responsive web first, native later. |

## Guiding principle

**Reuse Twenty's proven infrastructure; never expose its complexity.** The product is an **opinionated CRM skin + a handful of CRM-specific extensions** on top of Twenty, with the platform's power (custom objects, metadata, raw workflows, deep permissions) hidden behind an "advanced/admin" boundary. Prefer building as a **Twenty app / config** where possible; fork core only for the deal/pipeline semantics and pre-built reports that the platform doesn't model (see `/docs/codebase-analysis/24-EXTENSION-VS-CORE.md`).
