# Pipedrive Competitor Blueprint

Concise decision doc. Target: a simpler Pipedrive competitor for **freelancers + 2–50-person teams**, built on **Twenty**. Backed by the analysis in this folder and the Twenty deep-dive in [/docs/codebase-analysis/](../codebase-analysis/).

---

## 1. What makes Pipedrive good?

A single, learnable mental model: **a visual deal pipeline you drag deals across, where the tool always tells you the next action.** Consistent record pages, activity-based selling (never leave a deal without a next step), fast onboarding, and a clean Kanban that a non-technical owner understands in minutes.

## 2. What is Pipedrive's actual core?

**Contacts (People + Organizations) → Deals on a Kanban pipeline (with stages, value, owner, close date) → Activities that surface "what to do next" → Email tied to records → a weighted forecast + a few reports.** Everything else (Leads inbox, Products, Campaigns, Projects, Smart Docs, LeadBooster, deep permissions) is upside or paid add-on.

## 3. Which features do small businesses really need?

Contacts with dup-merge; a drag-and-drop pipeline (multiple pipelines, editable stages, won/lost + lost reason); typed activities with an overdue/today worklist and a won→plan-next nudge; 2-way email sync linked to records; a pipeline funnel + win rate + weighted forecast + activity report + one dashboard; CSV import; admin/member roles; opinionated onboarding. (Full list: [12](12-FEATURE-PRIORITIES.md).)

## 4. Which Pipedrive features should we NOT copy?

Separate Leads inbox by default; **automation caps** (50/150/250 workflows, ~10 actions, 90-day, no email trigger); **add-on nickel-and-diming** (gating email sync/reporting/automation); 300–500 custom fields + formula fields + pipeline-specific required fields for everyone; deep enterprise permission matrices; a heavy email-marketing suite as core.

## 5. What does Twenty already provide?

Person + Company + Opportunity + Task + Note objects; **RecordBoard Kanban** (drag), record show pages with inline edit + timelines; **email + calendar sync** (Gmail/Google, Microsoft, IMAP/SMTP/CalDAV) linked to records; a **full, uncapped workflow engine** (db-event/cron/webhook/manual triggers; create/update/email/HTTP/AI/branch/iterator/delay; run history); **roles + object/field/row-level permissions**; **auto-generated GraphQL + REST API + webhooks**; **AI agents + chat + tool/function-calling**; views/filters/search; CSV import; multi-tenant workspaces; apps/SDK. Often **better** than Pipedrive.

## 6. What can we reuse directly (KEEP)?

People, Companies, Opportunities (as Deals), Notes, RecordBoard Kanban, record show pages, Views/filters/search, Messaging (email) + Calendar sync, the Workflow **engine**, the permission model, the auto-generated API + webhooks, CSV import, multi-tenancy, and the AI/agents/tools layer.

## 7. What should we simplify?

The **UI over** custom fields (expose only SMB field types), **permissions** (default admin/member), **workflows** (recipe templates + plain-language pickers), **search/command menu**, the **record layouts** (opinionated deal/contact pages), and onboarding/import.

## 8. What should we hide from users?

**Custom-object creation, the metadata engine, raw workflow power (code steps/iterators/HTTP), row-level permission predicates, the full 25-type/composite field zoo, and deep view config** — all kept in core but behind an "advanced/admin" boundary; default users never see them.

## 9. What must be extended?

Deal/pipeline **semantics**: won/lost + close date + **lost reasons**, **weighted value**, **days-in-stage + rotting**, **multiple named pipelines** with per-stage probability. **Activities**: typing + overdue/today worklist + won→plan-next nudge. **Reporting**: pre-built sales reports (funnel, win rate, weighted forecast, activity) + goals + MRR/ARR. **Contacts**: duplicate detection/merge + enrichment wiring + deal rollups. **Products/line items**. Email **templates + open/click tracking + scheduler**.

## 10. What is actually missing?

Native **meeting scheduler/booking pages**, **native mobile apps**, a **Products catalog + line items**, **duplicate-merge UI**, and pre-built **sales reports/goals**. None are "Twenty can't" — all are "build on top." (See [13](13-PIPEDRIVE-VS-TWENTY.md).)

## 11. What should our MVP contain?

Contacts; Deals on **one editable Kanban pipeline**; deal detail with won/lost + lost reason; **activities** (types, overdue/today, done, won-nudge); notes; **2-way email sync** linked to records; deal list + saved filters; **reporting floor** (funnel, win rate, activities, weighted forecast, 1 dashboard); CSV import; onboarding defaults + checklist; admin/member roles; and an **opinionated UI that hides Twenty's platform complexity**. (Detail: [15](15-MVP-V1-V2.md).)

## 12. What should V1 contain?

Multiple pipelines + rotting/days-in-stage; **uncapped automation** with essential recipes; calendar sync + activity calendar + **meeting scheduler**; email templates/tracking/scheduled send; more reports + MRR/ARR + goals; enrichment; **duplicate merge**; products/line items; contact/org rollups; documented public API; responsive mobile web; **transparent inclusive pricing**.

## 13. What should come later (V2)?

**AI that removes real work** (email→CRM auto-update, auto activities + follow-up suggestions, auto association, NL create/search/report, pipeline-hygiene suggestions); **post-sale lifecycle** (onboarding/renewal/upsell + account view); team shared inbox + AI email; **native mobile apps**; integrations marketplace (twenty-sdk); e-sign/documents; optional email-marketing.

## 14. Where can we beat Pipedrive?

**Transparent, inclusive pricing** (nothing gated); **uncapped automation**; **reporting free out of the box**; **one place to look** (no separate Leads); **reachable support/clean billing**; **post-sale lifecycle**; and above all **AI that does the data entry** so the user just sells. Twenty's AI/agents/tools make the AI wedge cheap for us and expensive for Pipedrive to match. (Detail: [16](16-COMPETITIVE-OPPORTUNITIES.md).)

## 15. Is Twenty ultimately a good technical foundation?

**Yes.** Most Pipedrive-core capabilities are **READY or TWENTY-IS-BETTER**; the gaps are "extend + simplify," few are "missing," almost none are "can't." Twenty gives us objects, kanban, record pages, email/calendar sync, an uncapped workflow engine, a rich permission model, an auto-generated API, multi-tenancy, and an AI/tools layer — the exact hard parts. The risk is **not capability but restraint**: the product's success hinges on **hiding Twenty's power** behind an opinionated SMB experience. Manage that (and the upgrade/coupling risks in `/docs/codebase-analysis/25-RISKS-AND-COMPLEXITY.md` if forking core) and Twenty is a strong base.

---

## Recommendation

### KEEP FROM TWENTY
People, Companies, Opportunities(=Deals), Notes, RecordBoard Kanban, record show pages, Views/filters/search, Messaging email sync, Calendar sync, the Workflow engine, roles/permissions model, auto-generated GraphQL+REST API + webhooks, CSV import, multi-tenant workspaces, AI agents/chat/tools.

### SIMPLIFY FROM TWENTY
Custom-field UI (SMB field types only), permissions (admin/member default), workflow builder (recipe templates + plain language), command menu/search, record layouts (opinionated deal/contact pages), onboarding/import.

### HIDE FROM TWENTY
Custom-object creation, metadata engine, raw workflow internals (code/iterators/HTTP), row-level permission predicates, full field-type zoo/composites, deep view configuration — available to admins/power users only.

### EXTEND IN TWENTY
Won/Lost + lost reasons + close date; weighted value; days-in-stage + rotting; multiple named pipelines (per-stage probability); activity typing + overdue/today worklist + won→plan-next nudge; pre-built sales reports + goals + MRR/ARR; duplicate detection/merge; contact/company enrichment + deal rollups; products/line items; email templates + open/click tracking + scheduler; CRM-specific AI tools/agents.

### BUILD NEW
Meeting scheduler / booking pages; native mobile apps; the opinionated onboarding checklist + CRM defaults; AI-assisted import; the "email→CRM auto-update" and next-best-action AI experiences; post-sale lifecycle pipelines + account view.

### DO NOT BUILD
A separate Leads entity/inbox (use a pipeline stage); automation caps/limits; add-on paywalls for core features; enterprise permission matrices for the SMB tier; a heavy in-house email-marketing suite; 300–500 custom fields / formula fields surfaced to end users.

---

*Research → analysis → scope → blueprint only. Nothing implemented; Twenty and Pipedrive both untouched. Decide scope before any build.*
