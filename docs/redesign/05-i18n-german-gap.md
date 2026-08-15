# German i18n gap: root cause

The de-DE catalog is **100% complete** (3820 entries, 0 empty, 0 fuzzy, freshly compiled + committed in `0a78c1fb0e`). The English strings still visible in the running German app are **not** missing catalog translations. They are system-generated strings that were never internationalized (never extracted into any catalog), so no locale can translate them.

## Confirmed sources

### 1. Default view-name templates
Visible as: `All Unternehmen`, `By Stage`, `Assigned to Me`, `By Status` in the view bar.

- View names are stored in the DB (`core.view.name`) as literal templates, e.g. `All {objectLabelPlural}` (25 views), `By Stage`, `By Status`, `Assigned to Me`. Seeded in English at `packages/twenty-server/.../object-metadata/utils/compute-flat-index-view-to-create.util.ts:25`.
- Server `view.service.ts:379 processViewNameWithTemplate()` already tries i18n via `generateMessageId(viewName)` + `i18nService.translateMessage`, then falls back to raw `.replace`. But the **server catalog** `packages/twenty-server/src/engine/core-modules/i18n/locales/de-DE.po` does **not** contain these msgids (grep = 0) → always falls back to English prefix.
- Front path `packages/twenty-front/src/modules/views/utils/resolveViewNamePlaceholders.ts` (sole caller `viewsSelector.ts`) does a **raw `.replace`** of `{objectLabelPlural}` / `{objectLabelSingular}` with **no i18n at all**. The metadata-store prefetch that feeds the view bar goes through here, so the FE never translates the prefix.

### 2. Record-index create button "New {object}" / "Create new {object}"
Visible as: `New Unternehmen`.

- `packages/twenty-server/.../twenty-standard-application/constants/standard-command-menu-item.constant.ts:40,44` hardcodes `label: 'Create new ${capitalize(labelSingular)}'` and `shortLabel: 'New ${capitalize(labelSingular)}'` as **plain English template strings**, never wrapped in `t`/`msg`. The FE interpolates the object label but the English prefix is static.
- Note: the FE catalog *does* have `New {objectLabelSingular}` → `Neue {objectLabelSingular}` (used by `useOpenRecordInSidePanel.ts:217`), but the record-index header button uses the server command-menu shortLabel, a different source.

### 3. Un-wrapped `t` strings (spot-checked, same class)
- `RecordTableEmptyStateNoGroupNoRecordAtAll.tsx:22` and `RecordTableEmptyStateReadOnly.tsx:12`: `const buttonTitle = \`Add a ${objectLabelSingular}\`;` — plain template, missing `t` (compare the correctly-wrapped `RecordTableEmptyStateNoRecordFoundForFilter.tsx:21`).

## Fix options

- **A. FE-only view names (quick, HMR-verifiable):** make `resolveViewNamePlaceholders` translate known default templates via the global `i18n` (`t` from `@lingui/core/macro`) before placeholder substitution; register the templates for extraction; run `lingui extract` + add de translations + `compile`. Fixes #1 view bar. Does not need server rebuild. User-renamed views fall through untouched.
- **B. Full correctness (front + back):** A, plus add the view-template msgids to the **server** catalog so `processViewNameWithTemplate` resolves, plus internationalize the command-menu `label`/`shortLabel` (#2) — server change + workspace re-sync to regenerate command menu items.
- **C. Un-wrapped strings sweep (#3):** grep for plain `` `...${objectLabel...}` `` templates that should be `t`-wrapped; wrap + extract + translate.

`lingui extract` rewrites all 37 locale `.po` files (large mechanical churn) and `compile` rewrites `generated/*.ts`.

## What was fixed (2026-08-15)

- **View-name templates + newly-surfaced strings (done).** `resolveViewNamePlaceholders` now translates the known default view names via the global `t` (`@lingui/core/macro`). Key subtlety confirmed live: the server ships view names **already placeholder-substituted** (e.g. it sends `"All Unternehmen"`, not the raw `"All {objectLabelPlural}"`), because its own `processViewNameWithTemplate` catalog lacks the msgid and falls back to `"All " + <translated label>`. So the switch matches **both** the raw template and the reconstructed `` `All ${objectLabelPlural}` `` form; same for `By Stage` / `By Status` / `Assigned to Me`. No Jotai-reactivity plumbing was needed: `viewsSelector` already recomputes after locale is active (object labels are German by the time it runs) and `LocalePicker` calls `invalidateMetadataStore()` after `dynamicActivate`, so runtime locale switches recompute too. Verified live: view bar shows "Alle Unternehmen". `lingui extract` also surfaced 21 previously-unextracted strings (module names/descriptions: Activities, Contacts, Deals, AI Assistant, ...) which were translated to German in `de-DE.po`.

## Remaining (server-side, not done)

- **"New {object}" / "Create new {object}" record-index button** (#2 above) is generated server-side in `standard-command-menu-item.constant.ts` as a plain English template. Fixing it requires internationalizing those `label`/`shortLabel` strings on the server and re-syncing the workspace to regenerate command-menu items. Deferred as its own slice.
