# 09 — Onboarding & Daily UX

OBSERVED (Setup guide, empty states) + DOCUMENTED (help/onboarding pages).

## First-run setup — DOCUMENTED + OBSERVED

Sequenced flow: company details (name/logo) → **customize first pipeline / stages** → invite team + permissions → **connect email & calendar** → **import existing data**. Setup also covers activity types, lost reasons, currencies, custom fields.

- **Setup guide** (OBSERVED, the home page): a checklist with a **"usage level" meter** ("Mittel"/medium) and task cards ("review sales performance", "invite your team", each with a 1–2 min estimate + video), plus "unlock more power" nudges. A persistent progress-driven onboarding surface.
- **Import** (DOCUMENTED): XLS/XLSX/CSV, 50k rows/<50MB; imports people, orgs, leads, deals, activities, notes, products; **auto-maps columns by header**, manual drag-map fallback, can create custom fields mid-import, **dedupe step with merge**, downloadable sample spreadsheets.
- **Email/calendar sync** (DOCUMENTED): Gmail/Google, Outlook/Exchange/O365, Yahoo, iCloud; 2-way; Smart BCC fallback. Sync prompts recur across the app when disconnected (OBSERVED banners on Activities/home).

## Daily usage loop (INFERRED, grounded in OBSERVED UX)

Open **pipeline** → scan deals as cards by stage (rotting triangles flag neglect) → work the **Activities "today/overdue" list** → log outcome & **schedule the next activity** → **drag deals** between stages → email from within the deal. Activity-forward, visual, low-typing.

## Why a non-technical owner "gets it" (INFERRED)

1. **Visual Kanban** maps directly to "deals moving toward a sale."
2. **Activity-based selling** reduces the CRM to a to-do list attached to deals.
3. **Guided checklist + progress meter** answers "am I set up yet?"
4. **Auto-column-mapping import** removes the scariest step (getting data in).
5. **Consistent record template** — learn one page, know them all.

## Friction points (INFERRED, corroborated by complaints)

- **Email sync gated to Growth** — an owner on Lite can't run their day in the tool.
- **Reporting thin at the bottom**; custom-field reporting + extra dashboards gated to Premium+.
- **Add-on sprawl** — the true price/config climbs once you add LeadBooster/Campaigns/etc.
- **Automation config** has a learning curve once past templates.
- **No/limited sample data** in first-run beyond `[Beispiel]` demo records — empty states rely on the checklist to drive action.

## Mobile — DOCUMENTED

Native iOS + Android with offline access, call logging, activity management, voice-to-text notes. Widely reported as **weaker than desktop** ([11](11-USER-COMPLAINTS.md)).

## What we could simplify (INFERRED → product principles)

1. **Zero-config start**: ship a sensible default pipeline + fields + activity types so a user is productive in minutes; make the first pipeline editable, not mandatory to design up front.
2. **Include email/calendar sync + basic automation in the entry tier** so the daily loop works from day one.
3. **AI-assisted import**: paste a spreadsheet or forward emails; auto-map + auto-create contacts/deals (removes the #1 setup fear). See [16](16-COMPETITIVE-OPPORTUNITIES.md).
4. **Fewer top-level concepts**: no separate Leads inbox by default (see [03](03-CONTACTS-LEADS.md)); one place to look.
5. **Progressive disclosure**: hide custom-object creation, metadata, and power-user settings behind an "advanced" boundary.

## Twenty mapping (preview)

Twenty has an onboarding flow (workspace activation, sync-emails, invite-team steps), seeded demo records on workspace creation, CSV **spreadsheet import** (`spreadsheet-import` module), and empty states. Reusable. Gaps: a Pipedrive-style **usage/progress checklist**, opinionated CRM defaults (pre-built pipeline/stages/activity types), and AI-assisted import. See [14-TWENTY-REUSE-MAP.md](14-TWENTY-REUSE-MAP.md).
