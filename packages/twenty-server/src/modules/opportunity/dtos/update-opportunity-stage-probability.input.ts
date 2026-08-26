import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsObject } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

@InputType('UpdateOpportunityStageProbabilityInput')
export class UpdateOpportunityStageProbabilityInput {
  @IsObject()
  @IsNotEmpty()
  @Field(() => GraphQLJSON)
  value: Record<string, number>;
}
