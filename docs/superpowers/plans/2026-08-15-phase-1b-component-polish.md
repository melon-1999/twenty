# Phase 1b Component Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a semantic StatusPill, clarify the Button hierarchy, and moderately densify record cards and data-table rows toward Pipedrive's look — no sales logic.

**Architecture:** StatusPill is a new additive twenty-ui component (MIT), colored via the existing Tag tint tokens. Button work is an audit (no shape change). Density work reduces padding tokens one step in specific twenty-front files and is verified live.

**Tech Stack:** React 18, Linaria + SCSS modules, twenty-ui, Storybook (nx storybook:serve:dev twenty-ui, port 6008), oxlint/oxfmt, jest.

## Global Constraints

- Moderate density: tighten padding one step where safe; do NOT change `RECORD_TABLE_ROW_HEIGHT` (32px).
- No sales semantics (Won/Lost/rotting/probability) — Phase 2.
- Never edit `/* @license Enterprise */` files.
- Light + Dark parity for every color/token change.
- Spacing scale: `spacing(n) = n * 4px`; SCSS uses `var(--t-spacing-N)` and `var(--t-color-*)` / `var(--t-accent-*)`.
- Barrels are auto-generated: after adding a component run `npx nx generateBarrels twenty-ui` (do not hand-edit `data-display/index.ts`).
- Commit after each task. No signatures/co-author tags in commits. Caveman only in chat, normal in code/commits.

---

### Task 1: StatusPill component

**Files:**
- Create: `packages/twenty-ui/src/data-display/StatusPill/StatusPill.tsx`
- Create: `packages/twenty-ui/src/data-display/StatusPill/StatusPill.module.scss`
- Create: `packages/twenty-ui/src/data-display/StatusPill/statusPillVariantColor.ts`
- Create: `packages/twenty-ui/src/data-display/StatusPill/__tests__/statusPillVariantColor.test.ts`
- Create: `packages/twenty-ui/src/data-display/StatusPill/__stories__/StatusPill.stories.tsx`
- Regenerate: `packages/twenty-ui/src/data-display/index.ts` (via `nx generateBarrels twenty-ui`)

**Interfaces:**
- Produces: `StatusPill` component; `type StatusPillVariant = 'success' | 'danger' | 'neutral' | 'warning' | 'info'`; `type StatusPillProps = { variant: StatusPillVariant; label: string; withDot?: boolean; className?: string }`; `statusPillVariantColor(variant): ThemeColor`.
- Consumes: `themeCssVariables.tag.background` / `themeCssVariables.tag.text` (existing per-`ThemeColor` tint maps), `ThemeColor` type from `@ui/theme`.

- [ ] **Step 1: Write the failing unit test for the variant→color map**

```ts
// packages/twenty-ui/src/data-display/StatusPill/__tests__/statusPillVariantColor.test.ts
import { statusPillVariantColor } from '../statusPillVariantColor';

describe('statusPillVariantColor', () => {
  it('maps each variant to its theme color', () => {
    expect(statusPillVariantColor('success')).toBe('green');
    expect(statusPillVariantColor('danger')).toBe('red');
    expect(statusPillVariantColor('warning')).toBe('orange');
    expect(statusPillVariantColor('info')).toBe('blue');
    expect(statusPillVariantColor('neutral')).toBe('gray');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `cd packages/twenty-ui && npx jest statusPillVariantColor`
Expected: FAIL (cannot find module `../statusPillVariantColor`).

- [ ] **Step 3: Implement the variant→color map**

```ts
// packages/twenty-ui/src/data-display/StatusPill/statusPillVariantColor.ts
import { type ThemeColor } from '@ui/theme';

export type StatusPillVariant =
  | 'success'
  | 'danger'
  | 'neutral'
  | 'warning'
  | 'info';

const STATUS_PILL_VARIANT_COLOR: Record<StatusPillVariant, ThemeColor> = {
  success: 'green',
  danger: 'red',
  warning: 'orange',
  info: 'blue',
  neutral: 'gray',
};

export const statusPillVariantColor = (
  variant: StatusPillVariant,
): ThemeColor => STATUS_PILL_VARIANT_COLOR[variant];
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `cd packages/twenty-ui && npx jest statusPillVariantColor`
Expected: PASS.

- [ ] **Step 5: Write the SCSS module**

```scss
// packages/twenty-ui/src/data-display/StatusPill/StatusPill.module.scss
.pill {
  align-items: center;
  background: var(--status-pill-background);
  border-radius: var(--t-border-radius-rounded);
  box-sizing: border-box;
  color: var(--status-pill-text);
  corner-shape: round;
  display: inline-flex;
  font-size: var(--t-font-size-sm);
  font-weight: var(--t-font-weight-medium);
  gap: var(--t-spacing-1);
  height: var(--t-spacing-5);
  overflow: hidden;
  padding: 0 var(--t-spacing-2);
  white-space: nowrap;
}

.dot {
  background: var(--status-pill-text);
  border-radius: 50%;
  flex-shrink: 0;
  height: 6px;
  width: 6px;
}

.label {
  overflow: hidden;
  text-overflow: ellipsis;
}
```

- [ ] **Step 6: Write the component**

```tsx
// packages/twenty-ui/src/data-display/StatusPill/StatusPill.tsx
import { clsx } from 'clsx';

import { themeCssVariables } from '@ui/theme-constants';

import {
  statusPillVariantColor,
  type StatusPillVariant,
} from './statusPillVariantColor';

import styles from './StatusPill.module.scss';

export type StatusPillProps = {
  variant: StatusPillVariant;
  label: string;
  withDot?: boolean;
  className?: string;
};

export const StatusPill = ({
  variant,
  label,
  withDot = false,
  className,
}: StatusPillProps) => {
  const color = statusPillVariantColor(variant);

  return (
    <div
      className={clsx(styles.pill, className)}
      style={
        {
          '--status-pill-background': themeCssVariables.tag.background[color],
          '--status-pill-text': themeCssVariables.tag.text[color],
        } as React.CSSProperties
      }
    >
      {withDot ? <span className={styles.dot} aria-hidden /> : null}
      <span className={styles.label}>{label}</span>
    </div>
  );
};
```

- [ ] **Step 7: Write the Storybook story**

```tsx
// packages/twenty-ui/src/data-display/StatusPill/__stories__/StatusPill.stories.tsx
import { type Meta, type StoryObj } from '@storybook/react-vite';

import { ComponentDecorator } from '@ui/testing/decorators/ComponentDecorator';

import { StatusPill } from '@ui/data-display/StatusPill/StatusPill';

const meta: Meta<typeof StatusPill> = {
  title: 'UI/Data Display/StatusPill',
  component: StatusPill,
  decorators: [ComponentDecorator],
};

export default meta;
type Story = StoryObj<typeof StatusPill>;

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <StatusPill variant="success" label="Won" withDot />
      <StatusPill variant="danger" label="Lost" withDot />
      <StatusPill variant="warning" label="At risk" withDot />
      <StatusPill variant="info" label="Open" withDot />
      <StatusPill variant="neutral" label="Cold" withDot />
    </div>
  ),
};

export const WithoutDot: Story = {
  args: { variant: 'success', label: 'Active' },
};
```

- [ ] **Step 8: Regenerate barrels, typecheck, lint, format**

Run: `npx nx generateBarrels twenty-ui`
Run: `npx nx typecheck twenty-ui`
Run: `cd packages/twenty-ui && npx oxlint src/data-display/StatusPill && npx oxfmt src/data-display/StatusPill`
Expected: barrels include StatusPill; 0 type errors; lint/format clean.

- [ ] **Step 9: Verify in Storybook**

Run: `npx nx storybook:serve:dev twenty-ui` (port 6008), open `UI/Data Display/StatusPill`. Confirm 5 variants render tinted pills with dots in light + dark (toolbar theme switch). Take a screenshot.

- [ ] **Step 10: Commit**

```bash
git add packages/twenty-ui/src/data-display/StatusPill packages/twenty-ui/src/data-display/index.ts
git commit -m "feat(ui): add StatusPill component"
```

---

### Task 2: Button hierarchy audit (deprecate blue accent → green)

**Files:**
- Modify: `packages/twenty-front/src` call sites using `accent="blue"` / `accent={ButtonAccent... 'blue'}` on `Button` (found via grep in Step 1).
- Modify (comment only): `packages/twenty-ui/src/input/Button/Button.tsx` — add a note that `'blue'` accent is a deprecated alias of `'green'`.
- Create: `packages/twenty-ui/src/input/Button/__stories__/ButtonHierarchy.stories.tsx` (only if no story already shows primary/secondary/tertiary together; otherwise skip creation and extend the existing Button story).

**Interfaces:**
- Consumes: existing `ButtonVariant = 'primary' | 'secondary' | 'tertiary'`, `ButtonAccent = 'default' | 'blue' | 'danger' | 'green'`.
- Produces: nothing new; `'blue'` accent call sites removed from app code.

- [ ] **Step 1: Find Button `accent="blue"` usages**

Run: `grep -rn "accent=\"blue\"\|accent={'blue'\|accent: 'blue'" packages/twenty-front/src --include="*.tsx" --include="*.ts" | grep -v "@license Enterprise"`
Note each file:line. (Confirm each is a `Button`/`IconButton`, not a Tag/chart.)

- [ ] **Step 2: Repoint each blue Button accent to green (or default)**

For each call site, change `accent="blue"` → `accent="green"`. Do NOT touch files marked `/* @license Enterprise */`. Do NOT touch Tag/chart/icon color props (those are decorative blue, out of scope).

- [ ] **Step 3: Add deprecation comment in Button.tsx**

In `packages/twenty-ui/src/input/Button/Button.tsx`, above the `ButtonAccent` type, add:

```tsx
// 'blue' is a deprecated alias of 'green' after the green primary reskin; new
// call sites should use 'green' or the default accent.
```

- [ ] **Step 4: Ensure a hierarchy story exists**

If `grep -rn "secondary" packages/twenty-ui/src/input/Button/__stories__` shows no combined primary/secondary/tertiary example, create `ButtonHierarchy.stories.tsx`:

```tsx
import { type Meta, type StoryObj } from '@storybook/react-vite';

import { ComponentDecorator } from '@ui/testing/decorators/ComponentDecorator';

import { Button } from '@ui/input/Button/Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Input/Button/Hierarchy',
  component: Button,
  decorators: [ComponentDecorator],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Hierarchy: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="primary" title="Primary" />
      <Button variant="secondary" title="Secondary" />
      <Button variant="tertiary" title="Tertiary" />
    </div>
  ),
};
```

- [ ] **Step 5: Typecheck + lint the changed files**

Run: `npx nx typecheck twenty-front && npx nx typecheck twenty-ui`
Run: `npx nx lint:diff-with-main twenty-front --configuration=fix`
Expected: 0 errors.

- [ ] **Step 6: Verify in the running app**

Start the app (docker + `nx start twenty-server` + `nx start twenty-front`; user logs in). Confirm primary CTAs are green, secondary/tertiary are neutral, and no button that was blue now looks out of place. Screenshot.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(ui): deprecate blue button accent, repoint to green"
```

---

### Task 3: Record card density

**Files:**
- Modify: `packages/twenty-front/src/modules/object-record/record-index/record-card/components/RecordCard.tsx` (and its `.module.scss` if present).

**Interfaces:** none new — internal spacing only.

- [ ] **Step 1: Capture the baseline**

Start the app, open a record board (Opportunities or a board view). Screenshot a card (light + dark).

- [ ] **Step 2: Reduce internal padding one step**

In `RecordCard` styles, find the card container padding (likely `var(--t-spacing-3)` = 12px or a Linaria `theme.spacing(3)`). Reduce it one step to `spacing(2)` (8px). Tighten the title/subtitle/meta vertical gap one step if it uses `spacing(2)` → `spacing(1)`. Change ONLY padding/gap; do not restructure the component.

- [ ] **Step 3: Typecheck + lint**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix`
Expected: 0 errors.

- [ ] **Step 4: Verify no clipping, light + dark**

Reload the board. Confirm cards are visibly tighter but title/subtitle/value are not clipped and avatars/icons still align. Screenshot before/after side by side.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "style(front): densify record card padding"
```

---

### Task 4: Data-table row density

**Files:**
- Modify: the record-table cell/header SCSS or styled components under `packages/twenty-front/src/modules/object-record/record-table/` that set cell horizontal padding (found in Step 1).

**Interfaces:** none new — `RECORD_TABLE_ROW_HEIGHT` stays 32.

- [ ] **Step 1: Locate cell horizontal padding**

Run: `grep -rn "padding" packages/twenty-front/src/modules/object-record/record-table --include="*.scss" --include="*.ts" --include="*.tsx" | grep -iE "cell|header" | grep -v test`
Identify the cell horizontal padding declaration (e.g. `padding: 0 var(--t-spacing-2)`).

- [ ] **Step 2: Reduce cell horizontal padding one step**

Reduce the cell/header horizontal padding one step (e.g. `spacing(2)` → `spacing(1)`), keeping vertical metrics and row height unchanged (row height is fixed at 32px).

- [ ] **Step 3: Typecheck + lint**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix`
Expected: 0 errors.

- [ ] **Step 4: Verify no clipping / misalignment, light + dark**

Open the Companies table (wide, many columns). Confirm columns are tighter, text is not clipped, and cell focus/hover borders still align with content. Screenshot before/after.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "style(front): tighten data-table cell padding"
```

---

## Self-Review notes
- Spec coverage: StatusPill (spec §2 → Task 1), Button hierarchy (spec §1 → Task 2), Card density (spec §4 → Task 3), DataTable density (spec §5 → Task 4). ProgressBar (spec §3) intentionally has no task — component already exists, segmented variant deferred to Phase 2. Card `warnSlot` is deferred per spec ("only if it fits") and left out of Task 3 to avoid a bespoke refactor.
- Type consistency: `StatusPillVariant` / `StatusPillProps` / `statusPillVariantColor` names match between Task 1 steps.
- Density values are exact one-step reductions; each density task ends with live verification because exact current values must be read in-file first.
