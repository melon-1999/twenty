import { gql } from '@apollo/client';

export const GET_OPPORTUNITY_STAGE_ROTTING_DAYS = gql`
  query GetOpportunityStageRottingDays {
    opportunityStageRottingDays
  }
`;
