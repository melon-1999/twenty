# 04 — Plans & Entitlements

How commercial plans interact with capabilities. Principle (§6): **the capability layer must not depend on pricing.** Availability is a separate, optional gate.

## What Twenty has (reuse, do not modify)

- **Plans:** `BillingPlanKey` = PRO, ENTERPRISE (Stripe `subscription.metadata.plan`). Prices Stripe-synced.
- **Entitlements:** `BillingEntitlementKey` = SSO, CUSTOM_DOMAIN, RLS, AUDIT_LOGS — per-workspace booleans (`core.billingEntitlement`), Stripe-synced via webhook.
- **Resolution:** `BillingService.hasEntitlement(ws, key)` — **true when `IS_BILLING_ENABLED=false`** (self-hosted). All billing/enterprise code is `@license Enterprise`.

## How capabilities reference entitlements

A catalog entry may set `availability.entitlementKey`. The availability resolver calls the existing `hasEntitlement`. Most SMB capabilities set **no** entitlement (freely available). This keeps modules pricing-independent while allowing a capability to become commercially gated by adding one field — no capability-layer change.

```
available(ws, cap) = (!entitlementKey || billing.hasEntitlement(ws, entitlementKey))
                  && configFlags.every(f => clientConfig[f])
```

## Mapping future plans to capabilities (illustrative, not implemented — §21)

A future plan defines a set of entitlement keys; capabilities reference them:

```
Plan "Sales"  → entitlements { EMAIL_CAP, CALENDAR_CAP }
Plan "Pro"    → + { AUTOMATIONS_CAP, REPORTS_CAP }
Plan "AI"     → + { AI_CAP }
```

To add such plans later: (1) add entitlement keys to `BillingEntitlementKey` + Stripe, (2) set `availability.entitlementKey` on the relevant catalog entries. **No rewrite** of the capability layer. The workspace still separately *enables* an available capability.

> These plan names/contents are examples. We do **not** redesign pricing now. The current 2-plan/4-entitlement model stays; the architecture is merely ready for more.

## Self-hosted / internal / testing

- `IS_BILLING_ENABLED=false` ⇒ `hasEntitlement` returns true ⇒ every entitlement-gated capability is **available** (still subject to workspace enable + user permission). This is the desired self-hosted behavior (all capabilities available, workspace decides).
- Cloud: entitlements come from Stripe as today.
- Note the existing asymmetry (frontend entitlement list requires an enterprise validity token while backend `hasEntitlement` does not) — the availability resolver should use the backend rule consistently and not surface the enterprise-token requirement for non-commercial capabilities.

## What we do NOT do

- We do **not** move plan logic into the capability layer.
- We do **not** create new entitlement keys now.
- We do **not** touch `@license Enterprise` billing files — consume `hasEntitlement` only.

See [21 relationship in TARGET-CAPABILITY-MATRIX] and [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) "Plan relationship".
