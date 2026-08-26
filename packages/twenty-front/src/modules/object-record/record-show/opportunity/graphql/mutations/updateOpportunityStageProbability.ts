import { gql } from '@apollo/client';

export const UPDATE_OPPORTUNITY_STAGE_PROBABILITY = gql`
  mutation UpdateOpportunityStageProbability(
    $input: UpdateOpportunityStageProbabilityInput!
  ) {
    updateOpportunityStageProbability(input: $input)
  }
`;
