import { Field, InputType } from '@nestjs/graphql';

import { IsBoolean, IsEnum } from 'class-validator';
import { ProductCapabilityKey } from 'twenty-shared/types';

@InputType()
export class UpdateWorkspaceCapabilityInput {
  @Field(() => ProductCapabilityKey)
  @IsEnum(ProductCapabilityKey)
  key: ProductCapabilityKey;

  @Field(() => Boolean)
  @IsBoolean()
  enabled: boolean;
}
