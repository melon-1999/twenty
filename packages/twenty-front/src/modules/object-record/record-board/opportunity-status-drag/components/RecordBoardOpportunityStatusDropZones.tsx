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
import { DND_KIT_COLLISION_PRIORITY } from '@/ui/utilities/drag-and-drop/constants/DndKitCollisionPriority';
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
    collisionPriority: DND_KIT_COLLISION_PRIORITY,
    collisionDetector: pointerIntersection,
    type: RECORD_BOARD_COLUMN_DND_TYPE,
    accept: RECORD_BOARD_CARD_DND_TYPE,
  });

  const lostDroppable = useDroppable({
    id: OPPORTUNITY_LOST_DROP_ZONE_ID,
    collisionPriority: DND_KIT_COLLISION_PRIORITY,
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
