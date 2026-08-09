# Target Capability Matrix (after modular-CRM)

The proposed end state. Every capability resolves through three independent gates: **Availability** (commercial/deployment, existing), **Workspace toggle** (new, per-workspace), **User permission** (existing role). Contrast with [TWENTY-CURRENT-FEATURE-MATRIX.md](TWENTY-CURRENT-FEATURE-MATRIX.md), where only ~5 Lab flags + object `isActive` were workspace-configurable.

Columns:
- **Commercial availability** — optional `BillingEntitlementKey`/config; blank = always available (SMB default).
- **Workspace toggle** — new per-workspace enable/disable via the capability layer.
- **User permission** — existing `PermissionFlagType` still governs the user.
- **Dependencies** — capabilities that must be enabled first (from [10](10-DEPENDENCIES.md)).
- **UI exposure** — where enabling/disabling changes the product.

| Capability | Commercial availability | Workspace toggle | User permission | Dependencies | UI exposure |
|---|---|---|---|---|---|
| **Contacts** (People) | always | **core — always on** | object perms | — | nav, records, search, command menu |
| **Companies** | always | **core — always on** | object perms | — | nav, records |
| **Deals** (Opportunities) | always | **core — always on** | object perms | Companies/Contacts (relations) | nav, pipeline board, records |
| **Activities** (Tasks/Notes) | always | **core — always on** | object perms | — | nav, record timeline, activities |
| **Dashboards** | always | optional (default on) | object perms + VIEWS | CRM records | nav, dashboard route/widgets |
| **Email** | config `MESSAGING_PROVIDER_*` | **optional (default on if available)** | CONNECTED_ACCOUNTS | Contacts | settings accounts, record emails, mail surfaces |
| **Calendar** | config `CALENDAR_PROVIDER_*` | **optional** | CONNECTED_ACCOUNTS | Activities | settings calendars, calendar view |
| **Automations** (Workflow) | always | **optional** | WORKFLOWS | CRM records | settings workflows, workflow routes/actions |
| **AI Assistant** | config `AI_PROVIDERS` | **optional** | AI, AI_SETTINGS | — | AI chat page/side panel, AI tools, settings AI |
| **Products / line items** | always | **optional (future)** | object perms | Deals | (future) nav, deal line items |
| **Leads** | always | **optional (future, likely not built)** | object perms | Contacts/Deals | (future) — see note |
| **Reports suite** | always | **optional (future)** | VIEWS | CRM records | (future) reports route/widgets |
| **Custom objects** | always | per-object (existing `isActive`) | DATA_MODEL + object perms | — | nav per object |
| **SSO** | `BillingEntitlementKey.SSO` (Enterprise) | availability-gated (not a workspace toggle) | SECURITY | — | settings security |
| **Custom domain** | `CUSTOM_DOMAIN` | availability-gated | WORKSPACE | — | settings domain |
| **Row-level security** | `RLS` | availability-gated | ROLES | Roles | settings roles |
| **Audit logs** | `AUDIT_LOGS` | availability-gated | SECURITY | — | settings logs |
| **Installed apps** | always | install/uninstall (existing app system) | APPLICATIONS | — | marketplace/apps |

Notes:
- **Core capabilities** (Contacts/Companies/Deals/Activities) are `isCore: true` in the catalog — the toggle is present but locked on; they can never be disabled (§25, [12](12-MODULE-CATALOG.md)).
- **Commercial entitlements (SSO/Custom domain/RLS/Audit logs)** are represented in the catalog as availability-only (Enterprise, `@license`). They are **not** workspace toggles — availability alone gates them, consuming `hasEntitlement`. Listed here to show the three-gate model is uniform even for commercial features.
- **Leads:** per [03-CONTACTS-LEADS in pipedrive-analysis], we recommend NOT introducing a separate Lead entity; model qualification as a pipeline stage. So "Leads" likely never becomes a capability — kept here only to mark the decision.
- **Future** capabilities (Products, Reports) are catalog-ready but not built — the point is they slot in without redesign (§37).

## Flexibility gained vs today

| Dimension | Today | Target |
|---|---|---|
| Workspace-configurable product areas | ~5 (Lab flags) + per-object `isActive` | full catalog of human-meaningful capabilities |
| One source of truth for "what does this workspace have" | none | capability catalog + per-workspace enabled set on `currentWorkspace` |
| Email/Calendar per-workspace | no (instance-global) | yes (workspace toggle atop instance availability) |
| Dependencies modeled | none | central catalog |
| Data-preserving disable | only via object `isActive` | yes, by construction (never deletes) |
| Future pricing mapping | ad-hoc (4 entitlements) | capability→entitlement in catalog; new plans add keys, no rewrite |
| Add a new module | edit many nav/route/guard sites | add one catalog entry + effects |
