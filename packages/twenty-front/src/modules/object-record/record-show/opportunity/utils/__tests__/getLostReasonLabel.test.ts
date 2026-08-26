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
