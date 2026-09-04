# Product Catalog (Slice A) — Design

Date: 2026-09-03
Status: approved (Slice A of the Products + Line Items feature; Slice B deferred to a follow-up cycle)

## Goal

Add a first-class **Product** standard object so the workspace has a product catalog. Users
manage products (name, price, code, description, active flag) through Twenty's standard object UI
(list, detail, create, edit) — which comes for free from the flat metadata. This is the
foundation for Slice B (opportunity line items that reference products and sum into a
"Positionssumme" field on the deal).

## Scope

### Slice A (this cycle)
- A new **visible** standard object `product` with fields name / price / code / description /
  isActive.
- Full flat-metadata registration so the object appears in navigation and gets generic
  list/detail/create/edit views.
- A workspace upgrade-version command that syncs the new object's metadata and creates its table
  in already-provisioned workspaces (new workspaces get it automatically).
- German labels (i18nLabel) for the object and its fields.

### Slice B (deferred, separate spec/plan)
- `opportunityLineItem` object (MANY_TO_ONE to opportunity + product, quantity, unitPrice).
- Opportunity gains a ONE_TO_MANY `lineItems` relation + a computed `lineItemsTotal`
  ("Positionssumme", CURRENCY, `isUIEditable: false`) recomputed by a listener + job on line-item
  change. `amount` stays manual and untouched (non-destructive — chosen in brainstorming).

## Architecture

This fork declares standard objects as **flat metadata** (no `@WorkspaceEntity` decorators):
stable universal-identifier UUIDs in `twenty-shared/src/metadata/`, and builders in
`twenty-server/.../twenty-standard-application/` that turn them into `FlatObjectMetadata` /
`FlatFieldMetadata`. The frontend renders objects generically from the metadata API, so **no
frontend code is required** — nav, list, detail, and field editors appear automatically.

### The object
- name `product`, plural `products`; labels "Produkt" / "Produkte"; icon `IconBox` (verify it is
  exported; else `IconShoppingCart`); visible (not `isSystem`); `labelIdentifierFieldMetadataName:
  'name'`; shown in the navigation sidebar.

### Fields (plus the automatic base system fields: id, createdAt, updatedAt, deletedAt, position, createdBy, updatedBy, searchVector)
- `name` — TEXT, the label identifier. German label "Name".
- `price` — CURRENCY (composite amountMicros/currencyCode). German label "Preis". The default
  price a line item will copy in Slice B.
- `code` — TEXT. German label "Artikelnummer".
- `description` — TEXT. German label "Beschreibung".
- `isActive` — BOOLEAN, default `true`. German label "Aktiv".

### Stable universal identifiers (mint once, never mutate)
- object `product`: `b305c282-2e30-4a15-a8ec-d763c677e21f`
- field `name`: `77b5fb4b-3d35-413c-b91d-961ffeb3b8f3`
- field `price`: `07b9ae40-22c9-4218-9a5e-128ecb5d5478`
- field `code`: `63c9d098-63e5-41c0-913c-29632c59e8d9`
- field `description`: `c6ca3ba5-f382-4b3b-8a4e-b61182ef7c66`
- field `isActive`: `63c5bc70-1f4b-48cf-a23f-7ee570570e23`

(Base system fields reuse `buildStandardObjectSystemFields(...)`, which derives their ids from the
object id — no manual ids for those.)

## Registration checklist (the ~13 touchpoints)

twenty-shared (`packages/twenty-shared/src/metadata/`):
1. `standard-object-universal-identifiers.constant.ts` — add the `product` object id.
2. `standard-object-fields.constant.ts` — add the `product` block (system fields via
   `buildStandardObjectSystemFields` + the 5 field universal identifiers). Mirror the `note` block.
3. `standard-object.constant.ts` — add the `STANDARD_OBJECTS.product` entry: universalIdentifier,
   fields, indexes, and the index view (via `buildStandardObjectIndexView`). Mirror `note`.

twenty-server (`.../twenty-standard-application/`):
4. `utils/object-metadata/create-standard-flat-object-metadata.util.ts` — add the `product`
   builder entry (labelSingular/Plural via i18n, icon, `isSystem: false`,
   `labelIdentifierFieldMetadataName: 'name'`). This map is exhaustive (`satisfies { [P in
   AllStandardObjectName]: … }`) — required to compile.
5. `utils/field-metadata/compute-product-standard-flat-field-metadata.util.ts` — new field
   builder returning all base + the 5 fields with `i18nLabel(msg\`…\`)` German labels, price as
   CURRENCY, isActive BOOLEAN default true. Mirror `compute-opportunity-standard-flat-field-metadata.util.ts`.
6. `utils/field-metadata/build-standard-flat-field-metadata-maps.util.ts` — register the builder
   (exhaustive map — required).
7. `constants/search-fields-by-standard-object-name.constant.ts` — add `product: ['name', 'code']`
   (exhaustive map — required).
8. Index builder: `utils/index/compute-product-standard-flat-index-metadata.util.ts` (+ register
   in `build-standard-flat-index-metadata-maps.util.ts`) if the object needs indexes (optional;
   include a name index).
9. View builders: `utils/view*/…` for the index (all-records) view + view fields, so the object is
   listable (mirror the note/opportunity view utils). Register in the corresponding
   `build-standard-flat-view-*` maps.
10. Page layout: `utils/page-layout-config/standard-product-page-layout.config.ts` + register in
    `constants/standard-page-layout.constant.ts` — so the record detail page has a layout.
11. Navigation: `constants/standard-navigation-menu-item.constant.ts` — add a "Produkte" nav entry
    referencing the product index view universal identifier.

Snapshots + build:
12. Regenerate the affected jest snapshots (`get-standard-object-metadata-related-entity-ids…snap`,
    and the page-layout related-entity-ids snapshot if a layout is added) with `jest -u`. The
    positional-id renumbering churn is expected/additive.
13. `npx nx build twenty-shared` + clear the vite cache.

## Upgrade command (the one hand-written migration)

`packages/twenty-server/src/database/commands/upgrade-version-command/2-37/` — a **workspace**
command (version 2.37.0) that, per active/suspended workspace, syncs the new standard object's
metadata and creates the `product` table in the workspace schema. Mirror how the existing
field-adding workspace commands (e.g. `2-35/…add-opportunity-lost-reason`) run
`validateBuildAndRunLegacyWorkspaceMigration` / the standard metadata sync, but for a whole new
object rather than a single field. Register it in the workspace-command provider +
`TWENTY_NEXT_VERSIONS`. Include `up` (create/sync) and, where the pattern supports it, a `down`.
New workspaces need nothing — they build the full standard app including `product`.

## Error handling / edge cases
- The object must compile against every exhaustive `satisfies` map (object builder, field builder
  map, search-fields) — a missing entry is a compile error caught by typecheck.
- The upgrade command must be idempotent (re-runnable): skip if the object/table already exists.
- `price` / CURRENCY needs a currency code; the standard CURRENCY field handles this via the
  workspace default, same as Opportunity `amount`.

## Testing
- typecheck twenty-server + twenty-shared (the exhaustive maps are the main safety net).
- Regenerated snapshots reviewed as additive (only the new product object's ids added; positional
  churn expected).
- Live-verify end-to-end: run the 2.37 upgrade command against the dev workspace → confirm (via
  Postgres MCP) the `product` table exists in the workspace schema with the expected columns and
  the object metadata rows are present; confirm "Produkte" appears in the app navigation and a
  product can be created/edited with all five fields through the standard UI.

## Non-goals / limitations
- No line items yet (Slice B).
- No product images / variants / categories (out of scope).
- Currency per product uses the workspace default currency (no per-product currency override
  beyond what the standard CURRENCY field provides).
- The upgrade command targets the fork's own instances; upstream multi-tenant scale is out of
  scope.
