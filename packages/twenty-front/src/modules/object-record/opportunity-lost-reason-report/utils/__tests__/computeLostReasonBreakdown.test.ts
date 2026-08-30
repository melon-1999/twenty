import {
  computeLostReasonBreakdown,
  type LostReasonInput,
} from '@/object-record/opportunity-lost-reason-report/utils/computeLostReasonBreakdown';

const row = (
  lostReason: string | null,
  amountMicros: number | null,
): LostReasonInput => ({ lostReason, amountMicros });

describe('computeLostReasonBreakdown', () => {
  it('groups by reason and sums count + amount, sorted by amount desc', () => {
    const result = computeLostReasonBreakdown([
      row('TOO_EXPENSIVE', 10_000_000),
      row('LOST_TO_COMPETITOR', 50_000_000),
      row('TOO_EXPENSIVE', 20_000_000),
    ]);

    expect(result.buckets).toEqual([
      { reason: 'LOST_TO_COMPETITOR', hasReason: true, count: 1, totalMicros: 50_000_000 },
      { reason: 'TOO_EXPENSIVE', hasReason: true, count: 2, totalMicros: 30_000_000 },
    ]);
    expect(result.totalCount).toBe(3);
    expect(result.totalMicros).toBe(80_000_000);
  });

  it('collects null/empty reason into a no-reason bucket sorted last', () => {
    const result = computeLostReasonBreakdown([
      row(null, 90_000_000),
      row('NO_BUDGET', 10_000_000),
    ]);

    expect(result.buckets.map((bucket) => bucket.reason)).toEqual([
      'NO_BUDGET',
      'no-reason',
    ]);
    expect(result.buckets[1]).toEqual({
      reason: 'no-reason',
      hasReason: false,
      count: 1,
      totalMicros: 90_000_000,
    });
  });

  it('treats null amount as zero', () => {
    const result = computeLostReasonBreakdown([row('OTHER', null)]);
    expect(result.buckets[0]).toEqual({
      reason: 'OTHER',
      hasReason: true,
      count: 1,
      totalMicros: 0,
    });
    expect(result.totalMicros).toBe(0);
  });

  it('returns empty aggregates for no rows', () => {
    expect(computeLostReasonBreakdown([])).toEqual({
      buckets: [],
      totalCount: 0,
      totalMicros: 0,
    });
  });
});
