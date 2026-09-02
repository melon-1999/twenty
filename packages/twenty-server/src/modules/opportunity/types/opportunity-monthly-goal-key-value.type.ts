export const OPPORTUNITY_MONTHLY_GOAL_KEY = 'OPPORTUNITY_MONTHLY_GOAL';

// Monthly revenue target in major currency units (e.g. 100000 = 100k).
export type OpportunityMonthlyGoal = { targetAmount: number };

export type OpportunityMonthlyGoalKeyValueTypeMap = {
  [OPPORTUNITY_MONTHLY_GOAL_KEY]: OpportunityMonthlyGoal;
};
