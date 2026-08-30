const MS_PER_DAY = 1000 * 60 * 60 * 24;

type StageOption = { value: string; label: string };

type StageDurationInput = {
  stage: string | null;
  stageChangedAt: string | null;
};

export type StageDurationBucket = {
  stage: string;
  label: string;
  openCount: number;
  averageDays: number | null;
};

export type StageDurationBreakdownResult = {
  buckets: StageDurationBucket[];
  totalOpenCount: number;
};

export const computeStageDurationBreakdown = (
  orderedStages: StageOption[],
  deals: StageDurationInput[],
  now: Date,
): StageDurationBreakdownResult => {
  const nowMs = now.getTime();

  const buckets = orderedStages.map(({ value, label }): StageDurationBucket => {
    const stageDeals = deals.filter((deal) => deal.stage === value);

    const ages = stageDeals
      .map((deal) => deal.stageChangedAt)
      .filter(
        (changedAt): changedAt is string =>
          changedAt !== null && changedAt !== '',
      )
      .map((changedAt) =>
        Math.max(
          0,
          Math.floor((nowMs - new Date(changedAt).getTime()) / MS_PER_DAY),
        ),
      );

    const averageDays =
      ages.length > 0
        ? ages.reduce((sum, age) => sum + age, 0) / ages.length
        : null;

    return { stage: value, label, openCount: stageDeals.length, averageDays };
  });

  const totalOpenCount = buckets.reduce(
    (sum, bucket) => sum + bucket.openCount,
    0,
  );

  return { buckets, totalOpenCount };
};
