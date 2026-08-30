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
