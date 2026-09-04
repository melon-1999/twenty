# Product Catalog (Slice A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a visible `product` standard object (name/price/code/description/isActive) so the workspace has a product catalog, usable through Twenty's generic object UI.

**Architecture:** This fork declares standard objects as flat metadata (no decorators): universal-identifier UUIDs in `twenty-shared/src/metadata/`, builder maps in `twenty-server/.../twenty-standard-application/`. The frontend renders the object generically from the metadata API (nav/list/detail/editors are free). Existing workspaces get the new object via a version-2.37 workspace upgrade command that runs `validateBuildAndRunLegacyWorkspaceMigration` to create the table + metadata. The whole feature mirrors the existing visible `company` object across each registration file.

**Tech Stack:** TypeScript flat-metadata, Lingui i18nLabel, nest-commander (upgrade command), Jest snapshots.

## Global Constraints

- No signatures / Co-Authored-By / "Generated with Claude" anywhere.
- Never modify `/* @license Enterprise */` files.
- Named exports; types over interfaces; no `any`.
- The object mirrors `company` (a simple visible object). In every registration file, find company's entry and produce the parallel `product` entry with the values below. The exhaustive `satisfies { [P in AllStandardObjectName]: … }` maps make a missing entry a compile error — `npx nx typecheck twenty-server` is the primary safety net; run it after each server task.
- **Stable universal identifiers (use verbatim, never change):** object `product` = `b305c282-2e30-4a15-a8ec-d763c677e21f`; field `name` = `77b5fb4b-3d35-413c-b91d-961ffeb3b8f3`; `price` = `07b9ae40-22c9-4218-9a5e-128ecb5d5478`; `code` = `63c9d098-63e5-41c0-913c-29632c59e8d9`; `description` = `c6ca3ba5-f382-4b3b-8a4e-b61182ef7c66`; `isActive` = `63c5bc70-1f4b-48cf-a23f-7ee570570e23`. Base system fields (id/createdAt/updatedAt/deletedAt/position/createdBy/updatedBy/searchVector) derive their ids from the object id via `buildStandardObjectSystemFields(...)` — no manual ids.
- Object: nameSingular `product`, namePlural `products`, labels `i18nLabel(msg\`Produkt\`)` / `i18nLabel(msg\`Produkte\`)`, description `i18nLabel(msg\`Ein Produkt\`)`, icon `IconBox` (verify exported in the icon set; else `IconShoppingCart`), `isSystem: false`, `labelIdentifierFieldMetadataName: 'name'`.
- Fields (German i18nLabel): `name` TEXT "Name", `price` CURRENCY "Preis", `code` TEXT "Artikelnummer", `description` TEXT "Beschreibung", `isActive` BOOLEAN default true "Aktiv".
- After any twenty-shared change: `npx nx build twenty-shared` + `rm -rf packages/twenty-front/node_modules/.vite`.
- Do NOT run `database:reset`. Dev workspace id `03655638-583c-49b0-82f0-b4583bffaa1e`, schema `workspace_78jtyayrql5p8djgplk9x6vy`.

---

## Reference object: `company`

`company` is the object to mirror. Its files (find company's block in each):
- `packages/twenty-shared/src/metadata/constants/standard-object-universal-identifiers.constant.ts`
- `packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts`
- `packages/twenty-shared/src/metadata/constants/standard-object.constant.ts`
- `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/object-metadata/create-standard-flat-object-metadata.util.ts` (company at ~:195)
- `.../utils/field-metadata/compute-company-standard-flat-field-metadata.util.ts`
- `.../utils/field-metadata/build-standard-flat-field-metadata-maps.util.ts`
- `packages/twenty-shared/src/metadata/constants/search-fields-by-standard-object-name.constant.ts`
- `.../utils/index/…` + `build-standard-flat-index-metadata-maps.util.ts`
- `.../utils/view*/…` + `build-standard-flat-view-*-maps.util.ts`
- `.../constants/standard-page-layout.constant.ts` + `utils/page-layout-config/…`
- `.../constants/standard-navigation-menu-item.constant.ts`

---

## Task 1: twenty-shared registration

**Files (all under `packages/twenty-shared/src/metadata/constants/`):**
- Modify: `standard-object-universal-identifiers.constant.ts`
- Modify: `standard-object-fields.constant.ts`
- Modify: `standard-object.constant.ts`

**Interfaces:**
- Produces: `STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.product`, `STANDARD_OBJECT_FIELDS.product` (with the 5 field universal identifiers + system fields), `STANDARD_OBJECTS.product` (universalIdentifier + fields + indexes + index view). These are consumed by every later task.

- [ ] **Step 1: object universal identifier**

In `standard-object-universal-identifiers.constant.ts`, add (alongside `company`):
```typescript
  product: 'b305c282-2e30-4a15-a8ec-d763c677e21f',
```

- [ ] **Step 2: STANDARD_OBJECT_FIELDS.product**

In `standard-object-fields.constant.ts`, find the `company:` block and add a parallel `product:` block. Use `buildStandardObjectSystemFields(STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.product)` for the base fields (copy company's exact call), then add the 5 field universal identifiers:
```typescript
  product: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.product,
    ),
    name: { universalIdentifier: '77b5fb4b-3d35-413c-b91d-961ffeb3b8f3' },
    price: { universalIdentifier: '07b9ae40-22c9-4218-9a5e-128ecb5d5478' },
    code: { universalIdentifier: '63c9d098-63e5-41c0-913c-29632c59e8d9' },
    description: {
      universalIdentifier: 'c6ca3ba5-f382-4b3b-8a4e-b61182ef7c66',
    },
    isActive: { universalIdentifier: '63c5bc70-1f4b-48cf-a23f-7ee570570e23' },
  },
```
(Match the exact shape company uses for its non-relation fields — if company's fields use a different wrapper, mirror it. Non-relation scalar fields typically just carry `{ universalIdentifier }`.)

- [ ] **Step 3: STANDARD_OBJECTS.product**

In `standard-object.constant.ts`, find the `company:` entry (`STANDARD_OBJECTS.company`) and add a parallel `product:` entry: `universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.product`, `fields: STANDARD_OBJECT_FIELDS.product`, `indexes` (mirror company — at minimum the searchVector index; add a `name` index if company has an analogous label-identifier index), and `views` built via `buildStandardObjectIndexView(...)` exactly as company does (this declares the "all products" index view + its universal identifier). Keep the `as const satisfies …` at the end of the file valid.

- [ ] **Step 4: Build shared + typecheck**

Run: `npx nx build twenty-shared` → succeeds. `npx nx typecheck twenty-shared` → 0. (A shape mismatch in the `as const satisfies` maps fails here.)

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-shared/src/metadata/constants/standard-object-universal-identifiers.constant.ts packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts packages/twenty-shared/src/metadata/constants/standard-object.constant.ts
git commit -m "feat(shared): product standard object universal identifiers + registry"
```

---

## Task 2: Server object + field builders

**Files (under `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/`):**
- Modify: `utils/object-metadata/create-standard-flat-object-metadata.util.ts`
- Create: `utils/field-metadata/compute-product-standard-flat-field-metadata.util.ts`
- Modify: `utils/field-metadata/build-standard-flat-field-metadata-maps.util.ts`
- Modify: `packages/twenty-shared/src/metadata/constants/search-fields-by-standard-object-name.constant.ts`

**Interfaces:**
- Consumes: `STANDARD_OBJECTS.product` (Task 1).
- Produces: `buildProductStandardFlatFieldMetadatas` registered so the flat maps include `product` + its fields.

- [ ] **Step 1: Object builder entry**

In `create-standard-flat-object-metadata.util.ts`, find the `company: (...) => createStandardObjectFlatMetadata({...})` entry (~:195) and add a parallel `product:` entry:
```typescript
  product: ({
    context,
    ...rest
  }: Omit<CreateStandardObjectArgs<'product'>, 'context' | 'objectName'>) =>
    createStandardObjectFlatMetadata({
      objectName: 'product',
      // mirror company's remaining args exactly (context spread, standardObjectMetadataRelatedEntityIds, etc.)
      ...rest,
      context: {
        ...context,
        universalIdentifier: STANDARD_OBJECTS.product.universalIdentifier,
        nameSingular: 'product',
        namePlural: 'products',
        labelSingular: i18nLabel(msg`Produkt`),
        labelPlural: i18nLabel(msg`Produkte`),
        description: i18nLabel(msg`Ein Produkt`),
        icon: 'IconBox',
        isSystem: false,
        labelIdentifierFieldMetadataName: 'name',
      },
    }),
```
Copy the exact arg-destructuring + `createStandardObjectFlatMetadata` call shape company uses (the surrounding fields like `standardObjectMetadataRelatedEntityIds`); only the context values above are product-specific. If `IconBox` is not a valid icon string, use `IconShoppingCart`.

- [ ] **Step 2: Field builder util**

Create `compute-product-standard-flat-field-metadata.util.ts` mirroring `compute-company-standard-flat-field-metadata.util.ts`. Copy company's **base system fields block verbatim** (id, createdAt, updatedAt, deletedAt, position, createdBy, updatedBy, searchVector) — swapping the `'company'` type param for `'product'` in the signature. Then replace company's own fields with these five product fields (each via `createStandardFieldFlatMetadata({ objectName, workspaceId, context: {...}, standardObjectMetadataRelatedEntityIds, dependencyFlatEntityMaps, twentyStandardApplicationId, now })`):

```typescript
  name: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'name',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg`Name`),
      description: i18nLabel(msg`Product name`),
      icon: 'IconAbc',
      isNullable: false,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  price: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'price',
      type: FieldMetadataType.CURRENCY,
      label: i18nLabel(msg`Preis`),
      description: i18nLabel(msg`Default price`),
      icon: 'IconCurrencyEuro',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  code: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'code',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg`Artikelnummer`),
      description: i18nLabel(msg`Product code`),
      icon: 'IconBarcode',
      isNullable: true,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  description: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'description',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg`Beschreibung`),
      description: i18nLabel(msg`Product description`),
      icon: 'IconFileDescription',
      isNullable: true,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
  isActive: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'isActive',
      type: FieldMetadataType.BOOLEAN,
      label: i18nLabel(msg`Aktiv`),
      description: i18nLabel(msg`Whether the product is active`),
      icon: 'IconToggleRight',
      isNullable: false,
      defaultValue: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
```
The function returns `Record<AllStandardObjectFieldName<'product'>, FlatFieldMetadata>` — the return type is exhaustive over the field names declared in `STANDARD_OBJECT_FIELDS.product`, so all base + these 5 must be present (typecheck enforces). Verify the exact `defaultValue`/`isNullable` conventions against a company scalar field (e.g. company `name`) and match them (e.g. TEXT default may be `"''"` as a stringified empty).

- [ ] **Step 3: Register the field builder**

In `build-standard-flat-field-metadata-maps.util.ts`, add the import for `buildProductStandardFlatFieldMetadatas` and add `product: buildProductStandardFlatFieldMetadatas` to the exhaustive builder map (next to `company`).

- [ ] **Step 4: search-fields entry**

In `search-fields-by-standard-object-name.constant.ts`, add `product: ['name', 'code']` (mirror company's entry shape) to the exhaustive map.

- [ ] **Step 5: Typecheck**

Run: `npx nx typecheck twenty-server` → 0 errors. This is the real gate: the exhaustive object-builder map, field-builder map, field-name return type, and search-fields map all fail here if `product` is missing or malformed.

- [ ] **Step 6: Commit**

```bash
git add packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/object-metadata/create-standard-flat-object-metadata.util.ts packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-product-standard-flat-field-metadata.util.ts packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/build-standard-flat-field-metadata-maps.util.ts packages/twenty-shared/src/metadata/constants/search-fields-by-standard-object-name.constant.ts
git commit -m "feat(server): product object + field flat-metadata builders"
```

---

## Task 3: Views, index, page layout, navigation

**Files (mirror company's entries in each; all optional per-object builders that make the object listable/usable):**
- Create: `.../utils/index/compute-product-standard-flat-index-metadata.util.ts` + Modify `.../utils/index/build-standard-flat-index-metadata-maps.util.ts`
- Create/Modify the view builders (`.../utils/view*/…`) + their `build-standard-flat-view-*-maps.util.ts`
- Create: `.../utils/page-layout-config/standard-product-page-layout.config.ts` + Modify `.../constants/standard-page-layout.constant.ts`
- Modify: `.../constants/standard-navigation-menu-item.constant.ts`

**Interfaces:**
- Consumes: `STANDARD_OBJECTS.product` + its index view universal identifier (Task 1).
- Produces: the product index view + fields, page layout, and a "Produkte" nav entry — so the object is visible + listable.

- [ ] **Step 1: Index builder**

Mirror company's `compute-company-standard-flat-index-metadata.util.ts` for product (searchVector + a `name` index) and register `product: computeProductStandardFlatIndexMetadatas` in `build-standard-flat-index-metadata-maps.util.ts` (this map is `?:` optional but the object should have indexes).

- [ ] **Step 2: View builders**

Mirror company's view util(s) for the index (all-records) view + its view fields (show name/price/code/isActive columns). Register in the `build-standard-flat-view-*-maps.util.ts` maps. Read company's view util set and reproduce the parallel product set. The view universal identifier comes from `STANDARD_OBJECTS.product.views` (declared in Task 1 Step 3).

- [ ] **Step 3: Page layout**

Create `standard-product-page-layout.config.ts` mirroring company's page-layout config (a record-detail layout showing the product fields) and register it in `STANDARD_PAGE_LAYOUTS` in `standard-page-layout.constant.ts`.

- [ ] **Step 4: Navigation entry**

In `standard-navigation-menu-item.constant.ts`, add a "Produkte" nav item referencing `STANDARD_OBJECTS.product.views.<allProducts>.universalIdentifier` (mirror company's nav entry).

- [ ] **Step 5: Build shared (if any shared view ids changed) + typecheck**

Run: `npx nx build twenty-shared` (if Task 1's `STANDARD_OBJECTS.product.views` needed view-id additions) then `npx nx typecheck twenty-server` → 0 errors.

- [ ] **Step 6: Commit**

```bash
git add packages/twenty-server/src/engine/workspace-manager/twenty-standard-application
git commit -m "feat(server): product object views, index, page layout, navigation"
```

---

## Task 4: Snapshot regeneration

**Files:**
- Modify (regenerate): `.../twenty-standard-application/utils/__tests__/__snapshots__/get-standard-object-metadata-related-entity-ids.util.spec.ts.snap` (+ the page-layout related-entity-ids snapshot if a layout was added).

- [ ] **Step 1: Regenerate snapshots**

Run: `cd packages/twenty-server && npx jest get-standard-object-metadata-related-entity-ids --config=jest.config.mjs -u` (and the page-layout related-entity-ids spec if present). Expected: the snapshot gains the product object's related entity ids; positional-id renumbering churn is expected/additive — no existing object's content should be removed.

- [ ] **Step 2: Review the snapshot diff**

`git diff` the `.snap` files — confirm the change is ADDITIVE (product ids added; other objects' ids unchanged except mechanical positional renumbering). If any existing object's real content changed, something in Tasks 1-3 is wrong — stop and fix.

- [ ] **Step 3: Full typecheck**

Run: `npx nx typecheck twenty-server && npx nx typecheck twenty-shared` → 0.

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/__tests__/__snapshots__
git commit -m "test(server): regenerate standard-object snapshots for product"
```

---

## Task 5: Upgrade command (create product object in existing workspaces)

**Files:**
- Create: `packages/twenty-server/src/database/commands/upgrade-version-command/2-37/2-37-workspace-command-1787000000000-add-product-object.command.ts`
- Create/Modify: `.../2-37/2-37-upgrade-version-command.module.ts` (mirror `2-35/2-35-upgrade-version-command.module.ts`)
- Modify: the workspace-command provider module + `TWENTY_NEXT_VERSIONS` (wherever 2.36 registered its version — mirror it for 2.37.0).

**Interfaces:**
- Consumes: `STANDARD_OBJECTS.product`; the standard flat maps (which now include product from Tasks 1-3).
- Produces: `AddProductObjectCommand` (`upgrade:2-37:add-product-object`) that creates the product object + fields + indexes + views in each provisioned workspace.

**Reference:** mirror `2-35/2-35-workspace-command-1786800000000-add-opportunity-lost-reason.command.ts`, but the operation creates a whole OBJECT (not a field). It reads `computeTwentyStandardApplicationAllFlatEntityMaps(...)`, finds the product object + its fields + indexes + views by universal identifier, and passes them to `validateBuildAndRunLegacyWorkspaceMigration` under `allFlatEntityOperationByMetadataName` with `objectMetadata.flatEntityToCreate = [productObject]`, `fieldMetadata.flatEntityToCreate = [product fields]`, and the index/view metadata create entries. Idempotent: skip when the product object already exists in the workspace's `flatObjectMetadataMaps` (check by `STANDARD_OBJECTS.product.universalIdentifier`).

- [ ] **Step 1: Write the command**

Mirror 2-35's structure. Key differences: guard on the product object's ABSENCE (create only if not present), and build the operation set for the object + all its owned flat entities (fields, indexes, views) pulled from `standardAllFlatEntityMaps` by universal identifier. Assemble `allFlatEntityOperationByMetadataName` with `objectMetadata`, `fieldMetadata`, `indexMetadata`, and `viewMetadata` create arrays (only the metadata types product actually declares). Use `@RegisteredWorkspaceCommand('2.37.0', 1787000000000)` and `@Command({ name: 'upgrade:2-37:add-product-object', description: 'Add the Product standard object' })`.

Read the `validateBuildAndRunLegacyWorkspaceMigration` param type (`allFlatEntityOperationByMetadataName`) to confirm which metadata keys it accepts (objectMetadata / fieldMetadata / indexMetadata / viewMetadata / viewFieldMetadata) and include exactly the ones product owns. This is the one genuinely intricate step — verify the accepted operation shape against the service before finalizing.

- [ ] **Step 2: Register the command**

Create `2-37-upgrade-version-command.module.ts` (mirror 2-35's module) providing the command, register it in the workspace-command provider module, and add `'2.37.0'` to `TWENTY_NEXT_VERSIONS` (mirror how 2.36 is registered).

- [ ] **Step 3: Typecheck + restart backend**

Run: `npx nx typecheck twenty-server` → 0. Restart backend, confirm metadata 200.

- [ ] **Step 4: Dry-run then run the command (live)**

Run the command dry-run first, then for real, against the dev workspace:
```bash
npx nx run twenty-server:command -- upgrade:2-37:add-product-object --dry-run
npx nx run twenty-server:command -- upgrade:2-37:add-product-object
```
Expected: dry-run logs "would create", real run logs "Created ... Product object". Re-running is idempotent (logs "already present, skipping").

- [ ] **Step 5: Verify via Postgres MCP**

Confirm the `product` table exists in `workspace_78jtyayrql5p8djgplk9x6vy` with columns `name`, `priceAmountMicros`/`priceCurrencyCode`, `code`, `description`, `isActive` (+ base columns), and that `core.objectMetadata` / `core.fieldMetadata` have the product rows.

- [ ] **Step 6: Commit**

```bash
git add packages/twenty-server/src/database/commands/upgrade-version-command/2-37 packages/twenty-server/src/database/commands/upgrade-version-command/*.ts
git commit -m "feat(server): 2.37 upgrade command to add product object"
```

---

## Live-verification (after Task 5, before finishing the branch)

Backend restarted (new metadata); front rebuilt (shared + vite cache cleared); Docker up.

1. The 2.37 command already ran (Task 5) → `product` table + metadata present (verified via Postgres MCP).
2. Open the app → confirm "Produkte" appears in the navigation sidebar.
3. Open Produkte → create a product with Name "Lizenz Pro", Preis 500 EUR, Artikelnummer "LP-001", Beschreibung "…", Aktiv on. Save.
4. Verify via Postgres MCP: a `product` row with those values (price stored in micros = 500000000).
5. Edit the product (change price) + confirm the update persists. Confirm `isActive` toggles.
6. Confirm the object is NOT shown where it shouldn't be (no regression to Opportunity/other object views).

---

## Self-review notes (author)
- Spec coverage: object registration (T1 shared + T2 builders), listability/nav (T3 views/index/page-layout/nav), snapshots (T4), existing-workspace migration (T5). Frontend is free (generic metadata rendering). All spec items mapped.
- The exhaustive `satisfies` maps (object builder, field builder map, field-name return type, search-fields) are the correctness net — `nx typecheck twenty-server` gates every server task.
- Highest-risk task is T5 (whole-object migration operation) — no exact in-fork precedent for creating an OBJECT via upgrade command (2-35 creates a field), so the plan flags verifying the `allFlatEntityOperationByMetadataName` shape against `validateBuildAndRunLegacyWorkspaceMigration` and does a dry-run + live table verification.
- Known limitations carried from spec: no line items (Slice B), no images/variants, workspace-default currency, fork-instance scope.
- All identifiers are fixed UUIDs (no placeholders); the mechanical mirror tasks name the exact company entry to parallel + the exact product values.
