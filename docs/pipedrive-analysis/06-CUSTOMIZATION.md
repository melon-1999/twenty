# 06 — Customization

OBSERVED (Settings) + DOCUMENTED.

## Custom fields (Data fields / Datenfelder) — OBSERVED

- Per-entity tabs: **Lead/Deal, Contact, Organization, Product** — each maintains its own custom fields.
- **Caps by plan** (OBSERVED label "1/100 custom fields used, incl. 0/10 formula fields"; caps are 30/100/300/500 by tier — DOCUMENTED).
- **Field types** (DOCUMENTED): text, large text, numeric, monetary, single-/multi-option (dropdown), date, time, date range, address, phone, org/person/user link, **formula fields**, autocomplete.
- Per field: mark **important**, add description, set position/grouping, required + pipeline-specific requirements (higher tiers), visibility/permissions.
- Fields are grouped into sections on the record page ("Summary", etc.).

## Pipelines & stages — OBSERVED / DOCUMENTED

- **Multiple pipelines**, each with an ordered set of **stages**; stages have names, order, **probability**, and **rotting thresholds**. Edited inline from the Deals view (edit pencil) rather than a settings URL.

## Activity types, currencies, lost reasons, labels — OBSERVED (Company settings tabs)

- **Activity types**: fully customizable list (icon, active/inactive).
- **Currencies**: multi-currency support.
- **Lost reasons**: a configurable list captured when a deal is marked Lost.
- **Labels**: colored labels/tags for deals/contacts.

## Views, columns, filters — OBSERVED

- **List column configuration** (per entity, via gear).
- **Saved filters** (per entity, user/shared) + ad-hoc "Add condition".
- View toggles (Kanban/List/Forecast for deals; List/Calendar for activities).

## Permissions & visibility — OBSERVED (Users & access)

- **Permission sets** (what a user can do) + **visibility groups** (what a user can see), configured separately for **Deals** and **Global**. Teams/team filters (Premium+). See [10-AUTH... n/a]; competitor mapping in [13](13-PIPEDRIVE-VS-TWENTY.md).

## How much customization small businesses actually need (INFERRED — opinionated)

For freelancers and 2–50-person teams, the **80/20 of customization** is:

1. **Rename/reorder pipeline stages** and have **more than one pipeline**.
2. **A handful of custom fields** on Deal and Contact (dropdowns, dates, numbers).
3. **Custom activity types** and **lost reasons**.
4. **Labels** and **saved filters/columns**.
5. **Simple role split** (admin vs member) + basic record visibility.

Everything beyond that (formula fields, pipeline-specific required fields, granular visibility groups, per-field permissions, 300–500 custom fields) is **enterprise-flavored complexity** most SMBs never touch and that adds cognitive load. A simpler competitor should expose the top-5 prominently and **hide or defer** the rest.

## Compared with Twenty's metadata architecture (INFERRED)

Twenty is **far more flexible** than Pipedrive here: it is a **metadata-driven platform** where objects, fields, relations, views, and layouts are all data, and users can create entirely **custom objects** (not just custom fields) with 25 field types incl. composites, plus per-object/field/row RBAC. Pipedrive only lets you customize within fixed entities (Deal/Person/Org/Product/Lead).

The strategic point: **Twenty's power is a liability for this segment unless hidden.** A Pipedrive competitor built on Twenty should:
- **Reuse** Twenty's custom-field + view engine (KEEP),
- **Pre-configure** the CRM objects (Deal/Person/Company/Activity) so users never see "create an object" (SIMPLIFY/HIDE),
- **Expose only the SMB-relevant customization** (stages, a few field types, activity types, lost reasons, labels, saved views) behind a friendly settings UI,
- **Hide** custom-object creation, the metadata engine, row-level predicates, and the full field-type zoo from default users (available to power users/admins only).

See [14-TWENTY-REUSE-MAP.md](14-TWENTY-REUSE-MAP.md) and [24 in codebase-analysis] for what's app-configurable vs core.

## Verified help-doc specifics (support.pipedrive.com, 2026-08)

- **16 custom field types**: Text, Large text, Single option (max 1000 options), Multiple options (max 1000), Autocomplete (255 chars), Numerical, Monetary (+ ISO currency subfield), User, Organization, Person, Phone (click-to-call), Time, Time Range, Date, Date Range, Address (Google Maps + subfields). Plus a **Formula field** (Premium+), **capped at 10/company**.
- **Entities**: custom fields on lead, deal, person, organization, product, project (+ limited on activity). **Deal and Lead custom fields are shared.** **No custom objects** — the object model is fixed on every plan (contrast: Twenty has custom objects).
- **Field caps**: officially only **Ultimate = 500** is documented; entry tier ~30, mid-tiers unconfirmed in primary sources (30/100/300/500 widely cited).
- **Important fields** (Growth+): highlight missing data, **don't block save**. **Required fields** (Premium+): **block save**. Both can be scoped **per pipeline and/or per stage** (Pipedrive's conditional-required form). **Pipeline-specific fields** (Premium+): hide a field on selected pipelines.
- **Read-only fields** (Premium+): per permission-set view-vs-edit. Access model = **permission sets** (actions) + **visibility groups** (records) + per-record "Visible to" override.
- Sources: `/article/what-types-of-custom-fields-are-there`, `/article/custom-fields-formula-fields`, `/article/data-fields-in-pipedrive`, `/article/permission-sets`, `/article/visibility-groups`.
