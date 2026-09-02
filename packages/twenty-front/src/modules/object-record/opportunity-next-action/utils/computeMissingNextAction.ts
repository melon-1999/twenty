import {
  type ActivityTaskInput,
  computeNextActivityAt,
} from '@/object-record/opportunity-next-action/utils/computeNextActivityAt';

export type MissingNextActionOpportunity = {
  id: string;
  name: string | null;
  stage: string | null;
  amountMicros: number | null;
};

export type TaskTargetInput = {
  targetOpportunityId: string | null;
  dueAt: string | null;
  status: string | null;
};

export type NextActionResult = {
  opportunities: MissingNextActionOpportunity[];
  totalMissing: number;
};

export const computeMissingNextAction = (
  openOpportunities: MissingNextActionOpportunity[],
  taskTargets: TaskTargetInput[],
  now: Date,
): NextActionResult => {
  const tasksByOpportunity = new Map<string, ActivityTaskInput[]>();

  for (const taskTarget of taskTargets) {
    if (taskTarget.targetOpportunityId === null) {
      continue;
    }
    const tasks = tasksByOpportunity.get(taskTarget.targetOpportunityId) ?? [];
    tasks.push({ dueAt: taskTarget.dueAt, status: taskTarget.status });
    tasksByOpportunity.set(taskTarget.targetOpportunityId, tasks);
  }

  const opportunities = openOpportunities.filter(
    (opportunity) =>
      computeNextActivityAt(
        tasksByOpportunity.get(opportunity.id) ?? [],
        now,
      ) === null,
  );

  return { opportunities, totalMissing: opportunities.length };
};
