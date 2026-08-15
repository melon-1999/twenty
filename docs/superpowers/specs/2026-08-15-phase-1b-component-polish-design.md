# Phase 1b — Component Polish (Pipedrive direction) Design

**Goal:** Polish Twenty's core UI components toward Pipedrive's visual language — moderate density, clear button hierarchy, a dedicated status-pill, a reusable progress bar — without adding any sales semantics.

**Status of prior phases:** Phase 1a (green primary reskin) merged. Default view names now translate to German. Accent = green across light+dark.

## Global Constraints

- **Moderate density.** Tighten padding/spacing one step where safe; preserve readability and click targets. Do NOT shrink `RECORD_TABLE_ROW_HEIGHT` (already 32px).
- **No sales semantics.** StatusPill/ProgressBar are pure UI; no Won/Lost/rotting/probability logic (that is Phase 2).
- **Never touch `/* @license Enterprise */` files.**
- **Light + Dark parity** for every token/color change.
- **twenty-ui is MIT-licensed**, additive components live there with stories.
- Spacing scale: `spacing(n) = n * 4px`.

## Component decisions

### 1. Button hierarchy (audit, not rebuild)
Button already has `variant: 'primary' | 'secondary' | 'tertiary'` and `accent: 'default' | 'blue' | 'danger' | 'green'`.
- Confirm `primary` renders green (via accent tokens) and is the single high-emphasis style; `secondary` = neutral outline; `tertiary` = ghost/text.
- The `'blue'` and `'green'` accents now resolve to the same green after the reskin. **Deprecate `'blue'` accent**: repoint any `accent="blue"` call sites to `accent="green"` (or default), leave the `'blue'` case as an alias to green for back-compat, add a code comment. Do not remove the enum value in this slice (avoids churn).
- Deliverable: an audited, documented hierarchy + a Storybook story showing primary/secondary/tertiary × sizes. No visual redesign of the button shape.

### 2. StatusPill (new, `packages/twenty-ui/src/data-display/StatusPill/`)
Standalone from Tag (Tag stays for free-form user labels).
- Props: `type StatusPillProps = { variant: 'success' | 'danger' | 'neutral' | 'warning' | 'info'; label: string; withDot?: boolean; className?: string }`.
- Colors from theme: success = green accent, danger = `--t-color-red`, warning = `--t-color-orange`, info = `--t-color-blue`, neutral = gray. Solid-tinted background + readable text (mirror Tag's solid variant tinting: light background + saturated text/dot).
- Shape: fully rounded (pill), height 20px, `font.size.sm`, `font.weight.medium`, horizontal padding `spacing(2)`, optional leading 6px dot.
- Files: `StatusPill.tsx`, `StatusPill.module.scss`, `__stories__/StatusPill.stories.tsx`, barrel export in `data-display/index.ts` and `twenty-ui` public export.
- No mapping from domain statuses to variants here — callers pass `variant`.

### 3. ProgressBar (new, `packages/twenty-ui/src/feedback/ProgressBar/`)
- Props: `type ProgressBarProps = { value: number; max?: number; segments?: { value: number; color?: string }[]; color?: string; height?: number; label?: string; className?: string }`. `value`/`max` for a single continuous bar; `segments` (mutually exclusive) for a multi-segment bar (days-in-stage style).
- Default fill = green accent; track = `--t-background-tertiary`; height default 6px; radius fully rounded; optional right-aligned `label`.
- Clamp value to [0, max]; segments render proportionally, gap 2px.
- Files: `ProgressBar.tsx`, `ProgressBar.module.scss`, `__stories__/ProgressBar.stories.tsx`, barrel + public export.

### 4. Card density (record/deal card)
- Target `RecordCard` (`packages/twenty-front/src/modules/object-record/record-index/record-card/`).
- Reduce internal padding one step where it does not clip content (e.g. `spacing(3)` → `spacing(2)`), tighten the meta/subtitle row vertical gap, keep title legible.
- Add an optional `warnSlot`/trailing slot placeholder (no logic) for a later rotting indicator — only if it fits the existing card composition without a bespoke refactor; otherwise defer and note it.
- Verify light + dark in the running app; no board layout breakage.

### 5. DataTable row density
- Row height stays 32px. Moderate = reduce cell horizontal padding one step and tighten the column-header row; verify text is not clipped and focus/hover still align.
- Verify in the running app across a wide table (Companies) light + dark.

## Sequencing (each a plan task/slice)
1. **StatusPill** — additive, Storybook-verifiable, zero regression risk.
2. **ProgressBar** — additive, Storybook-verifiable.
3. **Button hierarchy audit** — repoint `blue`→`green`, story, no shape change.
4. **Card density** — live-verified.
5. **DataTable row density** — live-verified.

New components (1–2) first because they cannot regress existing screens and are verifiable in Storybook (`nx storybook:serve:dev twenty-ui`, port 6008). Density passes (4–5) last because they need live visual verification and carry the most regression risk.

## Testing
- New components: Storybook stories covering every variant/prop, light + dark. Type-check + `oxlint`/`oxfmt` clean.
- Density changes: live verification in the running app (Companies table, a record board) light + dark; screenshot before/after.
- No new unit tests unless a component has branching logic (ProgressBar clamp/segment math → a small unit test).

## Non-goals
- No sales logic (Won/Lost, rotting, probability, scoring) — Phase 2.
- No shell/IA (left rail, top bar) or board aggregate headers — those are Phase 1c/1d, separate specs.
- No Button shape redesign; no Tag replacement.
