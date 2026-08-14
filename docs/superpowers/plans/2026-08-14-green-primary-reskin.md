# UI Phase 1a — Green Primary Reskin (Pipedrive)

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Repoint Twenty's PRIMARY / CTA / link / selection / focus color from indigo("blue") to Pipedrive-green, WITHOUT changing the named "blue" palette (user tags/labels/avatars/decorative blue stay blue). Light + Dark.

**Architecture (from recon):** Twenty conflates primary-role with the named color `color.blue*` (= `indigoP3`). Tags/labels resolve via `theme.tag.*` (derived from `color.blue*`). The fix repurposes the existing `accent.*` tokens (intended "primary" slot, currently an underused indigo copy) → green, then migrates the primary-role `color.blueN` reads → `accent.accentN`. Because `color.blueN` and `accent.accentN` are today the SAME value (`indigoP3.indigoN`), the migration is tonally exact (indigo→green, same step). `color.blue*`, `MainColors.blue`, `SecondaryColors.blue*`, `TagLight/Dark` are NOT touched → named-blue provably unaffected.

**Tech:** twenty-ui theme constants (Linaria/SCSS + `themeCssVariables`), twenty-front consumers, Storybook.

## Global Constraints
- Do NOT modify any `/* @license Enterprise */` file. Two decorative `color.blue` consumers are Enterprise (SettingsRolePermissions…ValueInput.tsx, SettingsSSOSAMLForm.tsx) — leave them (their blue is decorative, correctly stays blue).
- Do NOT touch `color.blue*` / `MainColorsLight|Dark.blue` / `SecondaryColorsLight|Dark.blue*` / `TagLight|Dark` — named-blue must stay indigo.
- Every token change in BOTH `AccentLight.ts` AND `AccentDark.ts`.
- Green source: `RadixColors.greenP3` (Light) / `greenDarkP3` (Dark), and `COLOR_LIGHT.greenN` / `COLOR_DARK.greenN` (already exist).
- No `any`; named exports; `//` comments. Commit per task, no signatures.

## Migration rule (mechanical, exact)
For a **primary-role** usage only: `theme.color.blue` → `theme.accent.accent9`; `theme.color.blueN` → `theme.accent.accentN` (same N). Same for `themeCssVariables.color.blueN` → `themeCssVariables.accent.accentN`, and SCSS `--t-color-blueN` → `--t-accent-accentN`. Do NOT convert decorative/named-blue usages (charts, file-type icons, trigger icons, object-type icons, app badges, dashboard color swatches, variable-tag chips, avatar hash, Tag tokens).

---

### Task 1: Repoint accent tokens → green (Light + Dark)

**Files:** `packages/twenty-ui/src/theme/constants/AccentLight.ts`, `AccentDark.ts`

- [ ] **Step 1:** In AccentLight.ts, swap every indigo/blue source → green, preserving the step numbers:
  - `primary/secondary: COLOR_LIGHT.blue5` → `COLOR_LIGHT.green5`
  - `tertiary: blue3` → `green3`; `quaternary: blue2` → `green2`; `accent3570/accent4060: blue8` → `green8`
  - `accent1..accent12: RadixColors.indigoP3.indigo1..12` → `RadixColors.greenP3.green1..12`
- [ ] **Step 2:** In AccentDark.ts, same with `COLOR_DARK.greenN` + `RadixColors.greenDarkP3.greenN`.
- [ ] **Step 3:** Typecheck + build twenty-ui: `npx nx typecheck twenty-ui && npx nx build twenty-ui` — PASS.
- [ ] **Step 4:** Commit: `git commit -m "feat(ui): repoint accent tokens to green (light+dark)"`

*(After T1, only usages that already read `accent.*` go green — Button secondary/tertiary blue outline, AnimatedButton. Primary CTAs still read color.blue → next tasks.)*

---

### Task 2: Repoint the core primary surfaces (Button primary + focus-ring + links + selection)

**Files (primary-role, high-visibility):**
- `packages/twenty-ui/src/input/Button/Button.module.scss` — the `'blue'` accent branch (primary bg/hover/active) `--t-color-blue|blue10|blue12` → `--t-accent-accent9|accent10|accent12`; the `'default'` focus-border `--t-color-blue` → `--t-accent-accent9`.
- `packages/twenty-ui/src/styles/abstracts/_mixins.scss` — `focus-ring` `var(--t-color-blue)` → `var(--t-accent-accent9)`.
- `packages/twenty-front/src/modules/ui/display/components/LinkifiedTextBody.tsx` — link color.blue → accent.accent9.
- `packages/twenty-front/src/modules/ui/navigation/navigation-drawer/components/NavigationDrawerItem.tsx` — active border color.blue → accent.accent9.
- `packages/twenty-front/src/modules/ui/input/components/internal/date/components/StyledDatePickerContainer.tsx` — selected day.
- `packages/twenty-front/src/modules/object-record/record-table/record-table-cell/components/RecordTableCellFocusedPortalContent.tsx` — focus outline (blue8→accent8).
- `packages/twenty-front/src/modules/object-record/record-card/components/RecordCard.tsx` — selected card (blue7→accent7).
- `packages/twenty-front/src/modules/ui/layout/dropdown/components/StyledHeaderDropdownButton.tsx`, `StyledDropdownButtonContainer.tsx` — active dropdown.
- `packages/twenty-front/src/modules/ui/input/components/TextInput.tsx`, `TextArea.tsx` — focus.

- [ ] **Step 1:** Apply the migration rule to each file above (primary-role only). Read each first; only convert the primary/link/selection/focus color, not any decorative blue in the same file.
- [ ] **Step 2:** `npx nx typecheck twenty-front && npx nx typecheck twenty-ui` — PASS. `npx nx lint:diff-with-main twenty-front` — PASS.
- [ ] **Step 3:** Commit: `git commit -m "feat(front): route core primary surfaces to green accent"`

---

### Task 3: Repoint remaining primary-role color.blue usages

**Files (primary-role: dnd drop-targets, drag-select, page-layout grid, field-config drop zones):**
- `packages/twenty-front/src/modules/ui/utilities/drag-select/components/DragSelect.tsx`
- `packages/twenty-front/src/modules/ui/utilities/drag-and-drop/components/DragDropItemDropTarget.tsx`, `DragDropItemSortableHandle.tsx`
- `packages/twenty-front/src/modules/navigation-menu-item/display/dnd/components/NavigationItemDropTarget.tsx`, `.../folder/components/NavigationMenuItemFolderDnd.tsx`
- `packages/twenty-front/src/modules/page-layout/components/PageLayoutGridOverlay.tsx`, `PageLayoutGridLayout.tsx`, `PageLayoutTabWidgetDropTarget.tsx`, `PageLayoutTabListReorderableTab.tsx`
- `packages/twenty-front/src/modules/page-layout/widgets/fields/components/FieldsConfigurationGroupEditor.tsx`, `FieldsConfigurationEmptyGroupDropZone.tsx`
- `packages/twenty-ui/src/input/AnimatedButton/AnimatedButton.tsx` (unify its mixed `color.blue`+`accent.primary` "blue" branch onto `accent.*`).
- Sweep: `grep -rlE "(theme|themeCssVariables)\.color\.blue" packages/twenty-front/src packages/twenty-ui/src` and classify any remaining; convert only primary-role (drop-target/selection/focus/link/active), leave decorative (file-icon, trigger-icon, object-type-icon, app-badge, dashboard-swatch, variable-tag, workflow-diagram default, avatar-hash) and the 2 Enterprise files.

- [ ] **Step 1:** Convert the primary-role remainder per the rule; explicitly list any file left as decorative + why.
- [ ] **Step 2:** `npx nx typecheck twenty-front && npx nx typecheck twenty-ui` — PASS. `npx nx lint:diff-with-main twenty-front` — PASS.
- [ ] **Step 3:** Commit: `git commit -m "feat(front): route remaining primary surfaces to green accent"`

---

### Task 4: Visual verification (Storybook + running app)

- [ ] **Step 1:** Build/run Storybook (`packages/twenty-ui`): confirm the Button "accents" matrix (`Button.stories.tsx`) shows the primary/blue-accent button GREEN, `danger` still red, and `ColorSample`/tag stories still BLUE for the "Blue" color (named-blue unaffected).
- [ ] **Step 2:** Boot the app (all modules), screenshot: primary CTAs, active nav item, selected row, links, focus rings are GREEN; a "Blue" tag/label is still BLUE; charts/file-icons unaffected.
- [ ] **Step 3:** Document result (screenshots/notes). No commit unless fixes needed.

---

## Self-Review
- Named-blue safety: `color.blue*` / `MainColors.blue` / `SecondaryColors.blue*` / `Tag*` untouched across all tasks → user "Blue" tags stay blue (verify in T4).
- Tonal exactness: `color.blueN`→`accent.accentN` preserves the step; only hue changes indigo→green.
- Dark: every accent change in both AccentLight + AccentDark (T1); consumers read `themeCssVariables.accent.*` which is theme-aware.
- Enterprise: 2 flagged files excluded; their blue is decorative.
- Scope: token layer (T1) + core surfaces (T2) + remainder (T3) + visual proof (T4). ~35-45 files, no `color.blue*`/Tag edits.
