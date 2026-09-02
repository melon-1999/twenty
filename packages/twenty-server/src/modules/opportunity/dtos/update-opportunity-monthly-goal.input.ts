import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsObject } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

import { type OpportunityMonthlyGoal } from 'src/modules/opportunity/types/opportunity-monthly-goal-key-value.type';

@InputType('UpdateOpportunityMonthlyGoalInput')
export class UpdateOpportunityMonthlyGoalInput {
  @IsObject()
  @IsNotEmpty()
  @Field(() => GraphQLJSON)
  value: OpportunityMonthlyGoal;
}
