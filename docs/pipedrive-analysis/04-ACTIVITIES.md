# 04 — Activities

Activities are how Pipedrive answers **"what should I do next?"** — the core of "activity-based selling." OBSERVED unless labeled.

## The Activities view — OBSERVED

- **List / Calendar** toggle; "+ Activity"; Meeting scheduler.
- **Activity-type filter row**: All, Call, Meeting, Task, Deadline, Email, Lunch — including **custom types** (Lunch is a custom example).
- **Time buckets**: To-Do, **Overdue**, Today, Tomorrow, This week, Next week, custom range. This is the "what's due" worklist.
- **Columns**: Done (checkbox/circle), Subject, **Deal**, Priority, Contact, Email, Phone (configurable).
- Calendar-sync prompt shown when not connected ("SYNC INACTIVE").

## Activity model — OBSERVED / DOCUMENTED

- An activity has a **type**, subject, **due date/time**, optional duration, **done/not-done** state, priority, assignee (owner), and links to a **deal and/or contact and/or organization**.
- **Overdue** is a first-class state (red), driving follow-up discipline.
- **Reminders/notifications** via calendar sync + in-app/email (DOCUMENTED).
- Marking done can **prompt scheduling the next activity** (DOCUMENTED activity-based-selling nudge).

## Custom activity types + won-nudge — OBSERVED (Company settings → Activities)

- **Activity types** are fully configurable ("+ Activity type", active/inactive; inactive types stay linked to history and appear in reports). Each has an icon.
- **"When a deal is won, show a popup to plan the next activity"** — a toggle (OBSERVED on) defaulting to type **Task**, follow-up time **in 3 months**, with an option to let users disable the auto-popup. This bakes activity-based selling into the won flow.

## Where activities surface (OBSERVED)

- **On the deal page**: inline "add activity", the **Focus** section (planned activities), and the History timeline.
- **On contact/org pages**: same activity tab + timeline.
- **Activities list**: the cross-deal "today/overdue" worklist.
- **Calendar view** + external calendar sync (Google/Microsoft/Exchange/O365; syncs the user's own activities).
- **Home/Setup guide** nudges; notification badges on the nav (e.g. Activities badge "8").
- **Deal sort "by next activity"** pulls action-needed deals to the top of the pipeline.

## Meeting scheduler — OBSERVED (tab) / DOCUMENTED

A booking-page tool ("Meeting scheduler") lets a contact pick a slot from the user's availability, creating an activity + calendar event. Included from Growth; video-call links supported (DOCUMENTED).

## Activity-based selling philosophy (INFERRED)

Pipedrive's thesis: you can't control outcomes, only actions — so the CRM's job is to ensure **every open deal always has a next scheduled action**. The whole UX (Focus, overdue state, won→plan-next popup, sort-by-next-activity, activities worklist) enforces this. This is Pipedrive's single most copyable idea and the cheapest high-value behavior to replicate.

## Implications for our product (INFERRED)

**MUST HAVE**: typed activities (call/meeting/task at minimum + custom types), due dates, overdue state, done toggle, deal/contact linkage, an "overdue/today" worklist, and the **won→plan-next-activity** nudge. Calendar sync is SHOULD (essential for daily use but heavier). This is where AI can genuinely help: **auto-create activities from emails/meetings and suggest the next follow-up** ([16-COMPETITIVE-OPPORTUNITIES.md](16-COMPETITIVE-OPPORTUNITIES.md)).

## Verified help-doc specifics (support.pipedrive.com, 2026-08)

- **6 default activity types** — Call, Meeting, Task, Deadline, Email, Lunch — plus fully custom types (Company settings → Activities → "+ Activity type", icon + name).
- Activity fields: title, type, date/time/**duration**, **Busy/Free** status (Busy blocks Scheduler availability), private **Note**, **Guests** (internal contacts or external emails), **Location** (auto-verified via Google Maps), public **Description** (syncs to external calendars), owner.
- Two timestamps: **Due date** (editable) + **Marked-as-done time** (auto). Derived **Last activity date** and **Next activity date** (the latter drives pipeline sort).
- **Reminders**: in-app alert, inclusion in a **daily summary email**, and/or a **separate email ~1 hour before**; mobile push. Overdue flagged by color-coded dots on the board.
- **Linkable to deals, organizations, people, leads, projects** — **cascading**: an activity linked to a deal auto-associates the deal's person + organization.
- **Won → prompt to add the next activity** (confirmed behavior), reinforcing "never leave a deal without a next step." Managers set **activity goals** (daily/weekly/monthly).
- Sources: `/article/activities`, `/article/activity-reminder-emails`, `/features/activities-goals`, `/article/creating-custom-activity-types`.

## Twenty mapping (preview)

Twenty has **Tasks** and **Notes** standard objects and a Calendar module, plus activity timelines on records. Gaps: typed activities with an "overdue/today" worklist framing, the won→plan-next nudge, and tight activity-centric UX. See [14-TWENTY-REUSE-MAP.md](14-TWENTY-REUSE-MAP.md).
