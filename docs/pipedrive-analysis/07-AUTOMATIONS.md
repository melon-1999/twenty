# 07 — Automations

DOCUMENTED (help/marketing + third-party; the in-app builder was not reachable in the inspected account — automations appear plan-gated/absent on Lite, but a "Open automations" banner on the Deals list confirms the feature exists). Labeled accordingly.

## Model: Trigger → Conditions → Actions — DOCUMENTED

Pipedrive's Workflow Automation is a linear (with branching) **trigger → condition → action** builder.

- **Triggers** (an event on an object): deal created / updated / stage changed / won / lost; activity created/completed; person or organization created/updated; lead created/updated. (Event = object + change.)
- **Conditions**: field-based filters on the triggering record (e.g. stage = X, value > Y, owner = Z, label = …), plus **If/Else branching** (limited depth by plan: 3/10/20 conditions per workflow).
- **Actions**: create/update a deal, activity, person, or organization; send an **email** (from a template); send a **webhook**; (and via integrations, more). Actions can chain in sequence.

## Plan limits (the pain) — DOCUMENTED

- **Workflow count**: none on Lite, **50 / 150 / 250** on Growth / Premium / Ultimate.
- **If/Else conditions**: 3 / 10 / 20 per workflow.
- **~10 actions per path**, **90-day max runtime per path**.
- **No email-triggered automation** (can't trigger a workflow from an inbound email).
- **Email sequences / nurturing** (multi-step follow-ups) on Growth+ (5/25/50 sequences).
- Result: users hit ceilings and fall back to **Zapier/Make** (added cost) — a top-3 complaint ([11](11-USER-COMPLAINTS.md)).

## Builder UX — DOCUMENTED

A step-based visual builder: pick a trigger, add condition filters, add action steps, optionally branch with If/Else, name + activate. Templates exist for common recipes. AI-assisted creation is offered on newer plans.

## Essential vs advanced vs unnecessary (INFERRED)

**Essential automations for SMBs** (the ones people actually set up):
1. When a deal enters stage X → **create a follow-up activity** (call/task) with a due date.
2. When a deal is **created** → assign owner / set default fields / create a first activity.
3. When a deal is **won or lost** → notify, set close fields, create next-step (onboarding) or capture lost reason.
4. When an **activity is overdue/completed** → reminder / create the next one.
5. When a **contact/deal is created** → send a templated welcome/intro email.

**Useful advanced:** multi-step email sequences (nurture), round-robin lead assignment, webhook to external systems, branching on field values.

**Unnecessary complexity (avoid):** artificial workflow/condition/action **caps**, 90-day runtime limits, and a builder so deep it needs training. These are Pipedrive's self-inflicted friction — a competitor should **not** copy the limits.

## Compared with Twenty Workflows (INFERRED — from codebase-analysis/08)

Twenty already has a **full workflow engine** that is *more capable* than Pipedrive's:
- **Triggers**: database-event (record create/update/delete, watched fields + record filter), cron, webhook, manual.
- **Actions**: create/update/delete/find record, send email, HTTP request, code/serverless function, **AI agent**, filter, if-else, iterator, form, delay.
- Visual editor (`@xyflow/react`), draft/active versioning, run history with per-step state, retries, no hard "50 workflows / 10 actions / 90-day" caps.

So for automation, **Twenty is better than Pipedrive** — the work is not building an engine but **simplifying the UI** for SMBs (recipe templates for the 5 essential automations above, plain-language trigger/action pickers) and **hiding** the power-user surface (code steps, iterators, raw HTTP) by default. This is a place to **beat Pipedrive**: uncapped, AI-assisted automation without a tier wall. See [13](13-PIPEDRIVE-VS-TWENTY.md), [14](14-TWENTY-REUSE-MAP.md), [16](16-COMPETITIVE-OPPORTUNITIES.md).

## Verified help-doc specifics (support.pipedrive.com, 2026-08)

- **Availability: Growth+** (no automation on Lite). Access: Tools and apps → Automations → "+ Automation". If-then visual builder; actions run top-to-bottom; **templates library**.
- **Triggers**: **event triggers** = 6 entities (deal, person, activity, lead, organization, project) × **added / updated / deleted**; **date triggers** = 4 entities (deal, person, activity, organization) fired **before / on / after a date field**. **No inbound-email ("email received") trigger and no true time-of-day/cron trigger.**
- **Conditions**: field filters with AND/OR; **if/else branching**, **Wait-for-condition** (each step ≤ 7 days), **Delay** (total ≤ 90 days).
- **Actions**: create/update person, organization, lead, deal, activity; send email (template); add note; campaigns; projects; **webhook**; + integration actions (Slack, Microsoft Teams, Trello, Asana).
- **Exact plan limits** (per company):

  | Limit | Growth | Premium | Ultimate |
  |---|---|---|---|
  | Active automations | 50 | 150 | 250 |
  | Actions per automation | 10 | 10 | 10 |
  | If/else conditions | 3 | 10 | 20 |
  | Wait-for-condition steps | 3 | 10 | 10 |
  | Delay steps | 3 | 10 | 10 |

  Frequency caps (all plans): 10,000 executions / 10 min company-wide, 5,000 / 10 min per automation; email actions 40/min/company.
- **AI**: assistive only (AI Sales Assistant win-probability + next-best-action, AI email writer/summarizer, AI Report Generator, Pipedrive Pulse; uses OpenAI). **No natural-language "build my automation" feature** — the workflow builder itself is rules-based.

### The concrete competitor opening

Pipedrive has **no inbound-email trigger and no time/cron trigger**, plus hard caps. **Twenty already has both missing triggers** (webhook/server-route for inbound, cron for scheduled) and **no caps** — so "automate when an email arrives" and "every Monday do X" are things we can offer that Pipedrive can't. Combined with Twenty's **AI-agent workflow action**, we can also ship genuine AI-in-automation, not just assistive suggestions. Sources: `/article/workflow-automation`, `/article/automation-update-trigger`, `/article/how-many-workflows-can-i-have-in-pipedrive`.
