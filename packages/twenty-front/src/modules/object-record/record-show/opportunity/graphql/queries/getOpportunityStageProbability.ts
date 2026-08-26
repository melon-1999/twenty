import { gql } from '@apollo/client';

export const GET_OPPORTUNITY_STAGE_PROBABILITY = gql`
  query GetOpportunityStageProbability {
    opportunityStageProbability
  }
`;
