# 12 — Module (Capability) Catalog

The actual capability catalog derived from **real Twenty functionality** (not the prompt's examples). "Type" = classification from [11 in this doc set]. "Object-backed" = enable/disable via object `isActive`; "guarded" = via `@RequireCapability` + hook.

| Capability | Type | Category | Default | Can disable | Availability gate | Dependencies | Effect mechanism | Impl status |
|---|---|---|---|---|---|---|---|---|
| **Contacts** (Person) | Core CRM | CRM | on | **no (core)** | always | — | object `isActive` (locked) | not started |
| **Companies** (Company) | Core CRM | CRM | on | **no (core)** | always | — | object `isActive` (locked) | not started |
| **Deals** (Opportunity) | Core CRM | CRM | on | **no (core)** | always | Companies, Contacts | object `isActive` (locked) | not started |
| **Activities** (Task + Note) | Core CRM | CRM | on | **no (core)** | always | — | object `isActive` (locked) | not started |
| **Dashboards** | Optional | Insights | on | yes | always | CRM records | object-backed (`dashboard`) | not started |
| **Email** | Optional | Communication | on if available | yes | config `MESSAGING_PROVIDER_GMAIL/MICROSOFT_ENABLED` (any)¹ | Contacts | guarded (messaging module + settings nav + record surfaces) | done |
| **Calendar** | Optional | Communication | on if available | yes | config `CALENDAR_PROVIDER_GOOGLE/MICROSOFT_ENABLED` (any) | Activities | guarded (calendar module + settings + view) | not started |
| **Automations** | Optional | Automation | off (SMB default) | yes | always | CRM records | guarded (workflow module + settings + routes/actions) | not started |
| **AI Assistant** | Optional | AI | off | yes | config `AI_PROVIDERS` non-empty | — | guarded (AI chat page/side panel + tools + settings AI) | not started |
| **Custom objects** | Data-model | CRM | per object | per object (existing `isActive`) | always | — | existing object `isActive` (unchanged) | n/a (exists) |
| **Products / line items** | Optional (future) | CRM | off | yes | always | Deals | object-backed (new object, when built) | not built |
| **Reports suite** | Optional (future) | Insights | off | yes | always | CRM records | object-backed / guarded (when built) | not built |
| **Leads** | (decided out) | — | — | — | — | — | — | not building (use pipeline stage) |

## Commercial capabilities (availability-only, not workspace toggles)

These stay in the existing billing-entitlement path (Enterprise `@license`); represented in the catalog as availability-only so the three-gate model is uniform, but they have **no workspace enable/disable** (availability alone gates them):

| Capability | Entitlement | Notes |
|---|---|---|
| SSO | `BillingEntitlementKey.SSO` | consume `hasEntitlement` (unchanged) |
| Custom domain | `CUSTOM_DOMAIN` | unchanged |
| Row-level security | `RLS` | unchanged |
| Audit logs | `AUDIT_LOGS` | unchanged |

## Not capabilities (core infrastructure / internal — never optional)

Auth, workspaces, metadata engine, twenty-orm, GraphQL/REST API, permission infrastructure, background jobs, app shell, search, files/attachments, timeline, notifications, connected-account plumbing. These are always present; making them optional would break the product. (§11, §25)

## Category grouping (for the Settings UI, [13](13-SETTINGS-UX.md))

- **CRM:** Contacts, Companies, Deals, Activities (all core, shown as always-on), Dashboards.
- **Communication:** Email, Calendar.
- **Automation:** Automations.
- **AI:** AI Assistant.
- **Insights:** Dashboards, (future) Reports.
- **Advanced / commercial:** SSO, Custom domain, RLS, Audit logs (availability-gated, not toggles).

## Notes on derivation

- Only capabilities backed by **real Twenty functionality** are included. **Products, Reports, Leads are marked future/not-built** because there is no corresponding object/module in Twenty today ([TWENTY-CURRENT-FEATURE-MATRIX.md](TWENTY-CURRENT-FEATURE-MATRIX.md)).
- **Activities** groups Task + Note (one user-facing capability, two objects) — an example of catalog grouping to avoid over-modularization (§12).
- Defaults reflect the SMB product goal: minimal core on; Automations/AI off by default (opt-in); Email/Calendar on when the instance provides them; Dashboards on.
- The `Impl status` column is duplicated/maintained in [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md).
- ¹ As shipped, Email's availability gate is the single deploy-config flag `IS_EMAIL_MODULE_ENABLED` (`isEnvOnly`, default `true`), not the provider-specific flags listed above — see [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md#pivot-deploy-config-availability-model-branch-featdeploy-config-module-provisioning) and [the deploy-config design spec](../superpowers/specs/2026-08-11-deploy-config-module-provisioning-design.md). The accepted shared-plumbing limitation (Accounts/OAuth/ChannelSync left reachable so Calendar is unaffected) is documented there.
