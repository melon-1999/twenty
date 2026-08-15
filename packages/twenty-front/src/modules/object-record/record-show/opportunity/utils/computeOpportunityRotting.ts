type ComputeOpportunityRottingArgs = {
  status: string;
  stage: string;
  stageChangedAt: string | null;
  config: Record<string, number>;
  now: Date;
};

export const computeOpportunityRotting = ({
  status,
  stage,
  stageChangedAt,
  config,
  now,
}: ComputeOpportunityRottingArgs): {
  isRotting: boolean;
  daysInStage: number | null;
} => {
  if (stageChangedAt === null) {
    return { isRotting: false, daysInStage: null };
  }

  const daysInStage = Math.floor(
    (now.getTime() - new Date(stageChangedAt).getTime()) / 86400000,
  );

  const threshold = config[stage];
  const isRotting =
    status === 'OPEN' && threshold !== undefined && daysInStage > threshold;

  return { isRotting, daysInStage };
};
