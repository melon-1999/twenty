import { Field, ObjectType } from '@nestjs/graphql';

import { Column } from 'typeorm';
import { ProductCapabilityKey } from 'twenty-shared/types';

@ObjectType('ProductCapability')
export class ProductCapabilityDTO {
  @Field(() => ProductCapabilityKey)
  @Column({ nullable: false, type: 'text' })
  key: ProductCapabilityKey;

  @Field()
  @Column({ nullable: false })
  value: boolean;
}
