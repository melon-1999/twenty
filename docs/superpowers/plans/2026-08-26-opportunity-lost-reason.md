# Opportunity Lost Reason Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `lostReason` SELECT field to Opportunity, captured through a dropdown on the "Mark as Lost" action (six reasons + "no reason"), shown as a German label in the record header when the deal is Lost, and cleared on Won/Reopen.

**Architecture:** A new SELECT standard field with English values + German option labels defined directly in the compute util (option labels are not translated server-side, so German source text is stored). A backfill command 2.35.0 creates the field metadata for existing workspaces (no data migration). A single frontend `OPPORTUNITY_LOST_REASONS` constant drives both the capture dropdown and the header label lookup. `OpportunityWonLostActions` gains a Lost dropdown and a reason chip; all lifecycle transitions set/clear `lostReason` in one `updateOneRecord` call.

**Tech Stack:** twenty-shared metadata constants, NestJS upgrade command, React 18, twenty-ui Dropdown/MenuItem, Lingui, Jest + Testing Library.

## Global Constraints

- Never modify `/* @license Enterprise */` files.
- No signatures / Co-Authored-By in commits.
- Named exports only, no default exports, no `any`, types over interfaces, string literals over enums.
- Import via `@/` alias (front) / `src/` alias (server); the repo bans `../` parent imports including in tests.
- Option `value`s are canonical English (`TOO_EXPENSIVE`, `LOST_TO_COMPETITOR`, `NO_BUDGET`, `BAD_TIMING`, `NO_DECISION`, `OTHER`); option `label`s are German source text.
- `twenty-shared` resolves via built `dist`: run `npx nx build twenty-shared` before twenty-server typecheck sees the new constant key.
- Lint: `npx nx lint:diff-with-main <project> --configuration=fix`; typecheck: `npx nx typecheck <project>`; format: `npx nx fmt twenty-front`.

**Precedent files (read the ones named in a task):**
- Field def: `packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts` (opportunity fields block, e.g. `weightedAmount` entry `...8a14`) + `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-opportunity-standard-flat-field-metadata.util.ts` (the `stage` SELECT block with its `options: [...]` shape, and the `status` SELECT block).
- Backfill: `packages/twenty-server/src/database/commands/upgrade-version-command/2-31/` (field-only command, no raw SQL) + `.../workspace-command-provider.module.ts` + `packages/twenty-server/src/engine/core-modules/upgrade/constants/twenty-next-versions.constant.ts`.
- Frontend actions: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityWonLostActions.tsx` (current full file) + `OpportunityStatusPill.tsx` + wiring in `RecordShowPage.tsx`.
- Dropdown: `packages/twenty-front/src/modules/settings/admin-panel/health-status/components/SettingsAdminQueueJobRowDropdownMenu.tsx` (button → menu → action → `closeDropdown`).

---

## Task 1: Add `lostReason` SELECT field

**Files:**
- Modify: `packages/twenty-shared/src/metadata/constants/standard-object-fields.constant.ts`
- Modify: `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-opportunity-standard-flat-field-metadata.util.ts`
- Modify: `packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts`
- Snapshots (regen): `packages/twenty-shared/.../__snapshots__/standardObjectUniversalIdentifiers.test.ts.snap`, `packages/twenty-server/.../__snapshots__/get-standard-object-metadata-related-entity-ids.util.spec.ts.snap`

**Interfaces:**
- Produces: Opportunity field `lostReason` (SELECT, nullable, `universalIdentifier` `20202020-5701-4a11-9c31-7e6b2d4f8a15`) with six options (English values, German labels). Entity mirror gains `lostReason: string | null;`.

- [ ] **Step 1: Add the universalIdentifier to the shared constant.** In `standard-object-fields.constant.ts`, in the opportunity `fields` object right after the `weightedAmount` entry (`...8a14`), add:

```ts
    lostReason: {
      universalIdentifier: '20202020-5701-4a11-9c31-7e6b2d4f8a15',
    },
```

- [ ] **Step 2: Build twenty-shared.**

Run: `npx nx build twenty-shared`
Expected: build succeeds.

- [ ] **Step 3: Grep-verify the 6 option UUIDs + the field UUID are free.**

Run: `grep -rn "7e6b2d4f8a15\|1a51-4c0" packages/ | grep -v node_modules | grep -v dist`
Expected: only the constant entry from Step 1 (no option-id hits yet).

- [ ] **Step 4: Add the field metadata definition.** In `compute-opportunity-standard-flat-field-metadata.util.ts`, right after the `status` SELECT block (near line 317, before/after in the same object literal — match the surrounding `createStandardFieldFlatMetadata({...})` entries), add:

```ts
  lostReason: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'lostReason',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(msg`Lost reason`),
      description: i18nLabel(msg`Why the opportunity was lost`),
      icon: 'IconThumbDown',
      isNullable: true,
      options: [
        {
          id: '20202020-1a51-4c01-8d01-9e5710571001',
          value: 'TOO_EXPENSIVE',
          label: i18nLabel(msg`Zu teuer`),
          position: 0,
          color: 'red',
        },
        {
          id: '20202020-1a51-4c02-8d02-9e5710571002',
          value: 'LOST_TO_COMPETITOR',
          label: i18nLabel(msg`Konkurrenz`),
          position: 1,
          color: 'orange',
        },
        {
          id: '20202020-1a51-4c03-8d03-9e5710571003',
          value: 'NO_BUDGET',
          label: i18nLabel(msg`Kein Budget`),
          position: 2,
          color: 'yellow',
        },
        {
          id: '20202020-1a51-4c04-8d04-9e5710571004',
          value: 'BAD_TIMING',
          label: i18nLabel(msg`Timing`),
          position: 3,
          color: 'blue',
        },
        {
          id: '20202020-1a51-4c05-8d05-9e5710571005',
          value: 'NO_DECISION',
          label: i18nLabel(msg`Keine Entscheidung`),
          position: 4,
          color: 'purple',
        },
        {
          id: '20202020-1a51-4c06-8d06-9e5710571006',
          value: 'OTHER',
          label: i18nLabel(msg`Sonstiges`),
          position: 5,
          color: 'gray',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
```

`i18nLabel` returns `descriptor.message` (a plain string), so `i18nLabel(msg\`Zu teuer\`)` stores the literal German label — option labels are NOT translated server-side, which is exactly why the label is written in German directly here. Confirm `msg` and `i18nLabel` are already imported at the top of the file (they are, used by other fields).

- [ ] **Step 5: Update the entity mirror.** In `opportunity.workspace-entity.ts`, add next to the other lifecycle fields (e.g. after `weightedAmount`):

```ts
  lostReason: string | null;
```

- [ ] **Step 6: Regenerate the two snapshots.**

Run: `cd packages/twenty-shared && npx jest standardObjectUniversalIdentifiers -u`
Run: `cd packages/twenty-server && npx jest get-standard-object-metadata-related-entity-ids -u`
Expected: both update — opportunity gains `lostReason` + a deterministic id shift; skim to confirm no other object semantically changed.

- [ ] **Step 7: Typecheck + verify no UUID collision.**

Run: `npx nx build twenty-shared && npx nx typecheck twenty-server`
Run: `grep -rn "7e6b2d4f8a15\|9e57105710" packages/ | grep -v node_modules | grep -v dist`
Expected: typecheck passes; grep shows only the source-of-truth entries + snapshot rows.

- [ ] **Step 8: Commit.**

```bash
git add -A
git commit -m "feat(server): add opportunity lostReason SELECT field"
```

---

## Task 2: Backfill upgrade command 2.35.0

Field-only creation for existing workspaces; no data migration (existing rows stay NULL).

**Files:**
- Create: `packages/twenty-server/src/database/commands/upgrade-version-command/2-35/2-35-workspace-command-1786800000000-add-opportunity-lost-reason.command.ts`
- Create: `packages/twenty-server/src/database/commands/upgrade-version-command/2-35/2-35-upgrade-version-command.module.ts`
- Modify: `packages/twenty-server/src/database/commands/upgrade-version-command/workspace-command-provider.module.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/upgrade/constants/twenty-next-versions.constant.ts`

**Interfaces:**
- Consumes: the `lostReason` field from Task 1.
- Produces: command `upgrade:2-35:add-opportunity-lost-reason`, `@RegisteredWorkspaceCommand('2.35.0', 1786800000000)`.

- [ ] **Step 1: Read the 2-31 command in full** (`.../2-31/...add-opportunity-won-lost-fields.command.ts`) and its module. It is a FIELD-ONLY legacy-migration command (no raw SQL, no data backfill) — the exact shape needed here (status/closedAt had no data backfill either).

- [ ] **Step 2: Write the 2.35.0 command.** Mirror 2-31 exactly, with:
  - `@RegisteredWorkspaceCommand('2.35.0', 1786800000000)`, name `upgrade:2-35:add-opportunity-lost-reason`, description "Add the Opportunity lostReason field".
  - Creates ONLY the `lostReason` field metadata, deriving the field's identifiers from `STANDARD_OBJECTS.opportunity.fields.lostReason.universalIdentifier` (never hardcode). The SELECT options come from the standard field definition (the legacy migration path builds the field from the flat metadata) — follow 2-31's mechanism verbatim; do not re-declare options in the command.
  - Idempotent (skip when the field already exists), dry-run guarded.

- [ ] **Step 3: Write the version module** (`2-35-upgrade-version-command.module.ts`) mirroring `2-31`/`2-34`'s module (imports WorkspaceIteratorModule + WorkspaceCacheModule + whatever 2-31 imports; provides + exports the command).

- [ ] **Step 4: Register V2_35** in `workspace-command-provider.module.ts` (after V2_34).

- [ ] **Step 5: Add `'2.35.0'`** to `TWENTY_NEXT_VERSIONS` (after `'2.34.0'`).

- [ ] **Step 6: Typecheck + lint.**

Run: `npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server --configuration=fix`
Expected: 0.

- [ ] **Step 7: Dry-run + real run against dev DB (no reset).**

Run: `npx nx run twenty-server:command -- upgrade:2-35:add-opportunity-lost-reason --dry-run`
Run: `npx nx run twenty-server:command -- upgrade:2-35:add-opportunity-lost-reason`
Then verify (Postgres MCP, read-only, workspace `workspace_78jtyayrql5p8djgplk9x6vy`): a `lostReason` field-metadata row exists in `core."fieldMetadata"` for the opportunity object with 6 options; the workspace `opportunity` table has a `lostReason` column, all rows NULL.

- [ ] **Step 8: Idempotency re-run.** Re-run the dry-run; expected: "already present", no work.

- [ ] **Step 9: Commit.**

```bash
git add -A
git commit -m "feat(server): backfill command 2.35.0 for opportunity lostReason"
```

---

## Task 3: Lost-reason constant + label lookup

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/constants/opportunityLostReasons.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/utils/getLostReasonLabel.ts`
- Test: `packages/twenty-front/src/modules/object-record/record-show/opportunity/utils/__tests__/getLostReasonLabel.test.ts`

**Interfaces:**
- Produces:
  - `OPPORTUNITY_LOST_REASONS: { value: string; label: string }[]` — the six reasons in order, labels via the `t` macro. This is the single source of truth for both the dropdown and the label lookup.
  - `getLostReasonLabel(value: string | null): string` — returns the German label for a known value, `''` for null/unknown.

- [ ] **Step 1: Write the failing test.**

```ts
import { getLostReasonLabel } from '@/object-record/record-show/opportunity/utils/getLostReasonLabel';

describe('getLostReasonLabel', () => {
  it('returns the German label for a known value', () => {
    expect(getLostReasonLabel('TOO_EXPENSIVE')).toBe('Zu teuer');
    expect(getLostReasonLabel('LOST_TO_COMPETITOR')).toBe('Konkurrenz');
    expect(getLostReasonLabel('OTHER')).toBe('Sonstiges');
  });
  it('returns empty string for null or unknown', () => {
    expect(getLostReasonLabel(null)).toBe('');
    expect(getLostReasonLabel('NOPE')).toBe('');
  });
});
```

Note: `t` from `@lingui/core/macro` returns the source string in tests (setupTests activates the global i18n with no active catalog), so `t\`Zu teuer\`` evaluates to `'Zu teuer'`.

- [ ] **Step 2: Run it, expect fail.**

Run: `cd packages/twenty-front && npx jest getLostReasonLabel`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the constant.**

```ts
import { t } from '@lingui/core/macro';

export const OPPORTUNITY_LOST_REASONS: { value: string; label: string }[] = [
  { value: 'TOO_EXPENSIVE', label: t`Zu teuer` },
  { value: 'LOST_TO_COMPETITOR', label: t`Konkurrenz` },
  { value: 'NO_BUDGET', label: t`Kein Budget` },
  { value: 'BAD_TIMING', label: t`Timing` },
  { value: 'NO_DECISION', label: t`Keine Entscheidung` },
  { value: 'OTHER', label: t`Sonstiges` },
];
```

- [ ] **Step 4: Implement the lookup.**

```ts
import { OPPORTUNITY_LOST_REASONS } from '@/object-record/record-show/opportunity/constants/opportunityLostReasons';

export const getLostReasonLabel = (value: string | null): string =>
  OPPORTUNITY_LOST_REASONS.find((reason) => reason.value === value)?.label ?? '';
```

- [ ] **Step 5: Run it, expect pass.**

Run: `cd packages/twenty-front && npx jest getLostReasonLabel`
Expected: PASS.

- [ ] **Step 6: Typecheck + lint + commit.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix`
```bash
git add packages/twenty-front/src/modules/object-record/record-show/opportunity/constants packages/twenty-front/src/modules/object-record/record-show/opportunity/utils
git commit -m "feat(front): opportunity lost-reason constant + label lookup"
```

---

## Task 4: Capture dropdown + header display + wiring

**Files:**
- Modify: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityWonLostActions.tsx`
- Modify: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/__tests__/OpportunityWonLostActions.test.tsx` (extend existing; if none exists at that path, find the existing test and extend it)
- Modify: `packages/twenty-front/src/modules/object-record/record-show/components/RecordShowPage.tsx` (read + pass `lostReason`)

**Interfaces:**
- Consumes: `OPPORTUNITY_LOST_REASONS`, `getLostReasonLabel` (Task 3); `useUpdateOneRecord`; the twenty-ui `Dropdown`/`MenuItem`.
- Produces: `OpportunityWonLostActions` gains a `lostReason: string | null` prop; the Lost button becomes a dropdown; a reason chip renders for a Lost deal with a reason.

- [ ] **Step 1: Read** the current `OpportunityWonLostActions.tsx`, the dropdown example `SettingsAdminQueueJobRowDropdownMenu.tsx`, and the `RecordShowPage.tsx` block where `OpportunityWonLostActions` is rendered (it already reads `status` + `closedAt` via `recordStoreFamilySelector`).

- [ ] **Step 2: Extend the component test first (TDD).** In the existing `OpportunityWonLostActions` test, add cases (mock `useUpdateOneRecord` as the existing tests do):

```tsx
it('marking Lost with a reason sets status, closedAt and lostReason in one update', async () => {
  // render with status="OPEN", open the Lost dropdown, click "Konkurrenz"
  // expect updateOneRecord called once with updateOneRecordInput containing
  //   status: 'LOST', lostReason: 'LOST_TO_COMPETITOR', and a closedAt string
});

it('marking Lost with "Ohne Grund" sets lostReason null', async () => {
  // open Lost dropdown, click the no-reason item
  // expect updateOneRecordInput: { status: 'LOST', closedAt: <string>, lostReason: null }
});

it('Reopen clears lostReason', async () => {
  // render status="LOST"; click Reopen
  // expect updateOneRecordInput: { status: 'OPEN', closedAt: null, lostReason: null }
});

it('renders the German reason chip for a Lost deal with a reason', () => {
  // render status="LOST", lostReason="TOO_EXPENSIVE" -> "Zu teuer" visible
});

it('renders no reason chip when lostReason is null on a Lost deal', () => {
  // render status="LOST", lostReason={null} -> no reason chip
});
```

Match the render/muck pattern the existing test file already uses (imports, `useUpdateOneRecord` mock, dropdown-open interaction via `@testing-library/user-event`). If the dropdown is hard to drive in JSDOM, at minimum assert the update-shape via the handler and the chip rendering; keep the existing Won/closedAt tests green.

- [ ] **Step 3: Run the test, expect fail.**

Run: `cd packages/twenty-front && npx jest OpportunityWonLostActions`
Expected: FAIL (new prop/behavior not implemented).

- [ ] **Step 4: Implement the component changes.** Add the `lostReason` prop, a `getLostReasonLabel` chip, and a Lost dropdown. Full new file:

```tsx
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { Button } from 'twenty-ui/input';
import { MenuItem } from 'twenty-ui/navigation';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { OpportunityStatusPill } from '@/object-record/record-show/opportunity/components/OpportunityStatusPill';
import { OPPORTUNITY_LOST_REASONS } from '@/object-record/record-show/opportunity/constants/opportunityLostReasons';
import { getLostReasonLabel } from '@/object-record/record-show/opportunity/utils/getLostReasonLabel';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { beautifyExactDate } from '~/utils/date-utils';

const DROPDOWN_ID = 'opportunity-lost-reason-dropdown';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledClosedAtLabel = styled.span`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledReasonLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type OpportunityWonLostActionsProps = {
  recordId: string;
  status: string;
  closedAt: string | null;
  lostReason: string | null;
};

const getStatusLabel = (status: string): string => {
  if (status === 'WON')
    return t({ message: 'Won', context: 'Opportunity status' });
  if (status === 'LOST')
    return t({ message: 'Lost', context: 'Opportunity status' });
  return t({ message: 'Open', context: 'Opportunity status' });
};

export const OpportunityWonLostActions = ({
  recordId,
  status,
  closedAt,
  lostReason,
}: OpportunityWonLostActionsProps) => {
  const { updateOneRecord } = useUpdateOneRecord();
  const { closeDropdown } = useCloseDropdown();

  const setOutcome = (
    nextStatus: 'OPEN' | 'WON' | 'LOST',
    nextLostReason: string | null,
  ) =>
    updateOneRecord({
      objectNameSingular: 'opportunity',
      idToUpdate: recordId,
      updateOneRecordInput: {
        status: nextStatus,
        closedAt: nextStatus === 'OPEN' ? null : new Date().toISOString(),
        lostReason: nextLostReason,
      },
    });

  const handleLost = (nextLostReason: string | null) => {
    setOutcome('LOST', nextLostReason);
    closeDropdown(DROPDOWN_ID);
  };

  const isClosed = status === 'WON' || status === 'LOST';
  const reasonLabel = getLostReasonLabel(lostReason);

  return (
    <StyledContainer>
      <OpportunityStatusPill status={status} label={getStatusLabel(status)} />
      {isClosed && closedAt && (
        <StyledClosedAtLabel>{beautifyExactDate(closedAt)}</StyledClosedAtLabel>
      )}
      {status === 'LOST' && reasonLabel !== '' && (
        <StyledReasonLabel>{reasonLabel}</StyledReasonLabel>
      )}
      {isClosed ? (
        <Button
          variant="secondary"
          title={t`Reopen`}
          onClick={() => setOutcome('OPEN', null)}
        />
      ) : (
        <>
          <Button
            variant="primary"
            accent="green"
            title={t`Mark as Won`}
            onClick={() => setOutcome('WON', null)}
          />
          <Dropdown
            dropdownId={DROPDOWN_ID}
            dropdownPlacement="bottom-end"
            clickableComponent={
              <Button variant="primary" accent="danger" title={t`Mark as Lost`} />
            }
            dropdownComponents={
              <DropdownContent>
                <DropdownMenuItemsContainer>
                  {OPPORTUNITY_LOST_REASONS.map((reason) => (
                    <MenuItem
                      key={reason.value}
                      text={reason.label}
                      onClick={() => handleLost(reason.value)}
                    />
                  ))}
                  <MenuItem
                    text={t`Ohne Grund`}
                    onClick={() => handleLost(null)}
                  />
                </DropdownMenuItemsContainer>
              </DropdownContent>
            }
          />
        </>
      )}
    </StyledContainer>
  );
};
```

Verify the `Button` used as `clickableComponent` still opens the dropdown (the Dropdown wires the click). If `Button`'s own semantics swallow the click, wrap it or use the `clickableComponent` exactly as the precedent does (the precedent uses `LightIconButton` as `clickableComponent` and it works). Keep `accent="danger"` for the red Lost button.

- [ ] **Step 5: Wire `lostReason` in `RecordShowPage.tsx`.** Where `status` and `closedAt` are read via `useAtomFamilySelectorValue(recordStoreFamilySelector, { recordId, fieldName })` and passed to `OpportunityWonLostActions`, add an identical read for `fieldName: 'lostReason'` and pass `lostReason={lostReason}` to the component.

- [ ] **Step 6: Run the component test, expect pass.**

Run: `cd packages/twenty-front && npx jest OpportunityWonLostActions`
Expected: PASS (existing + new cases).

- [ ] **Step 7: Typecheck + lint + fmt.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix && npx nx fmt twenty-front`
Expected: 0 on touched files.

- [ ] **Step 8: i18n.** Wrap the new strings with `t` (already done in the code). Run `npx nx run twenty-front:lingui:extract`, fill the new German `msgstr`s in `packages/twenty-front/src/locales/de-DE.po` (the six reason labels are already German source so their msgstr equals the msgid; "Ohne Grund" -> "Ohne Grund"; the server field label "Lost reason" is handled separately in the server de-DE catalog — see Step 9). Run `npx nx run twenty-front:lingui:compile`.

- [ ] **Step 9: Localize the field label server-side.** Add "Lost reason" -> "Verlustgrund" to the server de-DE catalog `packages/twenty-server/src/engine/core-modules/i18n/locales/de-DE.po` (mirror how other standard field labels like "Stage"/"Amount" are entered there — same msgid/msgstr format), then compile if that package has a compile step (check for a `lingui:compile` on twenty-server; if none, the `.po` is read directly). This makes the Fields-panel field label render "Verlustgrund".

- [ ] **Step 10: Commit.**

```bash
git add -A
git commit -m "feat(front): opportunity lost-reason capture dropdown + header chip"
```

---

## Live verification (before final review)

Dev instance (in-app browser + Postgres MCP, workspace `workspace_78jtyayrql5p8djgplk9x6vy`, an open test opportunity):

1. "Als verloren markieren" opens a dropdown listing the six German reasons + "Ohne Grund".
2. Pick "Konkurrenz" -> pill shows "Verloren", header shows the German reason "Konkurrenz"; DB row: `status='LOST'`, `closedAt` set, `lostReason='LOST_TO_COMPETITOR'`.
3. Reopen -> pill "Offen", reason chip gone; DB: `status='OPEN'`, `closedAt` null, `lostReason` null.
4. Mark Lost with "Ohne Grund" -> `lostReason` null, no reason chip.
5. Mark as Won -> `lostReason` null (no reason chip on Won).
6. The Fields panel shows "Verlustgrund" as the field label with the German option selected.

---

## Notes for the executor

- Option labels are stored German (i18nLabel just returns the source string; option labels are not translated by the metadata resolver), so the generic SELECT display shows German natively — no per-field localization command needed.
- All lifecycle transitions set `lostReason` in the same `updateOneRecord` as `status`/`closedAt` (one write, no extra round-trip).
- Keep everything opportunity-gated / additive; do not alter generic record-field or dropdown internals.
