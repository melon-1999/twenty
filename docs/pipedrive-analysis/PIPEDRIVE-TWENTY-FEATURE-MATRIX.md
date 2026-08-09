# Pipedrive vs Twenty — Feature-by-Feature Matrix

Derived from the existing analysis in [/docs/codebase-analysis/](../codebase-analysis/) and [/docs/pipedrive-analysis/](./README.md). No new repository scan; no code changed. Target product throughout: **a simple CRM for freelancers + small businesses (1–50 people).**

**Status legend:** ✅ YES · 🟢 YES – BETTER/FLEXIBLE · 🟡 PARTIAL · 🔵 POSSIBLE VIA TWENTY FOUNDATION · 🔴 MISSING · ⚪ NOT RELEVANT
**Better in:** TWENTY · PIPEDRIVE · SIMILAR · DIFFERENT APPROACH · N/A
**Importance (for 1–50 SMB CRM):** 🔥 CRITICAL · HIGH · MEDIUM · LOW · UNNECESSARY

Rule applied: a feature is ✅ only when the **user-facing functionality already exists** in Twenty. If only the underlying platform could support it (no shipped UX), it is 🔵. 🟢 means the shipped functionality exists **and** is genuinely better/more flexible in practice — not merely "more flexible architecture."

---

## Main comparison table

| Category | Pipedrive Feature | What it does | Twenty Equivalent | Status | Better in | Difference / Notes | Importance |
|---|---|---|---|---|---|---|---|
| Deals | Deals | Sellable opportunity record | Opportunity object | ✅ | SIMILAR | Same concept, standard object | 🔥 |
| Deals | Deal creation | Create deal quickly | Create record (RecordBoard/table/quick-add) | ✅ | SIMILAR | Works; PD has slightly faster inline add on board | 🔥 |
| Deals | Deal detail view | Record page w/ fields, timeline | RecordShowPage (page-layout driven) | ✅ | SIMILAR | Both strong; PD deal page more sales-tuned | 🔥 |
| Deals | Multiple pipelines | Several named pipelines | Kanban View grouped by stage field | 🟡 | PIPEDRIVE | Twenty has one stage field/board; multiple named pipelines need modeling | HIGH |
| Deals | Pipeline stages | Ordered stages | SELECT field values / view groups | ✅ | SIMILAR | Editable stage options; no per-stage probability/rotting | 🔥 |
| Deals | Kanban | Board by stage | RecordBoard | ✅ | SIMILAR | Real Kanban exists | 🔥 |
| Deals | Drag & drop | Move card = change stage | RecordBoard dnd-kit | ✅ | SIMILAR | Works | 🔥 |
| Deals | Deal values | Monetary amount | NUMBER/CURRENCY field | ✅ | SIMILAR | — | 🔥 |
| Deals | Currencies | Amount + currency code | CURRENCY composite (amountMicros+currencyCode) | ✅ | SIMILAR | Multi-currency supported at field level | HIGH |
| Deals | Deal owner | Assigned user | Relation to workspace member / actor | ✅ | SIMILAR | Ownership via relation; PD has explicit owner UX | 🔥 |
| Deals | Contact association | Link person | Relation field | ✅ | SIMILAR | — | 🔥 |
| Deals | Organization association | Link company | Relation field | ✅ | SIMILAR | — | 🔥 |
| Deals | Expected close date | Forecast date | DATE field | ✅ | SIMILAR | Field exists; not yet wired to a forecast view | HIGH |
| Deals | Deal probability | Win % | Custom NUMBER field | 🔵 | PIPEDRIVE | No built-in probability/weighting logic | MEDIUM |
| Deals | Stage probability | Per-stage default % | — | 🔴 | PIPEDRIVE | Not modeled | MEDIUM |
| Deals | Labels | Colored tags | SELECT/MULTI_SELECT field | ✅ | SIMILAR | Achievable via option field; no dedicated label chip UX | MEDIUM |
| Deals | Won deals | Mark won + close | — (status field only if added) | 🔴 | PIPEDRIVE | No won/lost close semantics OOTB | 🔥 |
| Deals | Lost deals | Mark lost + close | — | 🔴 | PIPEDRIVE | Same | 🔥 |
| Deals | Lost reasons | Reason list on loss | — | 🔴 | PIPEDRIVE | Not modeled | HIGH |
| Deals | Deal history | Change/audit timeline | Record timeline + audit logs | ✅ | SIMILAR | Timeline + event logs exist | HIGH |
| Deals | Deal activities | Activities on deal | Tasks + timeline | 🟡 | PIPEDRIVE | Tasks exist; not typed/activity-centric | 🔥 |
| Deals | Deal emails | Emails on deal | Messaging module linked to record | ✅ | SIMILAR | Synced emails appear on record | 🔥 |
| Deals | Deal notes | Notes on deal | Note object | ✅ | SIMILAR | — | HIGH |
| Deals | Deal files | Attachments | Attachments / files | ✅ | SIMILAR | — | MEDIUM |
| Deals | Deal products | Line items on deal | — | 🔵 | PIPEDRIVE | No product catalog; buildable as custom object | MEDIUM |
| Deals | Pipeline totals | Per-stage value/count | View aggregates | 🟡 | PIPEDRIVE | Some aggregates; not weighted stage totals like PD | HIGH |
| Deals | Pipeline filtering | Filter deals | View filters | ✅ | SIMILAR | — | 🔥 |
| Deals | Pipeline sorting | Sort (e.g. next activity) | View sorts | 🟡 | PIPEDRIVE | Sorting yes; "sort by next activity" needs activity model | HIGH |
| Deals | Pipeline customization | Edit stages/board | View + field config | ✅ | SIMILAR | Editable; multiple named pipelines still a gap | HIGH |
| Leads | Leads | Pre-deal record | — (use pipeline stage) | ⚪ | N/A | We intentionally drop separate Leads | LOW |
| Leads | Leads Inbox | Triage inbox | — | 🔴 | PIPEDRIVE | Not needed for our scope | LOW |
| Leads | Lead qualification | Qualify before deal | Pipeline stage / field | 🔵 | DIFFERENT APPROACH | Model as first stage | LOW |
| Leads | Lead → Deal conversion | Promote to deal | Same-object stage change | 🔵 | DIFFERENT APPROACH | No conversion step needed | LOW |
| Leads | Lead source | Origin channel | Custom field | ✅ | SIMILAR | Field | LOW |
| Leads | Lead labels | Tags | SELECT field | ✅ | SIMILAR | Field | LOW |
| Leads | Lead activities | Activities pre-deal | Tasks/timeline | 🟡 | SIMILAR | Same as deal activities | LOW |
| People | People/Contacts | Person records | Person object | ✅ | SIMILAR | Standard object | 🔥 |
| People | Contact detail | Record page | RecordShowPage | ✅ | SIMILAR | Unified template | 🔥 |
| People | Contact lists | List view | RecordTable/View | ✅ | SIMILAR | — | 🔥 |
| People | Custom fields | Per-entity fields | Metadata engine | 🟢 | TWENTY | 25 field types incl. composites; more flexible | HIGH |
| People | Activities | Activities on contact | Tasks/timeline | 🟡 | PIPEDRIVE | See Activities category | HIGH |
| People | Emails | Emails on contact | Messaging linked | ✅ | SIMILAR | — | 🔥 |
| People | Notes | Notes | Note object | ✅ | SIMILAR | — | HIGH |
| People | Files | Attachments | Attachments | ✅ | SIMILAR | — | MEDIUM |
| People | Timeline | Unified history | Record timeline | ✅ | SIMILAR | — | HIGH |
| People | Associated deals | Linked deals | Relation + view | ✅ | SIMILAR | Shown via relation; PD adds rollup counts | 🔥 |
| People | Search | Find contacts | Command menu / search | ✅ | SIMILAR | — | 🔥 |
| People | Filters | Filter contacts | View filters | ✅ | SIMILAR | — | HIGH |
| People | Duplicate detection | Flag dupes | — | 🔴 | PIPEDRIVE | Not surfaced OOTB | HIGH |
| People | Contact merging | Merge records | — | 🔴 | PIPEDRIVE | No merge UI | HIGH |
| Organizations | Organizations | Company records | Company object | ✅ | SIMILAR | — | 🔥 |
| Organizations | Organization detail | Record page | RecordShowPage | ✅ | SIMILAR | — | HIGH |
| Organizations | Employees/people | People in org | Relation (Person→Company) | ✅ | SIMILAR | — | HIGH |
| Organizations | Deals | Org's deals | Relation | ✅ | SIMILAR | PD adds open/closed rollup columns | HIGH |
| Organizations | Activities | On org | Tasks/timeline | 🟡 | PIPEDRIVE | See Activities | MEDIUM |
| Organizations | Emails | On org | Messaging | ✅ | SIMILAR | — | MEDIUM |
| Organizations | Notes | On org | Note | ✅ | SIMILAR | — | MEDIUM |
| Organizations | Custom fields | Org fields | Metadata | 🟢 | TWENTY | More flexible | MEDIUM |
| Organizations | Organization hierarchy | Parent/child orgs | Self-relation (custom) | 🔵 | DIFFERENT APPROACH | Buildable via relation; PD hierarchy is limited too | LOW |
| Activities | Tasks | To-dos | Task object | ✅ | SIMILAR | — | 🔥 |
| Activities | Calls | Logged calls | Activity type / task | 🟡 | PIPEDRIVE | No typed "call" activity OOTB | HIGH |
| Activities | Meetings | Meetings | Calendar event / task | 🟡 | PIPEDRIVE | Calendar events exist; not unified activity type | HIGH |
| Activities | Deadlines | Due milestone | Task due date | 🟡 | SIMILAR | Via task | MEDIUM |
| Activities | Custom activity types | User-defined types | — (task types not configurable OOTB) | 🔵 | PIPEDRIVE | Metadata could model; not shipped | HIGH |
| Activities | Due dates | Date/time due | Task field | ✅ | SIMILAR | — | 🔥 |
| Activities | Reminders | Notify before due | Notifications | 🟡 | PIPEDRIVE | Some notifications; not activity reminders UX | HIGH |
| Activities | Recurring activities | Repeat tasks | — | 🔴 | PIPEDRIVE | Not modeled | LOW |
| Activities | Completed activities | Done state | Task status | ✅ | SIMILAR | — | 🔥 |
| Activities | Overdue activities | Past-due surfacing | View filter on due date | 🟡 | PIPEDRIVE | Filterable; no "today/overdue" worklist UX | 🔥 |
| Activities | Deal association | Link to deal | Relation | ✅ | SIMILAR | — | 🔥 |
| Activities | Contact association | Link to contact | Relation | ✅ | SIMILAR | — | 🔥 |
| Activities | Calendar view | Activities on calendar | Calendar module | 🟡 | PIPEDRIVE | Calendar sync exists; activity-calendar view less mature | HIGH |
| Email | Email sync | 2-way sync | Messaging module | ✅ | SIMILAR | Core sync engine present | 🔥 |
| Email | Gmail | Google sync | Google provider | ✅ | SIMILAR | — | 🔥 |
| Email | Microsoft/Outlook | MS sync | Microsoft provider | ✅ | SIMILAR | — | 🔥 |
| Email | CRM inbox | In-app inbox | Message threads on records | 🟡 | PIPEDRIVE | Messages linked to records; no dedicated "Mail" inbox UX like PD | HIGH |
| Email | Email threads | Threaded view | Thread model | ✅ | SIMILAR | — | HIGH |
| Email | Contact association | Auto-link email→person | Participant matching | ✅ | SIMILAR | — | 🔥 |
| Email | Deal association | Link email→deal | Via participant/record link | 🟡 | PIPEDRIVE | Contact match strong; deal linking less explicit | HIGH |
| Email | Email composer | Send from CRM | Outbound send (gmail/ms/imap) | ✅ | SIMILAR | Sending exists; UX less polished | HIGH |
| Email | Templates | Reusable emails | — | 🔴 | PIPEDRIVE | Not built-in | HIGH |
| Email | Signatures | Auto signature | — | 🔴 | PIPEDRIVE | Not built-in | MEDIUM |
| Email | Email tracking | Open tracking | — | 🔴 | PIPEDRIVE | Not built-in | MEDIUM |
| Email | Link tracking | Click tracking | — | 🔴 | PIPEDRIVE | Not built-in | MEDIUM |
| Email | Scheduled emails | Send later | — | 🔴 | PIPEDRIVE | Not built-in | LOW |
| Email | Bulk email | Group send | — | 🔴 | PIPEDRIVE | Not built-in | LOW |
| Email | Team/shared inbox | Shared mailbox | — | 🔵 | PIPEDRIVE | Buildable; PD Premium | MEDIUM |
| Calendar | Calendar | Calendar data | Calendar module | ✅ | SIMILAR | — | HIGH |
| Calendar | Google Calendar sync | Google sync | Google provider | ✅ | SIMILAR | — | HIGH |
| Calendar | Microsoft Calendar sync | MS sync | Microsoft/CalDAV | ✅ | SIMILAR | — | HIGH |
| Calendar | Activity calendar | Activities on calendar | Calendar view | 🟡 | PIPEDRIVE | Sync yes; activity-overlay view less mature | MEDIUM |
| Calendar | Meeting scheduling | Booking pages | — | 🔴 | PIPEDRIVE | No scheduler | MEDIUM |
| Calendar | Availability | Free/busy slots | — | 🔴 | PIPEDRIVE | Tied to scheduler | LOW |
| Calendar | Reminders | Event reminders | Notifications | 🟡 | SIMILAR | Partial | MEDIUM |
| Products | Product catalog | Reusable products | — | 🔵 | PIPEDRIVE | Custom object | MEDIUM |
| Products | Products on deals | Line items | — | 🔵 | PIPEDRIVE | Relation + custom object | MEDIUM |
| Products | Price | Unit price | CURRENCY field | 🔵 | SIMILAR | Field exists; needs line-item model | MEDIUM |
| Products | Quantity | Qty | NUMBER field | 🔵 | SIMILAR | Same | MEDIUM |
| Products | Discounts | Per-line discount | — | 🔴 | PIPEDRIVE | Not modeled | LOW |
| Products | Taxes | Tax calc | — | 🔴 | PIPEDRIVE | Not modeled | LOW |
| Products | Recurring products | Subscriptions | — | 🔴 | PIPEDRIVE | Not modeled | LOW |
| Products | Revenue calculations | Sum line items | — | 🔵 | PIPEDRIVE | Formula/rollup possible | MEDIUM |
| Search | Global search | Search all | Command menu search | ✅ | SIMILAR | — | 🔥 |
| Search | Contact search | Find people | Search | ✅ | SIMILAR | — | 🔥 |
| Search | Deal search | Find deals | Search | ✅ | SIMILAR | — | HIGH |
| Search | Organization search | Find orgs | Search | ✅ | SIMILAR | — | HIGH |
| Search | Filters | Filter lists | View filters | ✅ | SIMILAR | — | 🔥 |
| Search | Saved filters | Reusable filters | Saved views/filters | ✅ | SIMILAR | — | HIGH |
| Search | Sorting | Sort lists | View sorts | ✅ | SIMILAR | — | HIGH |
| Search | Custom columns | Choose columns | View fields | ✅ | SIMILAR | — | HIGH |
| Search | List customization | Configure list | Views | 🟢 | TWENTY | Views engine flexible | HIGH |
| Search | Bulk actions | Act on many | Record table bulk actions | ✅ | SIMILAR | — | HIGH |
| Customization | Custom fields | Add fields | Metadata engine | 🟢 | TWENTY | Richer type system | 🔥 |
| Customization | Custom field types | Field kinds | 25 types incl. composites | 🟢 | TWENTY | Far more types than PD | HIGH |
| Customization | Required fields | Mandatory fields | Field config | 🟡 | PIPEDRIVE | Constraint support less turnkey than PD required/pipeline-specific | MEDIUM |
| Customization | Custom objects | New entities | Custom objects | 🟢 | TWENTY | PD can't; Twenty can | LOW (hide) |
| Customization | Custom views | Saved views | Views | ✅ | SIMILAR | — | HIGH |
| Customization | Custom pipelines | Named pipelines | Kanban view/stage field | 🟡 | PIPEDRIVE | Multiple named pipelines gap | HIGH |
| Customization | Custom stages | Edit stages | Field options | ✅ | SIMILAR | — | 🔥 |
| Customization | Custom activity types | Activity kinds | — | 🔵 | PIPEDRIVE | Metadata could; not shipped | HIGH |
| Customization | Custom record layouts | Page layout | Page-layout system | 🟢 | TWENTY | Layout/widget/tab engine | MEDIUM |
| Customization | Metadata-driven UI | Schema→UI | Metadata engine (core) | 🟢 | TWENTY | Entire UI is metadata-driven | HIGH (infra) |
| Automations | Workflow builder | Visual builder | Workflow editor (xyflow) | 🟢 | TWENTY | Uncapped vs PD limits | HIGH |
| Automations | Triggers | Start events | db-event/cron/webhook/manual | 🟢 | TWENTY | Broader triggers | HIGH |
| Automations | Conditions | Filters/branch | filter + if-else | ✅ | SIMILAR | — | HIGH |
| Automations | Actions | Do things | create/update/delete/email/http/ai/iterator/delay | 🟢 | TWENTY | More action types, incl. AI | HIGH |
| Automations | Deal triggers | On deal change | db-event on Opportunity | ✅ | SIMILAR | Watched fields + filter | HIGH |
| Automations | Activity triggers | On activity | db-event on Task | ✅ | SIMILAR | — | MEDIUM |
| Automations | Field-change triggers | On field update | db-event watched fields | ✅ | SIMILAR | — | HIGH |
| Automations | Create activity | Make task | Create-record action | ✅ | SIMILAR | — | 🔥 |
| Automations | Update record | Edit record | Update-record action | ✅ | SIMILAR | — | HIGH |
| Automations | Create record | New record | Create-record action | ✅ | SIMILAR | — | HIGH |
| Automations | Send email | Email action | Send-email action | ✅ | SIMILAR | — | HIGH |
| Automations | Webhooks | Outbound hook | Webhook action + webhooks | 🟢 | TWENTY | Uncapped | MEDIUM |
| Automations | Scheduled automation | Time-based | Cron trigger | 🟢 | TWENTY | PD limits runtime | MEDIUM |
| Automations | Branching | If/else paths | if-else step | 🟢 | TWENTY | No branch-depth cap | MEDIUM |
| Automations | Workflow history | Run logs | Run state + step logs | 🟢 | TWENTY | Rich run history | MEDIUM |
| Automations | Error handling | Retries/failures | Retries, fail-safely, staled recovery | 🟢 | TWENTY | Robust | MEDIUM |
| Reporting | Dashboard | Widget dashboards | Dashboards (recent) | 🟡 | PIPEDRIVE | Nascent; no prebuilt sales dashboards | 🔥 |
| Reporting | Revenue reporting | $ reports | — (build on data layer) | 🔵 | PIPEDRIVE | No prebuilt; MRR/ARR absent both | HIGH |
| Reporting | Deal reporting | Deal metrics | — | 🔵 | PIPEDRIVE | Buildable; not shipped | 🔥 |
| Reporting | Pipeline reporting | Funnel | — | 🔵 | PIPEDRIVE | Not shipped | 🔥 |
| Reporting | Conversion rates | Stage conversion | — | 🔵 | PIPEDRIVE | Not shipped | HIGH |
| Reporting | Activity reporting | Activity metrics | — | 🔵 | PIPEDRIVE | Not shipped | HIGH |
| Reporting | Forecasting | Weighted forecast | — | 🔴 | PIPEDRIVE | No forecast view | HIGH |
| Reporting | Goals | Targets | — | 🔴 | PIPEDRIVE | Not modeled | MEDIUM |
| Reporting | Custom reports | Build reports | Dashboard widgets (limited) | 🟡 | PIPEDRIVE | Limited vs PD Insights | HIGH |
| Reporting | Charts | Visualizations | Dashboard charts | 🟡 | SIMILAR | Some chart widgets | HIGH |
| Reporting | Filters | Report filters | View/dashboard filters | 🟡 | PIPEDRIVE | Partial | HIGH |
| Import/Export | CSV import | Import CSV | spreadsheet-import module | ✅ | SIMILAR | — | 🔥 |
| Import/Export | Excel import | Import XLSX | spreadsheet-import | ✅ | SIMILAR | — | HIGH |
| Import/Export | Contact import | Import people | Import | ✅ | SIMILAR | — | 🔥 |
| Import/Export | Organization import | Import orgs | Import | ✅ | SIMILAR | — | HIGH |
| Import/Export | Deal import | Import deals | Import | ✅ | SIMILAR | — | HIGH |
| Import/Export | Field mapping | Map columns | Import mapping | ✅ | SIMILAR | — | HIGH |
| Import/Export | Duplicate handling | Dedupe on import | Partial | 🟡 | PIPEDRIVE | PD has explicit dedupe/merge step | MEDIUM |
| Import/Export | CSV export | Export CSV | Record export (EXPORT_CSV perm) | ✅ | SIMILAR | — | HIGH |
| Import/Export | Data export | Full export | Export / API | ✅ | TWENTY | API + self-host DB access | MEDIUM |
| Users & Teams | Users | Members | Users / workspace members | ✅ | SIMILAR | — | 🔥 |
| Users & Teams | Teams | Grouping | Roles (no explicit "team" object) | 🟡 | PIPEDRIVE | Teams/team-filters not first-class | MEDIUM |
| Users & Teams | Roles | Role sets | Roles | 🟢 | TWENTY | Richer role model | HIGH |
| Users & Teams | Permissions | Access control | Permission flags | 🟢 | TWENTY | Granular | HIGH |
| Users & Teams | Record permissions | Row visibility | Row-level permission predicates | 🟢 | TWENTY | RLS in ORM; PD visibility groups | MEDIUM |
| Users & Teams | Field permissions | Field visibility | Field permissions | 🟢 | TWENTY | Per-field read/update | MEDIUM |
| Users & Teams | Workspace permissions | Workspace scope | Multi-tenant + roles | ✅ | SIMILAR | — | MEDIUM |
| Users & Teams | Ownership | Record owner | Owner relation/actor | 🟡 | PIPEDRIVE | Ownership less turnkey than PD | HIGH |
| Integrations | Gmail | Google integ | Native | ✅ | SIMILAR | — | 🔥 |
| Integrations | Outlook | MS integ | Native | ✅ | SIMILAR | — | 🔥 |
| Integrations | Google Calendar | Cal sync | Native | ✅ | SIMILAR | — | HIGH |
| Integrations | Microsoft Calendar | Cal sync | Native | ✅ | SIMILAR | — | HIGH |
| Integrations | Slack | Slack integ | twenty-apps (public/slack) | 🔵 | DIFFERENT APPROACH | Example app exists; not turnkey | MEDIUM |
| Integrations | Zapier | Zapier app | twenty-zapier package | ✅ | SIMILAR | — | MEDIUM |
| Integrations | Webhooks | Outbound events | Webhooks | ✅ | SIMILAR | — | HIGH |
| Integrations | API | Programmatic access | GraphQL + REST auto-gen | 🟢 | TWENTY | Auto-generated per workspace | HIGH |
| Integrations | Marketplace | App store | Apps/SDK (nascent) | 🔵 | PIPEDRIVE | PD has 500+; Twenty ecosystem young | LOW |
| Integrations | Custom integrations | Build your own | SDK + API + webhooks | 🟢 | TWENTY | Strong foundation | MEDIUM |
| Developer | REST API | REST | Auto-generated REST | 🟢 | TWENTY | Generated from metadata | HIGH |
| Developer | GraphQL | GraphQL | Auto-generated GraphQL | 🟢 | TWENTY | PD has none | MEDIUM |
| Developer | Webhooks | Events | Webhooks | ✅ | SIMILAR | — | MEDIUM |
| Developer | Custom objects | New entities | Custom objects | 🟢 | TWENTY | PD can't | MEDIUM |
| Developer | Metadata API | Schema API | Metadata GraphQL API | 🟢 | TWENTY | PD limited | MEDIUM |
| Developer | App SDK | Build apps | twenty-sdk | 🟢 | TWENTY | Define objects/fields/UI/functions | MEDIUM |
| Developer | Custom applications | Installable apps | Application manifest/sync | 🟢 | TWENTY | Per-workspace apps | LOW |
| Developer | Server-side functions | Serverless | Logic functions (Lambda/local) | 🟢 | TWENTY | PD has none comparable | LOW |
| Developer | Custom UI | Custom components | Front components (sandboxed) | 🟢 | TWENTY | Remote-DOM sandbox | LOW |
| Developer | Extension framework | Extensibility | Apps + metadata + workflows | 🟢 | TWENTY | Deep | MEDIUM |
| Developer | Open source | OSS | Open source | 🟢 | TWENTY | PD proprietary | HIGH |
| Developer | Self hosting | Run yourself | Docker/Helm/k8s | 🟢 | TWENTY | PD SaaS-only | HIGH |
| Developer | Database access | Direct DB | Self-host Postgres | 🟢 | TWENTY | PD none | MEDIUM |
| Developer | AI extension possibilities | Custom AI | AI agents + tools + SDK | 🟢 | TWENTY | Extensible agent/tool layer | HIGH |
| AI | AI assistant | In-app helper | AI chat (full-page + side panel) | 🟢 | DIFFERENT APPROACH | Twenty = agentic chat w/ tools; PD = packaged assistant | HIGH |
| AI | Natural-language interaction | NL commands | AI chat + record-CRUD tools | 🟢 | TWENTY | Can create/query records via NL | HIGH |
| AI | Email summarization | Summarize threads | AI chat/tools | 🔵 | DIFFERENT APPROACH | Possible; PD Premium ships it | MEDIUM |
| AI | Email generation | Draft emails | AI + send-email | 🔵 | DIFFERENT APPROACH | Possible; PD Premium ships it | MEDIUM |
| AI | Record summarization | Summarize record | AI chat/tools | 🔵 | TWENTY | Achievable via tools | MEDIUM |
| AI | Sales suggestions | Coaching tips | — | 🔵 | PIPEDRIVE | PD Sales Assistant; not packaged in Twenty | MEDIUM |
| AI | Next-action suggestions | Suggest next step | AI agent (buildable) | 🔵 | PIPEDRIVE | PD ships it; Twenty needs building | HIGH |
| AI | AI agents | Autonomous agents | Agent metadata + executor | 🟢 | TWENTY | First-class agents | HIGH |
| AI | AI tools | Function calling | Tool provider + registry | 🟢 | TWENTY | Rich tool layer | HIGH |
| AI | Extensibility | Custom AI | Agents/tools/providers | 🟢 | TWENTY | Multi-provider, custom tools | HIGH |
| AI | Custom AI functionality | Build AI features | AI + SDK + workflows | 🟢 | TWENTY | Strong | HIGH |
| Mobile | Mobile app | Native app | Responsive web only | 🔴 | PIPEDRIVE | No native iOS/Android | HIGH |

---

## Summary 1 — Twenty already matches Pipedrive

| Feature | Twenty Implementation | Any changes needed? |
|---|---|---|
| Contacts (People) | Person standard object + list/show | None |
| Organizations | Company object + relations | Add deal rollup columns (minor) |
| Deals (as records) | Opportunity object | Add deal-specific fields |
| Kanban + drag & drop | RecordBoard (dnd-kit) grouped by stage | Point at stage field |
| Deal/contact detail pages | RecordShowPage + timeline + inline edit | Opinionated layout |
| Notes | Note object | None |
| Email sync (Gmail/MS) | Messaging module | UI polish |
| Calendar sync (Google/MS) | Calendar module | Activity-calendar view |
| Search / filters / saved views / columns / bulk actions | Views + command menu | None |
| Custom fields | Metadata engine | Simplify UI |
| CSV/Excel import + mapping + export | spreadsheet-import + export | Dedupe polish |
| Roles & permissions | Roles + object/field/row perms | Simplify to admin/member |
| Webhooks + API + Zapier | Auto-gen API + webhooks + twenty-zapier | None |
| Automation engine | Workflow engine (uncapped) | Simplify UI |

## Summary 2 — Twenty is better (conservative)

| Feature | Pipedrive | Twenty Advantage | Why it matters |
|---|---|---|---|
| Custom fields / field types | Fixed entities, capped, plan-gated | Metadata engine, 25 types incl. composites, no caps | Deeper customization without paywall |
| Custom objects | None | Full custom objects | Extend beyond CRM without forking |
| Automation | Capped (50/150/250 workflows, ~10 actions, 90-day, no email trigger) | Uncapped engine, more triggers/actions incl. AI, run history, retries | Directly attacks a top-3 PD complaint |
| API | REST v1/v2 | Auto-generated GraphQL **and** REST per workspace | Better DX, no per-field config |
| Open source / self-hosting / DB access | Proprietary SaaS | OSS + Docker/Helm/k8s + direct Postgres | Data ownership, cost, trust wedge |
| Custom UI / server functions / app SDK | Marketplace apps only | Front components (sandbox) + logic functions + SDK | Deeper extensibility |
| Permissions | Sets + visibility groups | Object + field + row-level (RLS) | Finer control when teams grow |
| AI agents / tools | Packaged assistant | First-class agents + tool/function-calling + multi-provider | Foundation for "AI does the data entry" |

Note: Twenty's advantages are **infrastructure + extensibility**, plus **uncapped automation**. For everyday sales UX (deal semantics, forecast, reports, activity worklist), Pipedrive is currently ahead — see Summary 3.

## Summary 3 — Pipedrive is better (what we must build)

| Feature | Pipedrive Advantage | Twenty Weakness | Importance | Difficulty to close gap |
|---|---|---|---|---|
| Won/Lost + lost reasons | First-class close states + reason list | No close semantics | 🔥 | SMALL |
| Weighted forecast view | Deals by expected-close month × probability | No forecast view | HIGH | MEDIUM |
| Deal probability / weighted value | Built-in | Only as raw field | MEDIUM | SMALL |
| Multiple named pipelines | Many pipelines, per-stage probability/rotting | Single stage field/board | HIGH | MEDIUM |
| Deal rotting / days-in-stage | Idle flags + stage timers | Not modeled | HIGH | MEDIUM |
| Activity typing + overdue/today worklist | Typed activities + "what to do next" | Tasks not typed; no worklist UX | 🔥 | MEDIUM |
| Won→plan-next-activity nudge | Built-in behavior | None | HIGH | SMALL |
| Reporting suite (funnel, win rate, conversion, activity) | Prebuilt Insights | Only nascent dashboards | 🔥 | LARGE |
| Goals | Deal/activity/forecast goals | None | MEDIUM | MEDIUM |
| Email templates / tracking / scheduler | Built-in | None | HIGH | MEDIUM |
| CRM "Mail" inbox UX | Dedicated inbox | Messages on records only | HIGH | MEDIUM |
| Meeting scheduler / booking pages | Built-in | None | MEDIUM | MEDIUM |
| Duplicate detection + merge | Inline | None | HIGH | MEDIUM |
| Products / line items | Catalog + deal lines | None | MEDIUM | MEDIUM |
| Contact/org rollups (open/closed deals) | On list + record | Not surfaced | MEDIUM | SMALL |
| Native mobile apps | iOS + Android | Responsive web only | HIGH | VERY LARGE |
| Packaged AI (assistant, email AI, next-action) | Shipped features | Foundation only | HIGH | MEDIUM |

## Summary 4 — Missing for our product (only what matters at 1–50)

| Missing/Weak Feature | Importance | Twenty Foundation Available? | Estimated Effort | Recommendation |
|---|---|---|---|---|
| Won/Lost + lost reasons + close date | 🔥 | Yes (fields + workflow) | SMALL | Build in MVP |
| Activity typing + overdue/today worklist + won-nudge | 🔥 | Yes (Task + views + workflow) | MEDIUM | Build in MVP |
| Sales reporting floor (funnel, win rate, activity, weighted forecast) | 🔥 | Partial (dashboards + data layer) | LARGE | Build MVP→V1 |
| Multiple pipelines + rotting/days-in-stage | HIGH | Partial (stage field/views) | MEDIUM | V1 |
| Email templates + tracking + send-from-record UX | HIGH | Partial (messaging send) | MEDIUM | V1 |
| Duplicate detection + merge | HIGH | No | MEDIUM | V1 |
| CRM inbox / clearer email-on-deal UX | HIGH | Partial | MEDIUM | V1 |
| Packaged AI (email→CRM, next-action) | HIGH | Yes (agents/tools) | MEDIUM | V1→V2 (differentiator) |
| Meeting scheduler | MEDIUM | No | MEDIUM | V1/Later |
| Products / line items | MEDIUM | Yes (custom object) | MEDIUM | V1/Later |
| Goals | MEDIUM | Partial | MEDIUM | Later |
| Native mobile | HIGH | No (web only) | VERY LARGE | Later |
| Marketplace/ecosystem | LOW | Partial (SDK) | LARGE | Later |
| Separate Leads inbox | LOW | n/a | — | Ignore (use pipeline stage) |
| Recurring activities, discounts/taxes, bulk email, campaigns | LOW | Partial/No | VARIES | Ignore for MVP/V1 |

---

## Final scorecard

Scores = how well **Twenty as it exists today** delivers that area **for our SMB product** (shipped user-facing functionality, not architecture).

### Core CRM
- Deals: **6/10** (object + fields yes; won/lost + probability missing)
- Pipeline: **5/10** (kanban yes; multi-pipeline, rotting, weighted totals missing)
- Contacts: **7/10** (strong; dup-merge + rollups missing)
- Activities: **5/10** (tasks/calendar yes; typing, worklist, won-nudge missing)
- Email: **6/10** (sync strong; templates/tracking/inbox UX missing)
- Calendar: **6/10** (sync yes; scheduler/activity-calendar missing)
- Search/Filters: **8/10** (strong)
- Customization: **9/10** (metadata engine beats PD; needs simplification, not capability)
- Automation: **8/10** (engine beats PD; needs simple UI)
- Reporting: **3/10** (nascent dashboards; no prebuilt sales reports/forecast/goals)
- Integrations: **6/10** (email/cal/zapier/API yes; marketplace young)
- Permissions: **8/10** (richer than PD; over-powered → simplify)
- Mobile: **2/10** (no native app)
- Developer Platform: **10/10** (OSS, self-host, GraphQL+REST, custom objects, SDK, functions, sandboxed UI)
- AI Potential: **9/10** (agents + tools + multi-provider; packaging needed)

### Headline scores
- **Pipedrive overall for our target product: 8/10** — mature, focused SMB sales UX; loses points on pricing/add-on friction + weak post-sale, not on core capability.
- **Twenty as it exists today (as a ready-made Pipedrive-style product): 6/10** — infra excellent, but missing packaged deal/activity/report UX means it isn't a turnkey PD replacement yet.
- **Twenty as a foundation for our Pipedrive competitor: 8.5/10** — most gaps are "extend + simplify" on a strong base; only mobile + full report suite are heavy.

---

## What we actually need to build

### Already done by Twenty (≈ no development)
Contacts, Organizations, Deals-as-records, Kanban + drag & drop, record detail pages + timelines, Notes, email sync (Gmail/MS), calendar sync, search/filters/saved views/columns/bulk actions, custom fields, CSV import/export, roles & permissions, webhooks + API + Zapier, and the automation **engine**.

### Small adjustments (UX / config / hide complexity)
Opinionated deal/contact layouts; relabel Company→Organization (optional); admin/member role preset; simplify custom-field + workflow + permission UIs; **hide** custom objects/metadata/raw workflow power; seed default pipeline/stages/activity types + onboarding checklist; deal-rollup columns on contacts/orgs; simplify command menu for non-power users.

### Features we need to extend (foundation exists, functionality incomplete)
Deal semantics (won/lost + lost reason + close date, probability/weighted value, days-in-stage/rotting, multiple named pipelines); activity typing + overdue/today worklist + won-nudge; reporting (funnel/win-rate/conversion/activity/weighted forecast + goals); email templates + tracking + send-from-record + inbox UX; products/line items; enrichment wiring; packaged AI (email→CRM, next-action, NL search/report).

### Features we need to build (real gaps)
Duplicate detection + merge UI; meeting scheduler/booking pages; native mobile apps; a prebuilt sales-report/dashboard suite (largest single build).

### Features we should ignore (unnecessary complexity for SMB)
Separate Leads entity/inbox; automation caps; add-on paywalls; recurring activities; discounts/taxes on products; bulk email / full email-marketing Campaigns; enterprise permission matrices; 300–500 custom fields / formula fields surfaced to end users; heavy marketplace at launch.

---

## Foundation coverage estimate

Two **separate** percentages, derived from the matrix (≈150 rated feature rows; ⚪/LOW-importance Leads rows excluded from the product denominator).

### Technical foundation coverage: **~80%**
Method: of the capabilities needed for the product, share where Twenty provides either the shipped function **or** a clear existing foundation to build on (✅ + 🟢 + 🔵 count as "foundation present"; 🟡 as half; 🔴 as absent). Across categories, only a handful are truly 🔴 with **no** foundation (native mobile, meeting scheduler, duplicate-merge, some product tax/discount, packaged forecast/goals). Nearly everything else is ✅/🟢/🔵. → roughly four-fifths of the infrastructure exists.

### User-facing product coverage: **~58%**
Method: share where Twenty **today** ships the actual Pipedrive-equivalent UX (✅ + 🟢 count fully; 🔵 counts as ~0 because the UX isn't built; 🟡 as half; 🔴 as 0), weighted toward 🔥/HIGH SMB features. Deals/pipeline/activities/reporting each carry major 🟡/🔴 user-facing gaps (won-lost, forecast, worklist, reports, templates, dup-merge, mobile), pulling the shipped-product number well below the infrastructure number.

**Interpretation:** Twenty gives us ~**80% of the technical foundation** but only ~**58% of the polished Pipedrive-like product experience**. The build is mostly **assembling and simplifying** existing infrastructure into SMB-friendly sales UX (deal semantics, activity worklist, reports, email polish) plus a few genuine net-new pieces (dup-merge, scheduler, mobile, report suite) — not building a CRM engine from scratch. This is consistent with the 8.5/10 "foundation" score and the [15-MVP-V1-V2.md](15-MVP-V1-V2.md) scope.

*Comparison and decision support only — nothing implemented, no code changed.*
