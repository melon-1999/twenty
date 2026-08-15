# Opportunity Won/Lost Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Opportunity `status` (Open/Won/Lost) SELECT field + `closedAt` DATE_TIME, with Won/Lost/Reopen actions and a StatusPill on the Opportunity detail.

**Architecture:** Backend uses Twenty's flat-metadata standard-application pattern: define the fields for new workspaces in the compute-util, backfill existing workspaces with a registered upgrade-version workspace command. Frontend adds Opportunity-only actions that set both fields in one `updateOne` and shows the outcome via the Phase-1b `StatusPill`.

**Tech Stack:** NestJS, TypeORM, flat-metadata standard-application, React 18 + Apollo, twenty-ui.

## Global Constraints
- `status`: SELECT, non-null, default `OPEN`; options OPEN(gray,0)/WON(green,1)/LOST(red,2). `closedAt`: DATE_TIME, nullable.
- Field IDs use the `20202020-…` UUID namespace (unique per field/option).
- Never edit committed `up`/`down` of prior upgrade commands. Never touch `/* @license Enterprise */` files.
- Frontend actions Opportunity-only (`objectNameSingular === 'opportunity'`). closedAt set frontend-side: Won/Lost → now ISO; Reopen → null.
- StatusPill mapping: WON→success, LOST→danger, OPEN→neutral.
- No lostReason, win-rate, forecast, board-drag, rotting, or server hook (out of scope).

---

### Task 1: Define `status` + `closedAt` for new workspaces (flat-metadata)

**Files:**
- Modify: `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-opportunity-standard-flat-field-metadata.util.ts` (add two entries; mirror existing `stage` at :164 for SELECT and `closeDate` at :148 for DATE_TIME)
- Modify: `packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts` (add `status: string;` and `closedAt: Date | null;`)
- Modify: `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type.ts` (add `'status'`, `'closedAt'` to the opportunity field-name union — read the file first to match its exact shape)

**Interfaces:**
- Produces: opportunity fields `status` (SELECT OPEN/WON/LOST) and `closedAt` (DATE_TIME) available on new workspaces; consumed by Task 2 (backfill) and Task 4/5 (frontend).

- [ ] **Step 1: Add the `status` SELECT entry** to the record returned by `buildOpportunityStandardFlatFieldMetadatas`, immediately after the `stage` entry, mirroring `stage`'s exact structure:

```ts
  status: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'status',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(msg`Status`),
      description: i18nLabel(msg`Opportunity outcome status`),
      icon: 'IconTargetArrow',
      isNullable: false,
      defaultValue: "'OPEN'",
      options: [
        {
          id: '20202020-5701-4f2a-9b11-a1c2d3e4f5a1',
          value: 'OPEN',
          label: i18nLabel(msg`Open`),
          position: 0,
          color: 'gray',
        },
        {
          id: '20202020-5701-4f2a-9b11-a1c2d3e4f5a2',
          value: 'WON',
          label: i18nLabel(msg`Won`),
          position: 1,
          color: 'green',
        },
        {
          id: '20202020-5701-4f2a-9b11-a1c2d3e4f5a3',
          value: 'LOST',
          label: i18nLabel(msg`Lost`),
          position: 2,
          color: 'red',
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
```

- [ ] **Step 2: Add the `closedAt` DATE_TIME entry** after `closeDate` (mirror `closeDate`):

```ts
  closedAt: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'closedAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(msg`Closed at`),
      description: i18nLabel(msg`When the opportunity was marked won or lost`),
      icon: 'IconCalendarCheck',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
```

- [ ] **Step 3: Add the entity type fields** in `opportunity.workspace-entity.ts` (after `stage: string;`):

```ts
  status: string;
  closedAt: Date | null;
```

- [ ] **Step 4: Add field names to the type union.** Read `all-standard-object-field-name.type.ts`, find the opportunity entry, and add `'status'` and `'closedAt'` to its field-name list (match the file's exact union/array shape — do not restructure).

- [ ] **Step 5: Typecheck**

Run: `npx nx typecheck twenty-server`
Expected: 0 errors (the record now satisfies `Record<AllStandardObjectFieldName<'opportunity'>, FlatFieldMetadata>`; a missing field-name-union entry would surface here).

- [ ] **Step 6: Verify on a fresh workspace via DB reset**

Run: `npx nx database:reset twenty-server`
Then query (Postgres MCP): `SELECT name, type, options FROM core."fieldMetadata" fm JOIN core."objectMetadata" om ON om.id=fm."objectMetadataId" WHERE om."nameSingular"='opportunity' AND fm.name IN ('status','closedAt');`
Expected: `status` SELECT with 3 options (OPEN/WON/LOST), `closedAt` DATE_TIME.

- [ ] **Step 7: Commit**

```bash
git add packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-opportunity-standard-flat-field-metadata.util.ts packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type.ts
git commit -m "feat(server): add Opportunity status + closedAt standard fields"
```

---

### Task 2: Backfill existing workspaces (upgrade-version workspace command)

**Files:**
- Create: `packages/twenty-server/src/database/commands/upgrade-version-command/<VER>/<VER>-workspace-command-<TS>-add-opportunity-won-lost-fields.command.ts`
- Reference template (copy + adapt, do NOT edit it): `packages/twenty-server/src/database/commands/upgrade-version-command/2-18/2-18-workspace-command-1810000005000-add-message-is-draft-field.command.ts`
- Register: add the command to its version's module provider (mirror how the 2-18 command is registered in `upgrade-version-command/2-18/…module` or the central `upgrade-version-command.module.ts` — read how 2-18 is wired first).

**Interfaces:**
- Consumes: the field definitions from Task 1 (universal identifiers must match the `20202020-5701-…` ids used in Task 1's options/fields — the field-level universal identifiers for `status`/`closedAt` come from `createStandardFieldFlatMetadata`; read how the 2-18 command derives the field universal id to add).

- [ ] **Step 1: Determine the next version + timestamp.** Run `ls packages/twenty-server/src/database/commands/upgrade-version-command/ | sort -V | tail -5` and read the highest `@RegisteredWorkspaceCommand('X.Y.0', <ts>)` currently registered. Use the next patch/minor version and a strictly-greater timestamp for the new command (mirror the numbering the repo is currently on).

- [ ] **Step 2: Copy the 2-18 template into the new file**, renaming class/command to `AddOpportunityWonLostFieldsCommand` / `upgrade:<VER>:add-opportunity-won-lost-fields`, and change: object universal identifier → the Opportunity object's universal id (find it: `SELECT "standardId" FROM core."objectMetadata" WHERE "nameSingular"='opportunity';` or read the opportunity object metadata constant), and the field it adds → `status` and `closedAt` (the template adds one field; extend to add both, or add `status` then `closedAt`, guarding each with an existing-field check as the template does for isDraft).

- [ ] **Step 3: Build + run the command on the existing dev DB**

Run (server must build): `npx nx run twenty-server:command -- upgrade:<VER>:add-opportunity-won-lost-fields --dry-run` then without `--dry-run`. (Confirm the exact command invocation against how other upgrade commands are run in `UPGRADE_COMMANDS.md`.)
Expected: command adds the two fields to the existing workspace(s).

- [ ] **Step 4: Verify existing workspace got the fields (Postgres MCP)**

Query the same `fieldMetadata` select as Task 1 Step 6 against the current (non-reset) DB, plus confirm the `status` column exists on the opportunity table in the workspace schema and existing rows are `OPEN`.
Expected: fields present, existing opportunities `status='OPEN'`, `closedAt` NULL.

- [ ] **Step 5: Typecheck + lint**

Run: `npx nx typecheck twenty-server && npx nx lint:diff-with-main twenty-server --configuration=fix`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add packages/twenty-server/src/database/commands/upgrade-version-command/
git commit -m "feat(server): backfill Opportunity won/lost fields to existing workspaces"
```

---

### Task 3: Regenerate GraphQL types

**Files:**
- Modify (generated): `packages/twenty-front/src/generated*/**` (graphql codegen output)

- [ ] **Step 1: Regenerate**

Run: `npx nx run twenty-front:graphql:generate` and `npx nx run twenty-front:graphql:generate --configuration=metadata`
(Server must be running with the updated schema.)

- [ ] **Step 2: Typecheck front**

Run: `npx nx typecheck twenty-front`
Expected: 0 errors; `status`/`closedAt` now present in the Opportunity generated types.

- [ ] **Step 3: Commit**

```bash
git add packages/twenty-front/src/generated*
git commit -m "chore(front): regenerate graphql for opportunity won/lost fields"
```

---

### Task 4: Status→variant mapping + StatusPill in Opportunity detail

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/utils/opportunityStatusPillVariant.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/utils/__tests__/opportunityStatusPillVariant.test.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityStatusPill.tsx`

**Interfaces:**
- Consumes: `StatusPill` + `StatusPillVariant` from `twenty-ui` (`import { StatusPill } from 'twenty-ui/data-display'` — confirm the exact export path from the Phase-1b barrel).
- Produces: `opportunityStatusPillVariant(status: string): StatusPillVariant`; `OpportunityStatusPill` component consumed by Task 5.

- [ ] **Step 1: Write the failing mapping test**

```ts
import { opportunityStatusPillVariant } from '../opportunityStatusPillVariant';

describe('opportunityStatusPillVariant', () => {
  it('maps opportunity status to a StatusPill variant', () => {
    expect(opportunityStatusPillVariant('WON')).toBe('success');
    expect(opportunityStatusPillVariant('LOST')).toBe('danger');
    expect(opportunityStatusPillVariant('OPEN')).toBe('neutral');
    expect(opportunityStatusPillVariant('anything-else')).toBe('neutral');
  });
});
```

- [ ] **Step 2: Run it, verify fail**

Run: `cd packages/twenty-front && npx jest opportunityStatusPillVariant`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the mapping**

```ts
import { type StatusPillVariant } from 'twenty-ui/data-display';

export const opportunityStatusPillVariant = (
  status: string,
): StatusPillVariant => {
  if (status === 'WON') return 'success';
  if (status === 'LOST') return 'danger';
  return 'neutral';
};
```

- [ ] **Step 4: Run it, verify pass**

Run: `cd packages/twenty-front && npx jest opportunityStatusPillVariant`
Expected: PASS.

- [ ] **Step 5: Implement the component**

```tsx
import { StatusPill } from 'twenty-ui/data-display';

import { opportunityStatusPillVariant } from '@/object-record/record-show/opportunity/utils/opportunityStatusPillVariant';

type OpportunityStatusPillProps = { status: string; label: string };

export const OpportunityStatusPill = ({
  status,
  label,
}: OpportunityStatusPillProps) => (
  <StatusPill variant={opportunityStatusPillVariant(status)} label={label} withDot />
);
```

- [ ] **Step 6: Typecheck + lint + commit**

Run: `npx nx typecheck twenty-front` and lint/format the new files.
```bash
git add packages/twenty-front/src/modules/object-record/record-show/opportunity/
git commit -m "feat(front): opportunity status pill + variant mapping"
```

---

### Task 5: Won/Lost/Reopen actions on the Opportunity detail

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/OpportunityWonLostActions.tsx`
- Create: `packages/twenty-front/src/modules/object-record/record-show/opportunity/components/__tests__/OpportunityWonLostActions.test.tsx`
- Modify: the Opportunity record-show header/summary render location (Step 1 identifies it — likely `RecordShowPageHeader.tsx` or a summary-card slot; gate on `objectNameSingular === 'opportunity'`).

**Interfaces:**
- Consumes: `useUpdateOneRecord` (confirm hook name/signature by reading an existing caller under `object-record/hooks`), `OpportunityStatusPill` from Task 4, `Button` from `twenty-ui/input`.

- [ ] **Step 1: Locate the Opportunity detail header/summary render + the record-update hook.** Read `packages/twenty-front/src/pages/object-record/RecordShowPageHeader.tsx` and `ShowPageSummaryCard.tsx`; find where object-specific header content can be inserted and the standard `useUpdateOneRecord` usage pattern (grep `useUpdateOneRecord` for a call example with `objectNameSingular` + `updateOneRecord({ idToUpdate, updateOneRecordInput })`).

- [ ] **Step 2: Write the failing behavior test** (mock the update hook; assert the payloads):

```tsx
// Render OpportunityWonLostActions with a mocked updateOneRecord; assert:
// - clicking "Mark as Won" calls updateOneRecord with { status: 'WON', closedAt: <non-null ISO> }
// - clicking "Mark as Lost" calls updateOneRecord with { status: 'LOST', closedAt: <non-null ISO> }
// - when status already WON/LOST, "Reopen" calls with { status: 'OPEN', closedAt: null }
```
(Write the concrete test using `@testing-library/react` + `user-event`, mocking the update hook the component uses — follow an existing record-action component test for the harness/provider wrappers.)

- [ ] **Step 3: Run it, verify fail**

Run: `cd packages/twenty-front && npx jest OpportunityWonLostActions`
Expected: FAIL (component not found).

- [ ] **Step 4: Implement `OpportunityWonLostActions`**

```tsx
import { Button } from 'twenty-ui/input';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { OpportunityStatusPill } from '@/object-record/record-show/opportunity/components/OpportunityStatusPill';

type OpportunityWonLostActionsProps = {
  recordId: string;
  status: string;
  statusLabel: string;
};

export const OpportunityWonLostActions = ({
  recordId,
  status,
  statusLabel,
}: OpportunityWonLostActionsProps) => {
  const { updateOneRecord } = useUpdateOneRecord({
    objectNameSingular: 'opportunity',
  });

  const setOutcome = (nextStatus: 'OPEN' | 'WON' | 'LOST') =>
    updateOneRecord({
      idToUpdate: recordId,
      updateOneRecordInput: {
        status: nextStatus,
        closedAt: nextStatus === 'OPEN' ? null : new Date().toISOString(),
      },
    });

  const isClosed = status === 'WON' || status === 'LOST';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <OpportunityStatusPill status={status} label={statusLabel} />
      {isClosed ? (
        <Button
          variant="secondary"
          title="Reopen"
          onClick={() => setOutcome('OPEN')}
        />
      ) : (
        <>
          <Button
            variant="primary"
            accent="green"
            title="Mark as Won"
            onClick={() => setOutcome('WON')}
          />
          <Button
            variant="primary"
            accent="danger"
            title="Mark as Lost"
            onClick={() => setOutcome('LOST')}
          />
        </>
      )}
    </div>
  );
};
```
(Adjust `updateOneRecordInput` field names to the exact generated input type from Task 3; wrap button titles in `t\`\`` per Lingui if the surrounding file does.)

- [ ] **Step 5: Run test, verify pass**

Run: `cd packages/twenty-front && npx jest OpportunityWonLostActions`
Expected: PASS.

- [ ] **Step 6: Wire into the Opportunity detail header** at the insertion point found in Step 1, gated on `objectNameSingular === 'opportunity'`, passing the record id + current `status`/status label from the record.

- [ ] **Step 7: Typecheck + lint**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix`
Expected: 0 errors.

- [ ] **Step 8: Live verify**

Start app (docker + server + front; user logs in). Open an Opportunity → click Won (pill green, closedAt set), Lost (red), Reopen (neutral, closedAt cleared). Light + dark. Screenshot.

- [ ] **Step 9: Commit**

```bash
git add packages/twenty-front/src/modules/object-record/record-show/opportunity/
git commit -m "feat(front): won/lost/reopen actions on opportunity detail"
```

---

## Self-Review notes
- Spec coverage: status+closedAt fields (spec Data model → Task 1), backfill migration (spec Migration → Task 2), GraphQL (spec GraphQL → Task 3), StatusPill display (spec Frontend §2 → Task 4), Won/Lost/Reopen actions (spec Frontend §1 → Task 5). Non-goals respected (no lostReason/reporting/board-drag/server-hook).
- Type consistency: `status` values `OPEN|WON|LOST`, `closedAt` ISO/null, `StatusPillVariant` `success|danger|neutral` used consistently across Tasks 4–5.
- Known unknowns pushed into the first step of the owning task (exact field universal-id derivation for the command, exact detail insertion point, exact `useUpdateOneRecord` signature) — each is a concrete "read this file, match this pattern" step, not a deferred requirement.
- Task 1 Step 6 uses a full DB reset — acceptable in dev; Task 2 proves the non-reset backfill path separately.
