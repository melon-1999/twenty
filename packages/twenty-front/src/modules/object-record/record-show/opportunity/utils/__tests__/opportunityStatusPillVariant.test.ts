import { opportunityStatusPillVariant } from '@/object-record/record-show/opportunity/utils/opportunityStatusPillVariant';

describe('opportunityStatusPillVariant', () => {
  it('maps opportunity status to a StatusPill variant', () => {
    expect(opportunityStatusPillVariant('WON')).toBe('success');
    expect(opportunityStatusPillVariant('LOST')).toBe('danger');
    expect(opportunityStatusPillVariant('OPEN')).toBe('neutral');
    expect(opportunityStatusPillVariant('anything-else')).toBe('neutral');
  });
});
