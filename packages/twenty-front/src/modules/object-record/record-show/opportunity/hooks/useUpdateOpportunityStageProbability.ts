import { useMutation } from '@apollo/client/react';

import { UPDATE_OPPORTUNITY_STAGE_PROBABILITY } from '@/object-record/record-show/opportunity/graphql/mutations/updateOpportunityStageProbability';
import { GET_OPPORTUNITY_STAGE_PROBABILITY } from '@/object-record/record-show/opportunity/graphql/queries/getOpportunityStageProbability';

export const useUpdateOpportunityStageProbability = () => {
  const [mutate] = useMutation(UPDATE_OPPORTUNITY_STAGE_PROBABILITY, {
    refetchQueries: [{ query: GET_OPPORTUNITY_STAGE_PROBABILITY }],
  });

  const updateProbability = (config: Record<string, number>) =>
    mutate({ variables: { input: { value: config } } });

  return { updateProbability };
};
