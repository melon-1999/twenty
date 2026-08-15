import { useMutation } from '@apollo/client/react';

import { UPDATE_OPPORTUNITY_STAGE_ROTTING_DAYS } from '@/object-record/record-show/opportunity/graphql/mutations/updateOpportunityStageRottingDays';
import { GET_OPPORTUNITY_STAGE_ROTTING_DAYS } from '@/object-record/record-show/opportunity/graphql/queries/getOpportunityStageRottingDays';

export const useUpdateOpportunityStageRottingDays = () => {
  const [mutate] = useMutation(UPDATE_OPPORTUNITY_STAGE_ROTTING_DAYS, {
    refetchQueries: [{ query: GET_OPPORTUNITY_STAGE_ROTTING_DAYS }],
  });

  const updateRottingDays = (config: Record<string, number>) =>
    mutate({ variables: { input: { config } } });

  return { updateRottingDays };
};
