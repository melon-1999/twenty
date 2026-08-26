import { useQuery } from '@apollo/client/react';

import { GET_OPPORTUNITY_STAGE_PROBABILITY } from '@/object-record/record-show/opportunity/graphql/queries/getOpportunityStageProbability';

type GetOpportunityStageProbabilityResult = {
  opportunityStageProbability: Record<string, number>;
};

export const useOpportunityStageProbabilityConfig = (): {
  config: Record<string, number>;
  loading: boolean;
} => {
  const { data, loading } = useQuery<GetOpportunityStageProbabilityResult>(
    GET_OPPORTUNITY_STAGE_PROBABILITY,
  );

  return { config: data?.opportunityStageProbability ?? {}, loading };
};
