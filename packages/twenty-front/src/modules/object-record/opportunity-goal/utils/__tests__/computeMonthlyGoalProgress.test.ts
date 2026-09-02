import { computeMonthlyGoalProgress } from '@/object-record/opportunity-goal/utils/computeMonthlyGoalProgress';

// now = 15 June 2026
const NOW = new Date('2026-06-15T12:00:00.000Z');
const M = 1_000_000;
const iso = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d, 12)).toISOString();

describe('computeMonthlyGoalProgress', () => {
  it('sums won amounts closed in the current month into achievedMicros', () => {
    const result = computeMonthlyGoalProgress(
      [
        { amountMicros: 10 * M, closedAt: iso(2026, 6, 3) },
        { amountMicros: 5 * M, closedAt: iso(2026, 6, 20) },
        { amountMicros: 99 * M, closedAt: iso(2026, 5, 30) }, // last month
      ],
      100 * M,
      NOW,
    );
    expect(result.current.achievedMicros).toBe(15 * M);
    expect(result.current.targetMicros).toBe(100 * M);
    expect(result.current.ratio).toBeCloseTo(0.15);
  });

  it('ignores deals with null closedAt or null amount', () => {
    const result = computeMonthlyGoalProgress(
      [
        { amountMicros: 10 * M, closedAt: null },
        { amountMicros: null, closedAt: iso(2026, 6, 3) },
        { amountMicros: 7 * M, closedAt: iso(2026, 6, 10) },
      ],
      null,
      NOW,
    );
    expect(result.current.achievedMicros).toBe(7 * M);
  });

  it('returns a null ratio when the target is null or zero', () => {
    expect(computeMonthlyGoalProgress([], null, NOW).current.ratio).toBeNull();
    expect(computeMonthlyGoalProgress([], 0, NOW).current.ratio).toBeNull();
  });

  it('returns monthsBack months ending at now, oldest first, with per-month sums', () => {
    const result = computeMonthlyGoalProgress(
      [
        { amountMicros: 4 * M, closedAt: iso(2026, 4, 5) },
        { amountMicros: 6 * M, closedAt: iso(2026, 6, 5) },
      ],
      50 * M,
      NOW,
      3,
    );
    expect(result.history).toEqual([
      { year: 2026, month: 4, achievedMicros: 4 * M },
      { year: 2026, month: 5, achievedMicros: 0 },
      { year: 2026, month: 6, achievedMicros: 6 * M },
    ]);
  });

  it('defaults history to 6 months and handles year rollover', () => {
    // now Jan 2026 → 6 months back reaches Aug 2025
    const result = computeMonthlyGoalProgress(
      [{ amountMicros: 3 * M, closedAt: iso(2025, 9, 9) }],
      null,
      new Date('2026-01-10T12:00:00.000Z'),
    );
    expect(result.history).toHaveLength(6);
    expect(result.history[0]).toEqual({
      year: 2025,
      month: 8,
      achievedMicros: 0,
    });
    expect(result.history[5]).toEqual({
      year: 2026,
      month: 1,
      achievedMicros: 0,
    });
    expect(
      result.history.find((b) => b.year === 2025 && b.month === 9)
        ?.achievedMicros,
    ).toBe(3 * M);
  });
});
