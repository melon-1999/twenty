# Feature-Roadmap (Phase 2+, nach UI-Reskin)

Reihenfolge nach Impact × Pipedrive-Nähe. Jedes Feature = eigener Slice (plan → subagent-driven → review → merge), wie bei den Deploy-Config-Modulen. Aufteilung **Core** (Frontend + Metadaten/Backend) vs **App** (Logic-Functions + AI-Agents + Skills).

## 1. Pipeline-Semantik (Core) — höchste Priorität
Der Pipedrive-Kern; Twentys schwächste Stelle.
- **Won/Lost-Lifecycle**: Opportunity-Status (Open/Won/Lost) + **lost-reasons** + win-rate.
- **Stage-Probability**: Prozent pro Stage (Stage-Metadaten).
- **Rotting**: „idle seit X Tagen" → Warn-Indikator auf Card (Feld + View-Logik).
- **Days-in-stage**: Stage-Wechsel-Historie → Progress-Bar auf Deal-Detail (nutzt Phase-1b-ProgressBar).
- **Forecast-View**: Umsatz nach Close-Date (neuer View-Typ).
- **Board-Drag-Aktionen**: Ziehen → Won/Lost/Move-Bar (Board-Interaktion).

## 2. Insights / Reporting (Core, Dashboards-Erweiterung)
- Report-Typen: **Conversion-Funnel**, **Win/Loss**, Performance, Activities-status.
- **Goals/Targets**: neues Objekt + Tracking (z.B. „Deals added / Revenue won" pro Owner/Zeitraum).
- Widget-Dashboards ausbauen: mehr Widget-Typen, **Sharing**, Export.
- **AI-Report**: AI-Chatbot kann Daten; Report-Ausgabe als speicherbares Widget.

## 3. Activities (Core)
- **Typed Activities**: Activity-Objekt mit Typen (Call/Meeting/Task/Deadline/Email/Lunch, custom) — Twenty hat nur Tasks.
- **Calendar-Grid-View** (Woche/Tag) + Liste, Calendar-Sync nutzen.
- **Meeting-Scheduler** (Free/Busy-Link) — Core oder App.
- **Focus/Next-action**-Surfacing auf Record-Detail (Phase-1c-Layout).

## 4. Sales-Inbox + Leads + LeadBooster
- **Leads** (Core): eigenes Objekt + **Leads-Inbox**-View (Labels, Source-origin, Next-activity).
- **Sales-Inbox** (Core): voller Email-Client über Message-Sync (Inbox/Drafts/Sent/Archive, Labels, Filter).
- **LeadBooster** (App): Web-Forms, Chatbot, Prospector/Enrichment als Apps/Logic-Functions.

## 5. Sequences / Campaigns
- **Email-Sequences/Cadences** (App/Skill oder Core): Sequence-Engine auf Workflow-Basis (Delay + Send-Email-Actions gibt es schon).
- **Templates + Merge-fields**-UI (Core-FE): Compose-Erweiterung.
- **Email-Tracking** (Core): open/click (Pixel/Link-Wrap).
- **Campaigns** (App/Modul): Drag-Editor + Automated-campaigns + Tracking.

## 6. Deal-Ökonomie
- **Products / Line-Items** (Core): neues Objekt, an Deal gehängt.
- **ACV / ARR / MRR** (Core): Recurring-Felder + Aggregation.
- **Deal-Scoring** (App): AI-Agent-Workflow → Score-Feld + Badge-FE (Phase-1b-Badge).
- **Documents / Invoices** (App/Core): Doc-Gen (Twenty hat ein [Doc-Generator-Tutorial](https://docs.twenty.com/developers/extend/apps/tutorials/document-generator/ai-agent)) + Invoice-Tab.

## Core vs App — Faustregel
- **Core** (in Twenty-Monorepo, Metadaten/FE): alles was zur Grund-Sales-UX gehört und alle Kunden brauchen — Pipeline-Semantik, Insights, Activities, Leads, Sales-Inbox.
- **App/Skill** (Logic-Functions + AI-Agents, ggf. deploy-config-gated wie die Module): optionale/spezialisierte Add-ons — Enrichment, Scoring, Sequences, Campaigns, Doc-Gen, LeadBooster.

## Verbindung zu den Deploy-Config-Modulen
Neue optionale Features als **deploy-config-gated Module** ausrollen (Muster aus [docs/modular-crm](../modular-crm/18-OPERATOR-DEPLOY-CONFIG.md)): `IS_<FEATURE>_MODULE_ENABLED`, isEnvOnly, default true, pro Kunde beim Deploy setzbar. So bleibt „App pro Kunde deploybar, Module per Config" konsistent.
