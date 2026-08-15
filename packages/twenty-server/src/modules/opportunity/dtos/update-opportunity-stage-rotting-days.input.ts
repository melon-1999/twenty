import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsObject } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

@InputType('UpdateOpportunityStageRottingDaysInput')
export class UpdateOpportunityStageRottingDaysInput {
  @IsObject()
  @IsNotEmpty()
  @Field(() => GraphQLJSON)
  config: Record<string, number>;
}
