# Gap-Analyse: Pipedrive vs Twenty

Status-Legende: ✅ nativ vorhanden · ⚠️ baubar (Workflow/AI-Agent/App), nicht als natives Sales-Feature · ❌ fehlt.

Quelle Twenty-Fähigkeiten: [docs.twenty.com](https://docs.twenty.com) + Code (laufende Instanz geprüft).

## Was Twenty laut Docs schon kann
- **Workflows** ([overview](https://docs.twenty.com/user-guide/workflows/overview)): Create/Update/Delete/Search/Upsert Record, Iterator, Filter, Delay, **Send Email**, Code (JS), HTTP Request, **Form** (Runtime-Inputs), AI-Agent. Trigger/Runs/Credits.
- **AI** ([overview](https://docs.twenty.com/user-guide/ai/overview)): Chatbot (voller Datenzugriff, Page-Context) + **AI-Agents in Workflows** — explizit: Leads kategorisieren, **Firmendaten enrichen**, **Follow-up-Email-Drafts**, **Opportunities scoren**.
- **Email** ([send](https://docs.twenty.com/user-guide/calendar-emails/how-tos/can-i-send-emails-from-twenty)): Sync + Threads + **compose & send** + Auto-Contact + Send-via-Workflow. Sequences/Newsletter **nicht** nativ (Docs empfehlen externes Tool).
- **Apps** ([apps](https://docs.twenty.com/getting-started/core-concepts/apps), [logic functions](https://docs.twenty.com/developers/extend/apps/logic/logic-functions)): Logic-Functions (server-TS, HTTP/cron/db-event, als AI-Tool oder Workflow-Action), Skills & Agents, Views & Navigation, Code-Interpreter.
- **Permissions** (role-based, auch AI-Agents), **CSV Import/Export + API**.
- Core-Objekte: Companies, People, Opportunities (Deals), Tasks, Notes, **Dashboards** (Charts), Records-Board (Kanban), Record-Detail, Filter/Sort/Search.

## Gap-Tabelle

| Pipedrive-Feature | Twenty | Weg |
|---|---|---|
| Pipeline: **rotting** (idle-warn) | ❌ | Core: Feld + View-Logik |
| Pipeline: **stage-probability** | ❌ | Core: Stage-Metadaten |
| **Won/Lost-Lifecycle** + lost-reasons + win-rate | ❌ | Core: Opportunity-Status + reasons |
| **days-in-stage Progress-Bar** (Deal-Detail) | ❌ | Core-FE: Stage-Historie |
| **Forecast-View** (Umsatz nach Close-Date) | ❌ | Core: View-Typ |
| Drag → **Won/Lost/Move-bar** im Board | ❌ | Core-FE: Board-Interaktion |
| **Deal-Scoring** inline-Badge | ⚠️ | AI-Agent-Workflow → Score-Feld + Badge-FE |
| **ACV / ARR / MRR** + **Products/Line-Items** | ❌ | Core: neues Objekt (Product/Line-Item) + Felder |
| **Insights** Report-Bibliothek (Funnel/Win-Loss/Performance/Activities) | ⚠️→❌ | Dashboards-Erweiterung: Report-Typen |
| **Goals/Targets** | ❌ | Core: neues Objekt + Tracking |
| **Teilbare Widget-Dashboards** | ⚠️ | Dashboards vorhanden, Sharing/mehr Widgets ausbauen |
| **AI-Report-Generation** | ⚠️ | AI-Chatbot kann Daten abfragen; Report-Ausgabe als Widget fehlt |
| **Email-Sequences/Cadences** | ❌ | App/Skill oder Core: Sequence-Engine (Workflow-basiert) |
| **Email-Templates + Merge-fields (UI)** | ⚠️ | Compose da; Template/Merge-UI fehlt |
| **Email-Tracking** (open/click) | ❌ | Core: Tracking-Pixel/Link-Wrap |
| **Meeting-Scheduler** (Free/Busy-Link) | ❌ | Core/App: Scheduler |
| **Native Enrichment-Button** | ⚠️ | AI-Agent/Logic-Function → 1-Klick-Button-FE |
| **Leads** eigene Entity + **Leads-Inbox** | ❌ | Core: neues Objekt + Inbox-View |
| **LeadBooster** (Live-Chat/Chatbot/Web-Forms/Prospector) | ❌ | Apps |
| **Sales-Inbox** (voller Email-Client im CRM) | ❌ | Core: Inbox-View über Message-Sync |
| **Typed Activities** (Call/Meeting/Deadline/Lunch…) | ❌ | Core: Activity-Objekt + Typen (Twenty: nur Tasks) |
| **Activities-Calendar-Grid** + Meeting-Scheduler | ❌ | Core-FE: Calendar-View |
| **Campaigns** (Email-Marketing + Drag-Editor + Tracking) | ❌ | App oder eigenes Modul |
| **Changelog-Tab** (feldgenaue Audit-History am Record) | ⚠️ | Activity-Log da; feldgenauer Changelog-Tab fehlt |
| **Followers** am Record | ⚠️ | teils vorhanden, ausbauen |
| **Documents / Invoices**-Tabs am Deal | ❌ | Core/App: Doc-Gen (Tutorial existiert) + Invoice |

## Priorisierung (Impact × Nähe zum Pipedrive-Kern)
1. **Pipeline-Semantik** (rotting, probability, won/lost, days-in-stage, forecast, drag-bar) — Pipedrive-Kern, Twentys schwächste Stelle.
2. **Insights**: Funnel + Win/Loss + Goals.
3. **Activities** typed + Calendar + Meeting-Scheduler.
4. **Sales-Inbox + Leads + LeadBooster** — großer eigener Block.
5. **Sequences / Campaigns** — Email-Cadence + Marketing.
6. **Deal-Ökonomie**: Products/Line-Items + ACV/ARR/MRR + Scoring-Badge.

> Reihenfolge-Entscheidung: **UI-Reskin zuerst** (siehe [03-ui-plan.md](03-ui-plan.md)), dann Features 1→6 auf der neuen Basis.
