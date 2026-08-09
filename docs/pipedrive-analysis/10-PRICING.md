# 10 — Pricing / Plans

**Date checked: 2026-08-09.** Tier names and headline per-seat prices are **OBSERVED first-hand** from `pipedrive.com/en/pricing` (retrieved via Firecrawl; screenshot `screenshots/07-pricing.png`). The per-tier feature-limit table further down (automation counts, custom-field caps, etc.) is **corroborated from third-party sources** (Forbes Advisor, G2, CheckThat.ai, Costbench, EmailToolTester, Softbliq, NetHunt) since the live page lists features narratively, not as exact caps. Snapshot may change; re-verify before quoting.

## Structural change: 5 tiers → 4 tiers

Pipedrive appears to have migrated (late 2025) from the legacy **Essential / Advanced / Professional / Power / Enterprise** to a **4-tier Lite / Growth / Premium / Ultimate** structure. Some review sites and grandfathered accounts still show the old names — mild residual uncertainty on exact naming.

## Current plans (per seat)

Annual per-seat/mo prices are OBSERVED from the live page (2026-08-09):

| Plan | Annual (per seat/mo) | Annual total/seat | Positioned for |
|------|:---:|:---:|----------------|
| **Lite** | **$14** | $168/yr | Solo / freelancers |
| **Growth** | **$39** | $468/yr | Small teams (3–15) |
| **Premium** (Most Popular) | **$59** | $708/yr | Growing teams (10–50) |
| **Ultimate** | **$79** | $948/yr | Regulated / larger teams |

- **No free plan** (unlike HubSpot/Zoho). 14-day trial, no credit card, on all tiers.
- Billed annually saves "up to 42%" vs monthly (monthly is materially more per seat).
- Live page positioning: Lite = "organize sales in one simple workspace" (now includes AI report creation + real-time sales feed + 500+ integrations); Growth adds full 2-way email sync + tracking, automations + nurture sequences, subscriptions + forecast reports, meeting scheduler; Premium adds LeadBooster lead-gen + routing, custom scoring + data enrichment, AI email tools + shared team inboxes, e-signatures, enhanced customization/permissions; Ultimate adds security rules/alerts, phone+email enrichment, sandbox, extended phone support.

## Feature gating (what drives upsell)

| Feature / limit | Lite | Growth | Premium | Ultimate |
|---|---|---|---|---|
| Email sync | One-way (Smart BCC) | **Two-way** | Two-way | Two-way |
| Automation workflows | none | 50 | 150 | 250 |
| If/Else conditions per workflow | — | 3 | 10 | 20 |
| Email sequences | ✗ | 5 | 25 | 50 |
| Custom fields (per entity) | 30 | 100 | 300 | 500 |
| Leads+deals limit | 2,500×seats | 5,000×seats | 15,000×seats | 20,000×seats |
| AI lead/deal scoring | ✗ | ✗ | ✓ | ✓ |
| Shared team inbox | ✗ | ✗ | 1 | 5 |
| Teams & permissions | ✗ | ✗ | 15 teams | 25 teams |
| Audit logs / sandbox / adv. security | ✗ | ✗ | ✗ | ✓ |

**BASIC (Lite):** visual pipeline, contact/lead management, one-way email, mobile, basic AI reports, 500+ integrations, 30 custom fields. **No automation, no two-way email.** Effectively a demo tier.

**Functional floor (Growth):** two-way email sync, automation (50), sequences, meeting scheduler, forecast reports. Most businesses must buy Growth to operate — a common complaint (the 3× jump from Lite).

**Advanced upsell (Premium → Ultimate):** automation caps (50→150→250, branching 3→10→20), AI scoring + enrichment credits, teams/permissions/shared inboxes, deeper + custom-field reporting, security/compliance (Ultimate).

## Paid add-ons (billed separately, mostly per company)

| Add-on | Price (approx) | Notes |
|---|---|---|
| **LeadBooster** (chatbot, live chat, web forms, prospector) | ~$32–39/mo | Included in Premium & Ultimate |
| **Smart Docs** (templates, e-sign) | ~$32.50/mo | Included in Premium & Ultimate |
| **Projects** (post-sale) | ~$6.70/user/mo | Included in Premium & Ultimate |
| **Campaigns** (email marketing) | from ~$16/mo (usage) | **Not included on any tier** |
| **Web Visitors** (site visitor ID) | ~$41–299/mo | **Not included on any tier** |

**Real cost inflation:** cited examples — 5-person Growth + LeadBooster ≈ $390/mo; Zapier (often needed for real automation) adds $20–69/mo. The base per-seat price understates true cost once add-ons stack.

## Implication for our product

The clearest wedge is **transparent, inclusive pricing**: fold email sync, basic automation, and basic reporting into the entry tier instead of gating them, and avoid add-on stacking. Pipedrive's own gating validates the split (pipeline+contacts+activities = table stakes; automation + forecasting + custom-field reporting + teams = the natural paywall). See [16-COMPETITIVE-OPPORTUNITIES.md](16-COMPETITIVE-OPPORTUNITIES.md).

Sources: Forbes Advisor, G2, CheckThat.ai (2026-04), Costbench (2026-06), EmailToolTester, Softbliq, NetHunt, Vendr, MarketBetter — see `11-USER-COMPLAINTS.md` for links.
