# Pipedrive Feature-Map (Referenz)

Surface für Surface, aus Mobbin (Pipedrive, web). Jeder Screen verlinkt zur Mobbin-Quelle.

## Globales Layout / Shell
- Linke **Icon-Rail** (navy): Deals, Leads, Contacts, Projects, Campaigns, Insights, Mail, mehr.
- Top-Bar: globale Suche ("Search Pipedrive"), **AI chat**-Button, `+`-Quick-Add, Notifications, Account.
- Primär-CTA durchgehend **grün** ("+ Deal", "New email", "Save changes").
- Light + Dark Theme.
- Trial-Banner oben.

## Pipeline / Deals
- [Deals Kanban](https://mobbin.com/screens/fa0efe82-ea90-4864-ae99-ca3dd822c77b) · [dunkel/viele Deals](https://mobbin.com/screens/d6a35754-24af-4141-8868-8961be576a9b)
- View-Switcher: **Kanban / Liste / Forecast / weitere**.
- Stage-Spalten mit **Header: Summe + Deal-Count** (z.B. "$109,340 · 12 deals").
- Deal-Card: Titel, Org, Person, **$-Wert**, **Rotting-Warnung** (⚠️ zu lange idle), Aktivitäts-Indikator.
- [Drag-Aktionsleiste](https://mobbin.com/screens/bb14ee04-5a09-488b-9b92-ab95e36860e0): beim Ziehen unten **Delete / Lost / Won / Move to**.
- [Stage-Editor](https://mobbin.com/screens/baeba489-cd0a-4a2b-950a-f677e7fc5db7): pro Stage **Probability %**, **Rotting in days**, Add/Delete stage, Deal-probability-Toggle.
- [Onboarding-Wizard](https://mobbin.com/screens/dbf8ef9b-5248-4c56-b588-f9061a77077d): Contacts → Activities → Deals Stepper.

## Deal-Detail
- [Deal page](https://mobbin.com/screens/79bfc260-531b-4cd9-bc7e-7764d1fc5b30) · [Archive-Flow](https://mobbin.com/screens/0be04495-008e-4fa4-bbad-6ed49b9f470e)
- Oben: **Stage-Progress-Bar** (Tage-in-Stage, farbige Segmente), **Won / Lost**-Buttons, Follower-Selektor, Owner.
- Summary-Sidebar: **Scores** (KI-Wahrscheinlichkeit), Value, **ACV / ARR / MRR** (Recurring), verlinkte Org+Person, Labels, Close-Date, **Add sequence**, collapsible Details/Source/Person/Organization/**Products**.
- Zentrum-Tabs: **Activity / Notes / Call / Email / Files / Documents / Invoice**.
- **Focus-Panel**: geplante Aktivitäten, pinned notes, Email-Drafts.
- **History**-Timeline: All/Activities/Notes/Emails/Files/Documents/Invoices/**Changelog** (feldgenaue Audit-History: Stage/Status/Value-Änderungen).
- Archive vs Delete (mit Erklärung; archivierte Items aus Pipeline raus, in Reports drin).

## Contacts / Organizations + In-App-Email
- [Org detail + Composer](https://mobbin.com/screens/648d7d1f-8613-4474-8276-1a3007976b7f)
- People / Organizations / Contacts-timeline / Merge-duplicates.
- Org-Felder: Website, LinkedIn, Industry, Annual revenue, # employees; **"enrich data"** (Auto-Fill).
- Open-deals-Liste mit Mini-Stage-Progress-Bars.
- **Email-Composer inline**: From/To/Cc/Bcc, **Choose template**, **Insert field** (Merge), **Meeting scheduler**, **Write my email** (KI), Rich-Text-Toolbar, **Send** + Schedule-Dropdown.

## Insights / Reporting
- [Funnel-Report](https://mobbin.com/screens/4da10f16-370a-44ad-9c53-ccaff0346bc9) · [Custom-Dashboard](https://mobbin.com/screens/bc43c3fe-0322-4cab-beb0-4deeb9758fe6) · [AI-Report-Builder](https://mobbin.com/screens/e78364da-59f7-421b-8a57-868d58daad99)
- Linke Struktur: **Dashboards / Goals / Reports**.
- Report-Typen: **Conversion-Funnel**, **Win/Loss**, Performance, Activities-status, Deals-status-by-pipeline, Deals-won-revenue, Pipeline-health.
- **Goals** (Targets, z.B. "Deals added").
- **Custom-Dashboards**: Widgets (Pie/Bar/KPI-Tiles), Custom-Period, Owner-Filter, **teilbar** ("Dashboard sharing updated"), Export.
- **AI-Report-Generation**: "Generate report" (AI) + konversationell ("How many deals this year?" → KI baut+summarized Report).

## Leads + Sales-Inbox + LeadBooster
- [Leads Inbox](https://mobbin.com/screens/45d9181e-ad36-4146-91ea-93ce49aef464) · [Sales Inbox](https://mobbin.com/screens/9f7f7509-c104-4490-9995-46071e539830)
- **Leads Inbox**: eigene Pre-Deal-Entity. Spalten: Title, Next-activity, **Labels** (COLD-Pill), **Source origin** (Web-Forms/Chatbot/Manually-created), Owner. Label-/Owner-/Custom-Filter.
- **LeadBooster**: Live-Chat, **Chatbot**, **Web-Forms**, **Prospector**. Add-ons: **Web-Visitors**. Integrations: Messaging, LinkedIn ("Add + enrich LinkedIn leads").
- **Sales-Inbox**: voller **Email-Client** im CRM — Inbox/Drafts/Outbox/Sent/Archive, Labels (mit Farbe), Filters, "New email".

## Activities
- [Activities Calendar](https://mobbin.com/screens/9e219426-d2b0-476e-a477-50530f66d776) · [Schedule-Modal](https://mobbin.com/screens/87ef0162-1ef4-4d9d-9c9d-c4d62334f219)
- Views: **Liste / Calendar-Grid** (Woche). Calendar-Sync (SYNC-Badge). **Meeting-Scheduler**-Dropdown.
- **Typed Activities**: Call / Meeting / Task / Deadline / Email / Lunch (Farb-Typen, custom).
- **Schedule-Modal**: Typ-Picker, Datum/Zeit-Range, **Priority**, add location/video-call/description, **Free/Busy**, Notes, Owner, verlinkt Deal/Lead/People/Org, "Mark as done", Mini-Tages-Preview.

## Campaigns (Email-Marketing)
- [Campaign-Builder](https://mobbin.com/screens/d3cc372a-5fe6-48aa-979d-e0bfff4879ec) · [Content-Editor Rows](https://mobbin.com/screens/638a2296-7814-4e7f-bb54-9068e8b1a22d) · [Content-Blocks](https://mobbin.com/screens/d6b97b83-341b-4031-b67c-48208d1d5243)
- **Email-Campaigns / Automated-campaigns / Email-templates**.
- Builder: Subject, Preview-text, **Merge-tags**, Content (create-new/Templates/**HTML-editor**), **Sending-time** (immediate/scheduled), **Engagement: Tracking** (open/click), Subscriber-Limits.
- **Drag-Drop-Content-Editor**: Blocks (Title/Paragraph/List/Image/Button/Divider/Social/HTML/Video/Icons/Menu), Row-Layouts, Save-as-template, Desktop/Mobile-Preview.

## Visuelle Sprache (Zusammenfassung)
- Dicht, funktional, tabellen-/card-lastig; navy Rail, weißer Canvas, **grüner Primary**, farbige Stage-Header, Status-Pills, Progress-Bars, viele Inline-Aktionen (⋯-Menüs), Warn-Icons.
