import { useQuery } from '@apollo/client/react';

import { GET_OPPORTUNITY_MONTHLY_GOAL } from '@/object-record/record-show/opportunity/graphql/queries/getOpportunityMonthlyGoal';

type OpportunityMonthlyGoal = { targetAmount: number };

type GetOpportunityMonthlyGoalResult = {
  opportunityMonthlyGoal: OpportunityMonthlyGoal | null;
};

export const useOpportunityMonthlyGoal = (): {
  config: OpportunityMonthlyGoal | null;
  loading: boolean;
} => {
  const { data, loading } = useQuery<GetOpportunityMonthlyGoalResult>(
    GET_OPPORTUNITY_MONTHLY_GOAL,
  );

  return { config: data?.opportunityMonthlyGoal ?? null, loading };
};
