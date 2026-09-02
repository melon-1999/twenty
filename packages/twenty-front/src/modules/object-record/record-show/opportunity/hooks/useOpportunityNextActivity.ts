import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { computeNextActivityAt } from '@/object-record/opportunity-next-action/utils/computeNextActivityAt';

type OpportunityTaskTargetRecord = {
  id: string;
  __typename: 'TaskTarget';
  task: { dueAt: string | null; status: string | null } | null;
};

// The record store only holds visible fields, so fetch the deal's task targets
// (with each task's dueAt/status) directly to compute the next activity date.
export const useOpportunityNextActivity = (recordId: string): string | null => {
  const { records } = useFindManyRecords<OpportunityTaskTargetRecord>({
    objectNameSingular: 'taskTarget',
    filter: { targetOpportunityId: { eq: recordId } },
    recordGqlFields: {
      task: { dueAt: true, status: true },
    },
    limit: 100,
  });

  const tasks = records.map((record) => ({
    dueAt: record.task?.dueAt ?? null,
    status: record.task?.status ?? null,
  }));

  return computeNextActivityAt(tasks, new Date());
};
