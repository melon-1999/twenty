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
