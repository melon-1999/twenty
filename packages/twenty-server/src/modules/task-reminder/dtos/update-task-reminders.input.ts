import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsObject } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

import { type TaskRemindersConfig } from 'src/modules/task-reminder/types/task-reminders-key-value.type';

@InputType('UpdateTaskRemindersInput')
export class UpdateTaskRemindersInput {
  @IsObject()
  @IsNotEmpty()
  @Field(() => GraphQLJSON)
  value: TaskRemindersConfig;
}
