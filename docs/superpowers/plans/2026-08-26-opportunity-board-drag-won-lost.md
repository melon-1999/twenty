# Opportunity Board-Drag Won/Lost Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the Opportunities kanban board, drag a card onto a "Gewonnen" or "Verloren" drop zone to set its `status` (+ `closedAt`), reusing the generic record update path — no backend changes.

**Architecture:** A pure helper maps two sentinel drop-zone ids to a status. An opportunity-gated drop-zones bar renders inside the board's dnd provider using `@dnd-kit/react` `useDroppable`. The generic board `handleDragEnd` gets an early branch: if the drag ended over a won/lost zone id, it calls the board context's `updateOneRecord({ status, closedAt })` and returns, bypassing the stage/position chain.

**Tech Stack:** React 18, @dnd-kit/react, Linaria, Lingui, Jest + Testing Library.

## Global Constraints

- Never modify `/* @license Enterprise */` files.
- No signatures / Co-Authored-By in commits.
- Named exports only, no default exports, no `any`, types over interfaces, string literals over enums.
- Import via `@/` alias; the repo bans `../` parent imports including in tests.
- Wrap user-facing strings with `t` from `@lingui/core/macro`; after adding strings run `nx run twenty-front:lingui:extract`, fill `packages/twenty-front/src/locales/de-DE.po`, then `nx run twenty-front:lingui:compile`.
- Status values are canonical English: `'WON'` / `'LOST'`. Set `closedAt` to `new Date().toISOString()` on both.
- The feature must be opportunity-gated so non-opportunity boards are completely unaffected.
- Lint: `npx nx lint:diff-with-main twenty-front --configuration=fix`; typecheck: `npx nx typecheck twenty-front`; format: `npx nx fmt twenty-front`.

**Precedent / key files (read before the matching task):**
- Drop handler: `packages/twenty-front/src/modules/object-record/record-board/record-board-dnd/hooks/useRecordBoardDndKit.ts` — `handleDragEnd`, destructures `{ recordBoardId }` from `RecordBoardContext`, reads `event.operation.{source,target,position}`.
- Board context: `packages/twenty-front/src/modules/object-record/record-board/contexts/RecordBoardContext.ts` — exposes `objectMetadataItem` (has `nameSingular`), `updateOneRecord({ idToUpdate, updateOneRecordInput })`, `recordBoardId`.
- Board layout: `packages/twenty-front/src/modules/object-record/record-board/components/RecordBoard.tsx` — the `<RecordBoardDndKitProvider><RecordBoardColumns /></RecordBoardDndKitProvider>` block inside `StyledContainer`.
- Droppable precedent: `packages/twenty-front/src/modules/object-record/record-board/record-board-column/components/RecordBoardColumn.tsx:57` — `useDroppable({ id, collisionPriority: DND_KIT_COLLISION_PRIORITY, collisionDetector: pointerIntersection, type: RECORD_BOARD_COLUMN_DND_TYPE, accept: RECORD_BOARD_CARD_DND_TYPE })`; `useDroppable` (from `@dnd-kit/react`) returns `{ droppable, isDropTarget, ref }`.
- DND type constants: `.../record-board-dnd/constants/RecordBoardCardDndType.ts` (`RECORD_BOARD_CARD_DND_TYPE = 'card'`), `RecordBoardColumnDndType.ts` (`RECORD_BOARD_COLUMN_DND_TYPE = 'column'`). Find `DND_KIT_COLLISION_PRIORITY` + `pointerIntersection` imports as used in `RecordBoardColumn.tsx`.

---

## Task 1: Drop-zone status helper + constants

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/record-board/opportunity-status-drag/constants/opportunityStatusDropZones.ts`
- Create: `packages/twenty-front/src/modules/object-record/record-board/opportunity-status-drag/utils/getOpportunityStatusFromDropZone.ts`
- Test: `packages/twenty-front/src/modules/object-record/record-board/opportunity-status-drag/utils/__tests__/getOpportunityStatusFromDropZone.test.ts`

**Interfaces:**
- Produces:
  - `OPPORTUNITY_WON_DROP_ZONE_ID = 'opportunity-won-drop-zone'`, `OPPORTUNITY_LOST_DROP_ZONE_ID = 'opportunity-lost-drop-zone'`.
  - `getOpportunityStatusFromDropZone(dropZoneId: string | null): 'WON' | 'LOST' | null`.

- [ ] **Step 1: Write the constants.**

```ts
export const OPPORTUNITY_WON_DROP_ZONE_ID = 'opportunity-won-drop-zone';
export const OPPORTUNITY_LOST_DROP_ZONE_ID = 'opportunity-lost-drop-zone';
```

- [ ] **Step 2: Write the failing test.**

```ts
import { getOpportunityStatusFromDropZone } from '@/object-record/record-board/opportunity-status-drag/utils/getOpportunityStatusFromDropZone';
import {
  OPPORTUNITY_LOST_DROP_ZONE_ID,
  OPPORTUNITY_WON_DROP_ZONE_ID,
} from '@/object-record/record-board/opportunity-status-drag/constants/opportunityStatusDropZones';

describe('getOpportunityStatusFromDropZone', () => {
  it('maps the won zone id to WON', () => {
    expect(getOpportunityStatusFromDropZone(OPPORTUNITY_WON_DROP_ZONE_ID)).toBe(
      'WON',
    );
  });
  it('maps the lost zone id to LOST', () => {
    expect(
      getOpportunityStatusFromDropZone(OPPORTUNITY_LOST_DROP_ZONE_ID),
    ).toBe('LOST');
  });
  it('returns null for any other id or null', () => {
    expect(getOpportunityStatusFromDropZone('some-column-uuid')).toBeNull();
    expect(getOpportunityStatusFromDropZone(null)).toBeNull();
  });
});
```

- [ ] **Step 3: Run it, expect fail.**

Run: `cd packages/twenty-front && npx jest getOpportunityStatusFromDropZone`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement the helper.**

```ts
import {
  OPPORTUNITY_LOST_DROP_ZONE_ID,
  OPPORTUNITY_WON_DROP_ZONE_ID,
} from '@/object-record/record-board/opportunity-status-drag/constants/opportunityStatusDropZones';

export const getOpportunityStatusFromDropZone = (
  dropZoneId: string | null,
): 'WON' | 'LOST' | null => {
  if (dropZoneId === OPPORTUNITY_WON_DROP_ZONE_ID) {
    return 'WON';
  }

  if (dropZoneId === OPPORTUNITY_LOST_DROP_ZONE_ID) {
    return 'LOST';
  }

  return null;
};
```

- [ ] **Step 5: Run it, expect pass.**

Run: `cd packages/twenty-front && npx jest getOpportunityStatusFromDropZone`
Expected: PASS (3 tests).

- [ ] **Step 6: Typecheck + lint + commit.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix`
```bash
git add packages/twenty-front/src/modules/object-record/record-board/opportunity-status-drag/
git commit -m "feat(front): opportunity status drop-zone helper + constants"
```

---

## Task 2: Drop-zones bar component + board wiring

**Files:**
- Create: `packages/twenty-front/src/modules/object-record/record-board/opportunity-status-drag/components/RecordBoardOpportunityStatusDropZones.tsx`
- Modify: `packages/twenty-front/src/modules/object-record/record-board/components/RecordBoard.tsx` (render the zones inside the dnd provider)

**Interfaces:**
- Consumes: the zone id constants (Task 1); `RecordBoardContext` (`objectMetadataItem`); `useDroppable` + the DND type constants.
- Produces: `RecordBoardOpportunityStatusDropZones` (no props) — renders the bottom bar only for the opportunity board.

- [ ] **Step 1: Read** `RecordBoardColumn.tsx:57` (the `useDroppable` config + the `DND_KIT_COLLISION_PRIORITY` / `pointerIntersection` imports) and `RecordBoardContext.ts`.

- [ ] **Step 2: Implement the component.** Two `useDroppable` zones sharing the columns' dnd config (so cards accept them), highlighting on `isDropTarget`, gated on the opportunity object.

```tsx
import { useContext } from 'react';
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { pointerIntersection } from '@dnd-kit/collision';
import { useDroppable } from '@dnd-kit/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { RecordBoardContext } from '@/object-record/record-board/contexts/RecordBoardContext';
import { RECORD_BOARD_CARD_DND_TYPE } from '@/object-record/record-board/record-board-dnd/constants/RecordBoardCardDndType';
import { RECORD_BOARD_COLUMN_DND_TYPE } from '@/object-record/record-board/record-board-dnd/constants/RecordBoardColumnDndType';
import {
  OPPORTUNITY_LOST_DROP_ZONE_ID,
  OPPORTUNITY_WON_DROP_ZONE_ID,
} from '@/object-record/record-board/opportunity-status-drag/constants/opportunityStatusDropZones';

const StyledBar = styled.div`
  bottom: 0;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
  position: sticky;
  z-index: 10;
`;

const StyledZone = styled.div<{ variant: 'won' | 'lost'; isActive: boolean }>`
  align-items: center;
  border: 1px dashed
    ${({ variant }) =>
      variant === 'won'
        ? themeCssVariables.tag.text.green
        : themeCssVariables.tag.text.red};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${({ variant }) =>
    variant === 'won'
      ? themeCssVariables.tag.text.green
      : themeCssVariables.tag.text.red};
  background: ${({ variant, isActive }) =>
    isActive
      ? variant === 'won'
        ? themeCssVariables.tag.background.green
        : themeCssVariables.tag.background.red
      : 'transparent'};
  display: flex;
  flex: 1;
  font-size: ${themeCssVariables.font.size.sm};
  justify-content: center;
  padding: ${themeCssVariables.spacing[2]};
`;

export const RecordBoardOpportunityStatusDropZones = () => {
  const { objectMetadataItem } = useContext(RecordBoardContext);

  const wonDroppable = useDroppable({
    id: OPPORTUNITY_WON_DROP_ZONE_ID,
    collisionDetector: pointerIntersection,
    type: RECORD_BOARD_COLUMN_DND_TYPE,
    accept: RECORD_BOARD_CARD_DND_TYPE,
  });

  const lostDroppable = useDroppable({
    id: OPPORTUNITY_LOST_DROP_ZONE_ID,
    collisionDetector: pointerIntersection,
    type: RECORD_BOARD_COLUMN_DND_TYPE,
    accept: RECORD_BOARD_CARD_DND_TYPE,
  });

  if (objectMetadataItem.nameSingular !== CoreObjectNameSingular.Opportunity) {
    return null;
  }

  return (
    <StyledBar>
      <StyledZone
        ref={wonDroppable.ref}
        variant="won"
        isActive={wonDroppable.isDropTarget}
      >
        {t`Mark as Won`}
      </StyledZone>
      <StyledZone
        ref={lostDroppable.ref}
        variant="lost"
        isActive={lostDroppable.isDropTarget}
      >
        {t`Mark as Lost`}
      </StyledZone>
    </StyledBar>
  );
};
```

Notes for the implementer:
- Confirm the `pointerIntersection` import path against `RecordBoardColumn.tsx` (it is `@dnd-kit/collision` there — match whatever that file uses). The column also passes `collisionPriority: DND_KIT_COLLISION_PRIORITY`; include it identically if the column does, importing from the same place the column imports it.
- Verify the exact `themeCssVariables` token names for green/red tag background/text against `OpportunityRottingIndicator.tsx`/`OpportunityProbabilityBadge.tsx` (which already use `themeCssVariables.tag.*`) and adjust if a token name differs. If a `border.radius.md` token name differs, use the one those components use.
- `CoreObjectNameSingular.Opportunity` is the gate (same pattern as the rotting indicator).
- Hooks must be called before the early `return null` (as written) to respect the rules of hooks — the droppables register only matter when rendered, and returning null after the hooks is fine.

- [ ] **Step 3: Wire into `RecordBoard.tsx`.** Render the zones as a sibling of `RecordBoardColumns` INSIDE `RecordBoardDndKitProvider` (so it shares the drag context):

```tsx
<RecordBoardDndKitProvider>
  <RecordBoardColumns />
  <RecordBoardOpportunityStatusDropZones />
</RecordBoardDndKitProvider>
```

Add the import at the top of `RecordBoard.tsx`.

- [ ] **Step 4: Typecheck + lint + fmt.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix && npx nx fmt twenty-front`
Expected: 0 on touched files.

- [ ] **Step 5: Commit.**

```bash
git add -A
git commit -m "feat(front): opportunity won/lost board drop-zones bar"
```

---

## Task 3: Drop interception in handleDragEnd

**Files:**
- Modify: `packages/twenty-front/src/modules/object-record/record-board/record-board-dnd/hooks/useRecordBoardDndKit.ts`

**Interfaces:**
- Consumes: `getOpportunityStatusFromDropZone` (Task 1); `RecordBoardContext.updateOneRecord`.

- [ ] **Step 1: Read** the current `useRecordBoardDndKit.ts` `handleDragEnd` (it already destructures `{ recordBoardId }` from `RecordBoardContext`).

- [ ] **Step 2: Pull `updateOneRecord` from the context.** Change the context destructure:

```ts
const { recordBoardId, updateOneRecord } = useContext(RecordBoardContext);
```

Add the helper import at the top:

```ts
import { getOpportunityStatusFromDropZone } from '@/object-record/record-board/opportunity-status-drag/utils/getOpportunityStatusFromDropZone';
```

- [ ] **Step 3: Add the early branch in `handleDragEnd`.** Right after the existing guard `if (event.canceled || !isDefined(source)) { resetDragState(); return; }` and the `const sourceId = source.id;` line, insert — BEFORE the `resolveDropFromPointer` call:

```ts
const droppedOnStatus = getOpportunityStatusFromDropZone(
  isDefined(target?.id) ? String(target.id) : null,
);

if (isDefined(droppedOnStatus)) {
  updateOneRecord({
    idToUpdate: String(sourceId),
    updateOneRecordInput: {
      status: droppedOnStatus,
      closedAt: new Date().toISOString(),
    },
  });
  clearDragState();
  return;
}
```

`target` is already destructured from `event.operation` at the top of `handleDragEnd`. The branch fires only when the drag ended over one of the two sentinel zone ids, which exist only on the opportunity board (Task 2 gating), so no non-opportunity board is affected. It runs before `resolveDropFromPointer`/`processBoardCardDrop`, so the stage/position chain (and its `'Record group is not defined'` throw) is never reached for status drops.

- [ ] **Step 4: Typecheck + lint + fmt.**

Run: `npx nx typecheck twenty-front && npx nx lint:diff-with-main twenty-front --configuration=fix && npx nx fmt twenty-front`
Expected: 0 on touched files.

- [ ] **Step 5: i18n.** The new strings ("Mark as Won", "Mark as Lost") already exist in the catalog from the Won/Lost slice (the header buttons use them), so extract should add nothing new — but run it to be safe: `npx nx run twenty-front:lingui:extract`, confirm `de-DE.po` already has "Als gewonnen markieren"/"Als verloren markieren" for those msgids (fill if missing), then `npx nx run twenty-front:lingui:compile`.

- [ ] **Step 6: Commit.**

```bash
git add -A
git commit -m "feat(front): set opportunity status on won/lost board drop"
```

---

## Live verification (before final review)

Dev instance (in-app browser + Postgres MCP, workspace `workspace_78jtyayrql5p8djgplk9x6vy`). Open the Opportunities board (kanban grouped by Phase):

1. The "Gewonnen" (green) and "Verloren" (red) zones show as a bar at the bottom of the board.
2. Drag an open deal card onto "Gewonnen" → DB row: `status='WON'`, `closedAt` set; the card stays in its stage column.
3. Drag another onto "Verloren" → `status='LOST'`, `closedAt` set, `lostReason` stays null (no reason on drag).
4. A non-opportunity board (e.g. if any other object has a kanban view) shows NO zones.
5. Dragging a card between stage columns still works normally (stage changes, no status change).
6. Reopen/restore the test deals afterwards (header "Wieder öffnen") so the dev data returns to OPEN.

## Notes for the executor

- The interception is id-based: the sentinel zone ids only exist on the opportunity board, so the generic `handleDragEnd` branch is inert everywhere else. Do not add stage/position logic to the status path.
- No backend changes; `status`/`closedAt` already exist. No `lostReason` is set on drag (reason stays the header dropdown flow).
- Keep the zones inside `RecordBoardDndKitProvider`, or they won't share the drag context and drops won't register.
