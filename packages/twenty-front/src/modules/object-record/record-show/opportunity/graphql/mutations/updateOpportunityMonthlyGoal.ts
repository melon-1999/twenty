import { gql } from '@apollo/client';

export const UPDATE_OPPORTUNITY_MONTHLY_GOAL = gql`
  mutation UpdateOpportunityMonthlyGoal(
    $input: UpdateOpportunityMonthlyGoalInput!
  ) {
    updateOpportunityMonthlyGoal(input: $input)
  }
`;
