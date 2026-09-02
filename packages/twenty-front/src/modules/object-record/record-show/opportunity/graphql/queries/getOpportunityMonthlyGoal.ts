import { gql } from '@apollo/client';

export const GET_OPPORTUNITY_MONTHLY_GOAL = gql`
  query GetOpportunityMonthlyGoal {
    opportunityMonthlyGoal
  }
`;
