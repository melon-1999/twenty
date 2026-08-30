const MS_PER_DAY = 1000 * 60 * 60 * 24;

type StageOption = { value: string; label: string };

type StageHistoryEntry = { stage: string; enteredAt: string };

type PipelineDealInput = { stageHistory: StageHistoryEntry[] | null };

export type StagePipelineBucket = {
  stage: string;
  label: string;
  reachedCount: number;
  averageDurationDays: number | null;
  conversionToNextRate: number | null;
};

export type StagePipelineBreakdownResult = {
  buckets: StagePipelineBucket[];
};

export const computeStagePipelineBreakdown = (
  orderedStages: StageOption[],
  deals: PipelineDealInput[],
): StagePipelineBreakdownResult => {
  const positionByStage = new Map(
    orderedStages.map((option, index) => [option.value, index]),
  );

  const reachedCounts = orderedStages.map(() => 0);
  const durationSamples: number[][] = orderedStages.map(() => []);

  for (const deal of deals) {
    const knownEntries = (deal.stageHistory ?? [])
      .filter((entry) => positionByStage.has(entry.stage))
      .slice()
      .sort((a, b) => a.enteredAt.localeCompare(b.enteredAt));

    if (knownEntries.length === 0) {
      continue;
    }

    let maxReachedPosition = -1;
    for (const entry of knownEntries) {
      const position = positionByStage.get(entry.stage) ?? -1;
      if (position > maxReachedPosition) {
        maxReachedPosition = position;
      }
    }
    for (let index = 0; index <= maxReachedPosition; index++) {
      reachedCounts[index] += 1;
    }

    for (let index = 0; index < knownEntries.length - 1; index++) {
      const fromPosition = positionByStage.get(knownEntries[index].stage) ?? -1;
      const days = Math.max(
        0,
        Math.floor(
          (new Date(knownEntries[index + 1].enteredAt).getTime() -
            new Date(knownEntries[index].enteredAt).getTime()) /
            MS_PER_DAY,
        ),
      );
      durationSamples[fromPosition].push(days);
    }
  }

  const buckets = orderedStages.map((option, index): StagePipelineBucket => {
    const samples = durationSamples[index];
    const averageDurationDays =
      samples.length > 0
        ? samples.reduce((sum, value) => sum + value, 0) / samples.length
        : null;

    const isLast = index === orderedStages.length - 1;
    let conversionToNextRate: number | null = null;
    // Last stage has no "next"; divide-by-zero (nobody reached this stage)
    // also stays null.
    if (!isLast && reachedCounts[index] > 0) {
      conversionToNextRate = reachedCounts[index + 1] / reachedCounts[index];
    }

    return {
      stage: option.value,
      label: option.label,
      reachedCount: reachedCounts[index],
      averageDurationDays,
      conversionToNextRate,
    };
  });

  return { buckets };
};
