import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceCapabilityEntity } from 'src/engine/core-modules/product-capability/workspace-capability.entity';
import { WorkspaceCapabilitiesMapCacheService } from 'src/engine/metadata-modules/workspace-capabilities-map-cache/workspace-capabilities-map-cache.service';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';
@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceCapabilityEntity])],
  providers: [
    WorkspaceCapabilitiesMapCacheService,
    provideWorkspaceScopedRepository(WorkspaceCapabilityEntity),
  ],
  exports: [WorkspaceCapabilitiesMapCacheService],
})
export class WorkspaceCapabilitiesMapCacheModule {}
