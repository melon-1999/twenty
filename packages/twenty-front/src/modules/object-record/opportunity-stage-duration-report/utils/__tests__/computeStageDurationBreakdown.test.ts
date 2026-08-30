import {
  computeStageDurationBreakdown,
  type StageDurationBucket,
} from '@/object-record/opportunity-stage-duration-report/utils/computeStageDurationBreakdown';

const STAGES = [
  { value: 'NEW', label: 'New' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'MEETING', label: 'Meeting' },
];

// Fixed reference "now" so day math is deterministic.
const NOW = new Date('2026-08-30T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

describe('computeStageDurationBreakdown', () => {
  it('returns one bucket per stage in the given order, including empty stages', () => {
    const result = computeStageDurationBreakdown(STAGES, [], NOW);

    expect(result.buckets.map((bucket) => bucket.stage)).toEqual([
      'NEW',
      'SCREENING',
      'MEETING',
    ]);
    expect(result.buckets.every((bucket) => bucket.openCount === 0)).toBe(true);
    expect(result.buckets.every((bucket) => bucket.averageDays === null)).toBe(
      true,
    );
    expect(result.totalOpenCount).toBe(0);
  });

  it('averages current stage age over dated deals and counts them per stage', () => {
    const result = computeStageDurationBreakdown(
      STAGES,
      [
        { stage: 'NEW', stageChangedAt: daysAgo(2) },
        { stage: 'NEW', stageChangedAt: daysAgo(4) },
        { stage: 'SCREENING', stageChangedAt: daysAgo(10) },
      ],
      NOW,
    );

    const byStage = Object.fromEntries(
      result.buckets.map((bucket): [string, StageDurationBucket] => [
        bucket.stage,
        bucket,
      ]),
    );
    expect(byStage.NEW.openCount).toBe(2);
    expect(byStage.NEW.averageDays).toBe(3);
    expect(byStage.SCREENING.openCount).toBe(1);
    expect(byStage.SCREENING.averageDays).toBe(10);
    expect(byStage.MEETING.averageDays).toBeNull();
    expect(result.totalOpenCount).toBe(3);
  });

  it('counts a deal with no stageChangedAt in openCount but excludes it from the average', () => {
    const result = computeStageDurationBreakdown(
      STAGES,
      [
        { stage: 'NEW', stageChangedAt: daysAgo(6) },
        { stage: 'NEW', stageChangedAt: null },
      ],
      NOW,
    );

    const newBucket = result.buckets.find((bucket) => bucket.stage === 'NEW');
    expect(newBucket?.openCount).toBe(2);
    expect(newBucket?.averageDays).toBe(6);
  });

  it('ignores deals whose stage is null or matches no known stage option', () => {
    const result = computeStageDurationBreakdown(
      STAGES,
      [
        { stage: null, stageChangedAt: daysAgo(3) },
        { stage: 'ARCHIVED', stageChangedAt: daysAgo(3) },
      ],
      NOW,
    );

    expect(result.buckets.every((bucket) => bucket.openCount === 0)).toBe(true);
    expect(result.totalOpenCount).toBe(0);
  });

  it('floors per-deal age at 0 for a future timestamp', () => {
    const result = computeStageDurationBreakdown(
      STAGES,
      [{ stage: 'NEW', stageChangedAt: daysAgo(-5) }],
      NOW,
    );

    const newBucket = result.buckets.find((bucket) => bucket.stage === 'NEW');
    expect(newBucket?.averageDays).toBe(0);
  });
});
