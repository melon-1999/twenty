import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';

// The index/board query only fetches visible columns, so probability isn't
// in the record store here — fetch just that field.
export const useOpportunityProbabilityForRecord = (
  recordId: string,
): { probability: number | null } => {
  const { record } = useFindOneRecord({
    objectNameSingular: 'opportunity',
    objectRecordId: recordId,
    recordGqlFields: { probability: true },
  });

  return {
    probability: (record?.probability as number | null | undefined) ?? null,
  };
};
