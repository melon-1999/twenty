import { gql } from '@apollo/client';

export const UPDATE_OPPORTUNITY_STAGE_ROTTING_DAYS = gql`
  mutation UpdateOpportunityStageRottingDays(
    $input: UpdateOpportunityStageRottingDaysInput!
  ) {
    updateOpportunityStageRottingDays(input: $input)
  }
`;
