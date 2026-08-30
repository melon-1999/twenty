import {
  computeStagePipelineBreakdown,
  type StagePipelineBucket,
} from '@/object-record/opportunity-pipeline-analysis/utils/computeStagePipelineBreakdown';

const STAGES = [
  { value: 'NEW', label: 'New' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'MEETING', label: 'Meeting' },
];

const byStage = (result: { buckets: StagePipelineBucket[] }) =>
  Object.fromEntries(result.buckets.map((bucket) => [bucket.stage, bucket]));

describe('computeStagePipelineBreakdown', () => {
  it('returns one bucket per stage in order, all empty for no deals', () => {
    const result = computeStagePipelineBreakdown(STAGES, []);
    expect(result.buckets.map((bucket) => bucket.stage)).toEqual([
      'NEW',
      'SCREENING',
      'MEETING',
    ]);
    expect(
      result.buckets.every(
        (bucket) =>
          bucket.reachedCount === 0 &&
          bucket.averageDurationDays === null &&
          bucket.conversionToNextRate === null,
      ),
    ).toBe(true);
  });

  it('counts reached deals monotonically, tolerating skipped stages', () => {
    // Deal A reached MEETING (skipping SCREENING); Deal B stopped at SCREENING.
    const result = computeStagePipelineBreakdown(STAGES, [
      {
        stageHistory: [
          { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
          { stage: 'MEETING', enteredAt: '2026-08-05T00:00:00.000Z' },
        ],
      },
      {
        stageHistory: [
          { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
          { stage: 'SCREENING', enteredAt: '2026-08-03T00:00:00.000Z' },
        ],
      },
    ]);
    const buckets = byStage(result);
    expect(buckets.NEW.reachedCount).toBe(2);
    expect(buckets.SCREENING.reachedCount).toBe(2);
    expect(buckets.MEETING.reachedCount).toBe(1);
  });

  it('averages historical duration over completed passes, excluding the open last stage', () => {
    const result = computeStagePipelineBreakdown(STAGES, [
      {
        stageHistory: [
          { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
          { stage: 'SCREENING', enteredAt: '2026-08-03T00:00:00.000Z' },
          { stage: 'MEETING', enteredAt: '2026-08-09T00:00:00.000Z' },
        ],
      },
    ]);
    const buckets = byStage(result);
    // NEW: 2 days, SCREENING: 6 days, MEETING: still open -> null
    expect(buckets.NEW.averageDurationDays).toBe(2);
    expect(buckets.SCREENING.averageDurationDays).toBe(6);
    expect(buckets.MEETING.averageDurationDays).toBeNull();
  });

  it('computes conversion as reached[i+1]/reached[i], null for the last stage and for divide-by-zero', () => {
    const result = computeStagePipelineBreakdown(STAGES, [
      {
        stageHistory: [
          { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
          { stage: 'SCREENING', enteredAt: '2026-08-03T00:00:00.000Z' },
        ],
      },
      {
        stageHistory: [{ stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' }],
      },
    ]);
    const buckets = byStage(result);
    // reached NEW=2, SCREENING=1, MEETING=0
    expect(buckets.NEW.conversionToNextRate).toBe(0.5);
    expect(buckets.SCREENING.conversionToNextRate).toBe(0); // 0/1
    expect(buckets.MEETING.conversionToNextRate).toBeNull(); // last stage
  });

  it('floors per-pass duration at 0 and ignores unknown-stage entries', () => {
    const result = computeStagePipelineBreakdown(STAGES, [
      {
        stageHistory: [
          { stage: 'NEW', enteredAt: '2026-08-01T12:00:00.000Z' },
          { stage: 'ARCHIVED', enteredAt: '2026-08-01T18:00:00.000Z' },
          { stage: 'SCREENING', enteredAt: '2026-08-01T20:00:00.000Z' },
        ],
      },
    ]);
    const buckets = byStage(result);
    // ARCHIVED unknown -> dropped. NEW->SCREENING span 8h -> floor 0.
    expect(buckets.NEW.averageDurationDays).toBe(0);
    expect(buckets.NEW.reachedCount).toBe(1);
    expect(buckets.SCREENING.reachedCount).toBe(1);
  });
});
