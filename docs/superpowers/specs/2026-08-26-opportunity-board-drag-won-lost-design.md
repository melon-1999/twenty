# Opportunity Board-Drag Won/Lost — Design

Date: 2026-08-26
Status: Approved (pending user spec review)
Sub-project 6 of the Pipedrive-semantics track. UX shortcut for the existing Won/Lost lifecycle.

## Goal

On the Opportunities kanban board, drag a deal card onto a "Gewonnen" or "Verloren" drop
zone to set its status — a Pipedrive-style gesture on top of the existing Won/Lost lifecycle.
No new backend: it reuses the `status`/`closedAt` fields and the generic record update path.

Builds on the merged Won/Lost lifecycle (`status` OPEN/WON/LOST, `closedAt`) and the existing
RecordBoard drag-and-drop (dnd-kit).

## Board internals (recon summary)

- The board uses **@dnd-kit/react**. The drop handler is `handleDragEnd` in
  `useRecordBoardDndKit.ts`; it resolves the destination droppable and calls the choke-point
  `processBoardCardDrop(...)`, which ultimately writes the **kanban field** (for Opportunities,
  `stage`) via `updateDroppedRecordOnBoard` — hardcoded to the single kanban field.
- Columns are droppables identified by `RecordGroupDefinition.id`; cards are draggables
  identified by the record UUID; the source column id travels in `DragDropItemData.droppableId`.
- `RecordBoardContext` exposes `objectMetadataItem` (has `nameSingular`) and a generic
  `updateOneRecord({ idToUpdate, updateOneRecordInput })` that accepts ANY partial record
  fields — the reuse path for setting `status` without touching the stage/position logic.
- `processGroupDrop` throws `'Record group is not defined'` if a droppable id is not a real
  record group — so a status drop zone MUST be intercepted BEFORE that chain runs.

## Design

### Drop zones component
New `RecordBoardOpportunityStatusDropZones.tsx`, rendered as a sibling of `RecordBoardColumns`
inside `RecordBoard.tsx`'s `StyledContainer` (inside the dnd provider), gated on
`objectMetadataItem.nameSingular === 'opportunity'` (read from `RecordBoardContext`). It renders
an always-visible bar pinned at the bottom of the board with two `useDroppable` zones:

- **Gewonnen** — id `won-drop-zone`, green.
- **Verloren** — id `lost-drop-zone`, red.

Both use the existing `RECORD_BOARD_COLUMN_DND_TYPE` and `accept: RECORD_BOARD_CARD_DND_TYPE`
so cards can be dropped on them without any sensor/collision changes. Each zone highlights while
a card is dragged over it (dnd-kit `isDropTarget`/over state). The zone ids are exported as
constants (`OPPORTUNITY_WON_DROP_ZONE_ID` / `OPPORTUNITY_LOST_DROP_ZONE_ID`) so the drop handler
and the component share one source of truth.

### Drop interception
In `useRecordBoardDndKit.handleDragEnd`, add an early branch: after reading the drag operation
but BEFORE `resolveDropFromPointer`/`processBoardCardDrop`, determine the raw destination
droppable id and run it through a pure helper
`getOpportunityStatusFromDropZone(dropZoneId): 'WON' | 'LOST' | null`. If it returns a status,
call `updateOneRecord({ idToUpdate: draggedRecordId, updateOneRecordInput: { status, closedAt } })`
from `RecordBoardContext` (the hook must additionally consume that context), then
`clearDragState()` and return — skipping the stage/position chain entirely.

- WON → `{ status: 'WON', closedAt: <now ISO> }`.
- LOST → `{ status: 'LOST', closedAt: <now ISO> }` (no reason — reason stays the explicit
  header dropdown flow, per decision).

`draggedRecordId` is the drag source id (the card's record UUID) already available in the drag
event. Only the single dragged card is affected (multi-select status via drag is a non-goal).

### Behavior after drop
The card remains in its stage column (the board groups by `stage`, unchanged) but is now
WON/LOST; the status is reflected on the detail page pill, the table, and any board status
surfacing. Closed deals are not filtered out of the board (non-goal).

## Testing

- `getOpportunityStatusFromDropZone` pure unit test (TDD): the two zone ids → 'WON'/'LOST', any
  other id → null.
- The update-input builder (a tiny pure helper `buildOpportunityStatusUpdate(status, nowIso)`
  returning `{ status, closedAt }`) unit-tested if extracted, or asserted inline.
- Drop-zones component: renders both zones only for the opportunity board (gated), nothing for
  other objects — a render test.
- Live-verify the drag on the dev board: drag a card onto Gewonnen → status WON + closedAt in
  DB; onto Verloren → status LOST + closedAt; the card stays in its column; restore afterwards.

## Non-goals

Reason menu on the Lost drop (reason stays the header dropdown); multi-select status via drag;
filtering closed deals off the board; drag-to-reopen (reopening stays an explicit header action);
changing the kanban grouping. No backend changes.

## Build order

Single slice (own plan): pure helper + drop-zones component + handleDragEnd interception +
RecordBoard wiring + tests + i18n. Merge.
