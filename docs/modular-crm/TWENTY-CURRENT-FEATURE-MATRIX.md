# Twenty Current Feature Matrix (before modular-CRM changes)

How each capability is gated **today**, per the investigation. This is the baseline; the target state is in [TARGET-CAPABILITY-MATRIX.md](TARGET-CAPABILITY-MATRIX.md).

Columns:
- **Current availability** — always on / instance-config / commercial-entitlement / feature-flag.
- **Plan restriction** — tied to a `BillingEntitlementKey`/plan?
- **Workspace configurable?** — can a workspace admin turn it on/off today?
- **Feature flag?** — gated by a `FeatureFlagKey`?
- **Permission controlled?** — gated by a `PermissionFlagType`?
- **App controlled?** — delivered/owned by an application?

| Feature / Capability | Current availability | Plan restriction | Workspace configurable? | Feature flag? | Permission controlled? | App controlled? |
|---|---|---|---|---|---|---|
| People (Person) | always on | none | via object `isActive` (data-model) | no | object read/write perms | Standard app |
| Companies (Company) | always on | none | via object `isActive` | no | object perms | Standard app |
| Opportunities (Deals) | always on | none | via object `isActive` | no | object perms | Standard app |
| Tasks | always on | none | via object `isActive` | no | object perms | Standard app |
| Notes | always on | none | via object `isActive` | no | object perms | Standard app |
| Dashboards | always on | none | via object `isActive` | no | object perms | Standard app |
| Custom objects | always on | none | per object `isActive`; created via DATA_MODEL | no | DATA_MODEL + object perms | Custom app |
| Email / messaging sync | **instance-config** (`MESSAGING_PROVIDER_*_ENABLED`) | none | no (instance-global) | no | CONNECTED_ACCOUNTS (connect) | module (not app) |
| Calendar sync | **instance-config** (`CALENDAR_PROVIDER_*_ENABLED`) | none | no | no | CONNECTED_ACCOUNTS | module |
| IMAP/SMTP/CalDAV | instance-config (`IS_IMAP_SMTP_CALDAV_ENABLED`) | none | no | no | CONNECTED_ACCOUNTS | module |
| Email group/domain (campaigns) | feature-flag | none | **yes (admin flag)** | `IS_EMAIL_GROUP_ENABLED` | WORKSPACE (settings nav) | module |
| Automations (Workflow) | always on | none | no dedicated toggle | internal core-migration flags only | WORKFLOWS (settings) | module |
| AI chat page | feature-flag (Lab) | none | **yes (Lab)** | `IS_AI_CHAT_PAGE_ENABLED` | AI (tool) / AI_SETTINGS | module |
| AI (agents/tools) | always on (needs `AI_PROVIDERS`) | none | no | no | AI, AI_SETTINGS | module |
| List View | feature-flag (Lab) | none | **yes (Lab)** | `IS_LIST_VIEW_ENABLED` | no | — |
| Calendar day/week views | feature-flag (Lab) | none | **yes (Lab)** | `IS_CALENDAR_WEEK_VIEW_ENABLED` | no | — |
| Junction (m2m) relations | feature-flag (Lab) | none | **yes (Lab)** | `IS_JUNCTION_RELATIONS_ENABLED` | DATA_MODEL | — |
| Reports/Insights suite | **not present as a product** (dashboards only) | n/a | n/a | no | no | — |
| Products / line items | **not present** (no object) | n/a | n/a | no | n/a | — |
| Leads (inbox) | **not present** (no object) | n/a | n/a | no | n/a | — |
| SSO | **commercial entitlement** | `BillingEntitlementKey.SSO` (Enterprise) | no (subscription-driven) | no | SECURITY / SSO_BYPASS | — |
| Custom domain | **commercial entitlement** | `CUSTOM_DOMAIN` | no | no | WORKSPACE | — |
| Row-level security (RLS) | **commercial entitlement** | `RLS` | no | no | ROLES/SECURITY | — |
| Audit logs | **commercial entitlement** | `AUDIT_LOGS` | no | no | SECURITY | — |
| Billing/subscription UI | instance-config (`IS_BILLING_ENABLED`) | n/a | no | no | BILLING | — |
| Multi-workspace | instance-config (`IS_MULTIWORKSPACE_ENABLED`) | n/a | no | no | n/a | — |
| Maps / address autocomplete | instance-config + API key | none | no | no | no | module |
| Installed apps / marketplace | per-workspace install | none | **yes (install/uninstall)** | no | APPLICATIONS/MARKETPLACE_APPS | app system |
| API keys / webhooks | always on | none | no | no | API_KEYS_AND_WEBHOOKS | — |
| Roles & permissions | always on | RLS gated (Enterprise) | no | no | ROLES | — |
| Import / Export CSV | always on | none | no | no | IMPORT_CSV / EXPORT_CSV | — |

## Observations

1. **No unified "product module" axis.** Gating is spread across five unrelated mechanisms; there is no single "does workspace X have module Y" concept.
2. **Only a handful of things are workspace-configurable today:** the 5 Lab feature flags, object `isActive` (data-model level, not framed as "modules"), and app install/uninstall.
3. **Core CRM objects are always on** and only hideable object-by-object via `isActive`.
4. **Commercial gating is limited to 4 Enterprise entitlements** — none of which is a core SMB CRM capability.
5. **Email/Calendar are instance-global**, not per-workspace — a gap the capability layer will address (workspace enable on top of instance availability).
6. **Reports, Products, Leads do not exist as objects** — they are future capabilities, not present features to migrate.

These observations justify the thin coordinating layer in [02-ARCHITECTURE.md](02-ARCHITECTURE.md); the flexibility gain is quantified in [TARGET-CAPABILITY-MATRIX.md](TARGET-CAPABILITY-MATRIX.md).
