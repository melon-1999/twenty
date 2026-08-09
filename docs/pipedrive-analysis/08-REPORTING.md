# 08 — Reporting (Insights)

OBSERVED (Insights view) + DOCUMENTED (help pages).

## Insights structure — OBSERVED

- Left nav: **Dashboards** (custom, drag-resize widgets), **Goals**, **Reports** (with a plan **cap**, OBSERVED "0/50"). AI-generated reports offered ("AI" badge; create a report from a text prompt).
- Empty by default; you build dashboards from report widgets.

## Report types — DOCUMENTED

Every report is **Performance** (volume/outcomes) or **Conversion** (movement/rates):

| Report | Measures | Gate |
|---|---|---|
| Deal Performance | won/lost/open, sales performance | all plans |
| Deal Conversion | movement + conversion rates | all plans |
| Deal Duration | time in each stage (bottlenecks) | all plans |
| Deal Progress | movement over time | all plans |
| Deal Products | product performance | all plans |
| **Deal Revenue Forecast** | expected future revenue | **Premium+** |
| Activities Performance | activity volume/outcomes | all plans |
| Emails Performance | emails sent/received | all plans |
| Lead Performance/Conversion | leads by status/source; lead→deal | all plans |
| People / Organizations | contact/company trends | all plans |
| Campaign Performance/Conversion | email campaign metrics | Campaigns add-on |
| Project Performance/Duration | project throughput | Premium+/Projects |

## Forecast, goals, dashboards — DOCUMENTED

- **Revenue forecast**: open deals by expected close date, won by actual date; cumulative/regular; Y-axis = value / **weighted value** / custom monetary field; excludes lost. (The Deals **Forecast view** is the operational version of this — OBSERVED.)
- **Goals**: Deal / Activity / Forecast goals, by count or value, weekly/monthly/quarterly/yearly, individual/team/company (team goals Premium+).
- **Dashboards**: filters + visual builder (measure-by / group-by / segment-by) + table; shareable; **public view-only links**. Custom-field filtering and **additional dashboards** require Premium+; report/dashboard counts capped by plan (OBSERVED "0/50").

## Minimum credible reporting for an SMB CRM (INFERRED)

The **must-have floor** (all in Pipedrive's all-plans tier — validating the split):
1. **Pipeline value by stage** (funnel) + open/won/lost over a period.
2. **Win rate / conversion**.
3. **Activities logged & completed** (are reps working?).
4. **A simple revenue forecast** (weighted pipeline by month) — the OBSERVED Forecast view already delivers this.
5. **One dashboard** with date/owner/pipeline filters + simple period **goals**.

**Advanced/upsell layer** (defer or premium): custom-field slicing, multiple dashboards, historical trend/deal-movement, team goals, project/campaign analytics, AI-generated reports.

Complaint signal ([11](11-USER-COMPLAINTS.md)): Pipedrive reporting is seen as **shallow at the bottom and gated above** — no native MRR/ARR, can't combine deal+activity+contact in one report, custom-field reporting locked. **Opportunity**: give the must-have floor **out of the box for free**, plus MRR/ARR and cross-object reports without a tier wall.

## Compared with Twenty (INFERRED — from codebase-analysis)

Twenty has **Dashboards** (recent), a metadata/GraphQL foundation ideal for building reports over records, and ClickHouse for analytics — but **does not ship a Pipedrive-equivalent sales-report suite** (win-rate, funnel, forecast, activity, goals) as pre-built templates. This is a **NEEDS EXTENSION / partially available** area: reuse Twenty's dashboard + data layer, but build the standard sales reports (funnel, win rate, weighted forecast, activity, simple goals) as first-class, pre-configured widgets. Natural-language reporting via Twenty's AI is a differentiator ([16](16-COMPETITIVE-OPPORTUNITIES.md)). See [13](13-PIPEDRIVE-VS-TWENTY.md), [14](14-TWENTY-REUSE-MAP.md).
