import { Injectable } from '@nestjs/common';

import { ProductCapabilityKey } from 'twenty-shared/types';

import { WorkspaceCacheProvider } from 'src/engine/workspace-cache/interfaces/workspace-cache-provider.service';
import { type CapabilitiesMap } from 'src/engine/core-modules/product-capability/interfaces/capabilities-map.interface';

import { PRODUCT_CAPABILITY_CATALOG } from 'src/engine/core-modules/product-capability/constants/product-capability-catalog.constant';
import { WorkspaceCapabilityEntity } from 'src/engine/core-modules/product-capability/workspace-capability.entity';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { WorkspaceCache } from 'src/engine/workspace-cache/decorators/workspace-cache.decorator';

@Injectable()
@WorkspaceCache('capabilitiesMap')
export class WorkspaceCapabilitiesMapCacheService extends WorkspaceCacheProvider<CapabilitiesMap> {
  constructor(
    @InjectWorkspaceScopedRepository(WorkspaceCapabilityEntity)
    private readonly workspaceCapabilityRepository: WorkspaceScopedRepository<WorkspaceCapabilityEntity>,
  ) {
    super();
  }

  async computeForCache(workspaceId: string): Promise<CapabilitiesMap> {
    const workspaceCapabilities =
      await this.workspaceCapabilityRepository.find(workspaceId);

    const rowByKey = new Map(
      workspaceCapabilities.map((capability) => [
        capability.key,
        capability.value,
      ]),
    );

    return Object.values(ProductCapabilityKey).reduce((result, key) => {
      const definition = PRODUCT_CAPABILITY_CATALOG[key];

      // Core capabilities are always on; optional ones fall back to their
      // default when the workspace has no stored override.
      // availability (entitlement/config) resolves here once a capability declares one
      const resolved = definition.isCore
        ? true
        : (rowByKey.get(key) ?? definition.defaultEnabled);

      result[key] = resolved;

      return result;
    }, {} as CapabilitiesMap);
  }
}
