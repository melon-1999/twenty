import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useOpportunityStageRottingConfig } from '@/object-record/record-show/opportunity/hooks/useOpportunityStageRottingConfig';
import { computeOpportunityRotting } from '@/object-record/record-show/opportunity/utils/computeOpportunityRotting';

// The index/board query only fetches visible columns, so status/stage/
// stageChangedAt aren't in the record store here — fetch just those three.
export const useOpportunityRottingForRecord = (
  recordId: string,
): { isRotting: boolean; daysInStage: number | null } => {
  const { record } = useFindOneRecord({
    objectNameSingular: 'opportunity',
    objectRecordId: recordId,
    recordGqlFields: { status: true, stage: true, stageChangedAt: true },
  });

  const { config } = useOpportunityStageRottingConfig();

  return computeOpportunityRotting({
    status: (record?.status as string | undefined) ?? 'OPEN',
    stage: (record?.stage as string | undefined) ?? '',
    stageChangedAt:
      (record?.stageChangedAt as string | null | undefined) ?? null,
    config,
    now: new Date(),
  });
};
