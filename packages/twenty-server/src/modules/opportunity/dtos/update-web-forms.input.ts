import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsObject } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

import { type WebFormsConfig } from 'src/modules/opportunity/types/web-form-key-value.type';

@InputType('UpdateWebFormsInput')
export class UpdateWebFormsInput {
  @IsObject()
  @IsNotEmpty()
  @Field(() => GraphQLJSON)
  value: WebFormsConfig;
}
