import { useQuery } from '@apollo/client/react';

import { GET_OPPORTUNITY_STAGE_ROTTING_DAYS } from '@/object-record/record-show/opportunity/graphql/queries/getOpportunityStageRottingDays';

type GetOpportunityStageRottingDaysResult = {
  opportunityStageRottingDays: Record<string, number>;
};

export const useOpportunityStageRottingConfig = (): {
  config: Record<string, number>;
} => {
  const { data } = useQuery<GetOpportunityStageRottingDaysResult>(
    GET_OPPORTUNITY_STAGE_ROTTING_DAYS,
  );

  return { config: data?.opportunityStageRottingDays ?? {} };
};
