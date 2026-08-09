# 03 — Contacts & Leads

OBSERVED live unless labeled.

## People (Kontakte) — OBSERVED

- **List**: columns Name, Organization, Address, Email, Phone (configurable via gear); filters (user filter + "Add condition" + saved filters); "+ Kontakt"; ~794 contacts in this account. Sample rows prefixed "[Beispiel]".
- **Sub-nav**: People, Organizations, **Contacts timeline**, **Merge duplicates**.
- **Detail page** (same unified template as deals): sidebar Summary (email, phone, org link), **inline duplicate detection** ("2 duplicates found — view & merge"), Details (first/last name + custom fields), Organization (linked card), and the main Activity/Notes/…/History timeline showing linked deals and creation events.
- **Person ↔ Organization**: a person links to one org; clicking the org card navigates to it.

## Organizations (Organisationen) — OBSERVED

- **List**: columns Name, Address, **Contacts (count)**, **Closed deals**, **Open deals** (rollups); ~413 orgs.
- **Detail page**: same template; Details include Website, LinkedIn, **Industry**, **Annual revenue**, **# Employees**; a **Deals** section shows open deals with mini-pipeline + value + rotting icon and "Show all deals"; full activity/history timeline.

## What makes contact management useful without bloat (INFERRED)

- **Rollups on the list** (deal counts, last activity) turn the contact list into a worklist, not a static address book.
- **Inline duplicate detection/merge** keeps data clean without a separate cleanup chore — a recurring pain elsewhere.
- **The same record template** as deals means zero extra learning.
- **Smart Contact Data / enrichment** (DOCUMENTED; enrichment credits are a Premium+ feature) auto-fills company info — reduces manual entry.
- Restraint: only two contact entities (Person, Organization). No account hierarchies, no contact roles matrix — deliberately simple.

## Leads (Lead-Inbox) — OBSERVED + DOCUMENTED

- A **separate pre-deal inbox**, not on the pipeline. Sub-nav: Lead-Inbox; **LeadBooster** (Livechat, Chatbot, Web forms, Prospector); ADD-ONS (Web Visitors); Integrations (LinkedIn).
- Leads are captured via: manual add, **import from spreadsheet**, or **LeadBooster** (chatbot/live chat/web forms/prospector — a paid add-on, included in Premium/Ultimate). Empty state pushes "Add lead" / "Import from table" / "Try LeadBooster".
- A Lead has a linked person/org, label, value, source; **converting a lead creates a Deal** (one-way), moving it onto the pipeline.

### Why Pipedrive separates Lead from Deal (DOCUMENTED rationale + INFERRED)

- Keeps the **pipeline clean**: unqualified/raw inbound doesn't clutter forecast, stage totals, or win-rate math. Leads are a staging area you triage before committing to the pipeline.
- Lets lead-gen tooling (chatbot/forms/prospector) dump into an inbox without polluting deal metrics.
- Different lifecycle: a lead may be discarded without ever being a "lost deal."

### Does a small-business CRM need a separate Lead entity? (INFERRED — opinionated)

**Mostly no, for the freelancer/2–50 segment.** For a solo or small team, a separate Leads inbox is often overhead: it's a second place to check, a second import target, and a conversion step. The same job — "raw inbound I haven't qualified yet" — can be modeled as:

- an early **pipeline stage** ("Inbox/Unqualified") that is excluded from forecast/win-rate, or
- a **boolean/label** on a Person ("lead"), promoted to a Deal when real.

Recommendation for our product: **default to no separate Lead entity in MVP.** Model qualification as a first pipeline stage (or a lightweight "inbox" pipeline) so users have one place to look and one object model. Revisit a dedicated lead object only if/when lead-gen volume (web forms, chatbots) justifies keeping raw inbound out of the pipeline — and even then it can be an optional pipeline, not a separate top-level concept. This is a concrete simplification win over Pipedrive. See [12-FEATURE-PRIORITIES.md](12-FEATURE-PRIORITIES.md).

## Twenty mapping (preview)

Twenty already has **People** and **Companies** as standard objects with the same list/board/show pattern, custom fields, search, and relations. Gaps vs Pipedrive contacts: inline duplicate detection/merge, contact enrichment, org rollup columns (open/closed deals) out of the box. See [13](13-PIPEDRIVE-VS-TWENTY.md) / [14](14-TWENTY-REUSE-MAP.md).
