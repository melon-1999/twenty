import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeORMModule } from 'src/database/typeorm/typeorm.module';
import { WorkspaceCapabilityEntity } from 'src/engine/core-modules/product-capability/workspace-capability.entity';
import { WorkspaceCapabilityService } from 'src/engine/core-modules/product-capability/services/workspace-capability.service';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { WorkspaceCapabilitiesMapCacheModule } from 'src/engine/metadata-modules/workspace-capabilities-map-cache/workspace-capabilities-map-cache.module';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Module({
  imports: [
    TypeORMModule,
    TypeOrmModule.forFeature([WorkspaceCapabilityEntity, ObjectMetadataEntity]),
    WorkspaceCapabilitiesMapCacheModule,
    WorkspaceCacheModule,
    // forwardRef: TwentyORMModule (@Global) imports ProductCapabilityModule, so
    // pulling in ObjectMetadataModule (to apply the isActive effect) risks a
    // module cycle; forwardRef breaks it defensively.
    forwardRef(() => ObjectMetadataModule),
  ],
  exports: [WorkspaceCapabilityService],
  providers: [
    WorkspaceCapabilityService,
    provideWorkspaceScopedRepository(WorkspaceCapabilityEntity),
  ],
})
export class ProductCapabilityModule {}
