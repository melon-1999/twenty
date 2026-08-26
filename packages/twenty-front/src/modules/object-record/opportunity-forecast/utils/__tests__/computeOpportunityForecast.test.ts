import {
  computeOpportunityForecast,
  type OpportunityForecastInput,
} from '@/object-record/opportunity-forecast/utils/computeOpportunityForecast';

const row = (
  closeDate: string | null,
  amountMicros: number | null,
  probability: number | null,
): OpportunityForecastInput => ({ closeDate, amountMicros, probability });

describe('computeOpportunityForecast', () => {
  it('buckets by close month and sums unweighted + weighted micros', () => {
    const result = computeOpportunityForecast([
      row('2026-08-10T00:00:00.000Z', 10_000_000, 80),
      row('2026-08-25T00:00:00.000Z', 20_000_000, 50),
      row('2026-09-01T00:00:00.000Z', 40_000_000, 25),
    ]);

    expect(result.buckets).toHaveLength(2);
    expect(result.buckets[0]).toMatchObject({
      monthKey: '2026-08',
      year: 2026,
      month: 7,
      hasDate: true,
      count: 2,
      totalMicros: 30_000_000,
      weightedMicros: 18_000_000, // 8_000_000 + 10_000_000
    });
    expect(result.buckets[1]).toMatchObject({
      monthKey: '2026-09',
      count: 1,
      totalMicros: 40_000_000,
      weightedMicros: 10_000_000,
    });
    expect(result.totalCount).toBe(3);
    expect(result.totalMicros).toBe(70_000_000);
    expect(result.totalWeightedMicros).toBe(28_000_000);
  });

  it('puts null-closeDate rows in a no-date bucket sorted last', () => {
    const result = computeOpportunityForecast([
      row(null, 5_000_000, 100),
      row('2026-08-10T00:00:00.000Z', 10_000_000, 50),
    ]);

    expect(result.buckets.map((b) => b.monthKey)).toEqual([
      '2026-08',
      'no-date',
    ]);
    expect(result.buckets[1]).toMatchObject({
      monthKey: 'no-date',
      hasDate: false,
      count: 1,
      totalMicros: 5_000_000,
      weightedMicros: 5_000_000,
    });
  });

  it('treats null amount or null probability as zero contribution', () => {
    const result = computeOpportunityForecast([
      row('2026-08-10T00:00:00.000Z', null, 80),
      row('2026-08-11T00:00:00.000Z', 10_000_000, null),
    ]);

    expect(result.buckets[0]).toMatchObject({
      count: 2,
      totalMicros: 10_000_000,
      weightedMicros: 0,
    });
    expect(result.totalWeightedMicros).toBe(0);
  });

  it('returns empty aggregates for no rows', () => {
    const result = computeOpportunityForecast([]);
    expect(result).toEqual({
      buckets: [],
      totalCount: 0,
      totalMicros: 0,
      totalWeightedMicros: 0,
    });
  });
});
