import { useMutation } from '@apollo/client/react';

import { UPDATE_OPPORTUNITY_MONTHLY_GOAL } from '@/object-record/record-show/opportunity/graphql/mutations/updateOpportunityMonthlyGoal';
import { GET_OPPORTUNITY_MONTHLY_GOAL } from '@/object-record/record-show/opportunity/graphql/queries/getOpportunityMonthlyGoal';

export const useUpdateOpportunityMonthlyGoal = () => {
  const [mutate] = useMutation(UPDATE_OPPORTUNITY_MONTHLY_GOAL, {
    refetchQueries: [{ query: GET_OPPORTUNITY_MONTHLY_GOAL }],
  });

  const updateMonthlyGoal = (targetAmount: number) =>
    mutate({ variables: { input: { value: { targetAmount } } } });

  return { updateMonthlyGoal };
};
