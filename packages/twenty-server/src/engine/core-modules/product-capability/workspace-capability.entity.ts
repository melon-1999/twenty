import { registerEnumType } from '@nestjs/graphql';

import { ProductCapabilityKey } from 'twenty-shared/types';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'workspaceCapability', schema: 'core' })
@Unique('IDX_WORKSPACE_CAPABILITY_KEY_WORKSPACE_ID_UNIQUE', [
  'key',
  'workspaceId',
])
export class WorkspaceCapabilityEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'text' })
  key: ProductCapabilityKey;

  @Column({ nullable: false })
  value: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

registerEnumType(ProductCapabilityKey, {
  name: 'ProductCapabilityKey',
});
