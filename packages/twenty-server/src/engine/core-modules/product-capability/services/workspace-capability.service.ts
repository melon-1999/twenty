import { BadRequestException, Injectable } from '@nestjs/common';

import { ProductCapabilityKey } from 'twenty-shared/types';

import { type CapabilitiesMap } from 'src/engine/core-modules/product-capability/interfaces/capabilities-map.interface';

import {
  getProductCapabilityDefinition,
  PRODUCT_CAPABILITY_CATALOG,
} from 'src/engine/core-modules/product-capability/constants/product-capability-catalog.constant';
import { WorkspaceCapabilityEntity } from 'src/engine/core-modules/product-capability/workspace-capability.entity';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

@Injectable()
export class WorkspaceCapabilityService {
  constructor(
    @InjectWorkspaceScopedRepository(WorkspaceCapabilityEntity)
    private readonly workspaceCapabilityRepository: WorkspaceScopedRepository<WorkspaceCapabilityEntity>,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  public async getCapabilitiesMap(
    workspaceId: string,
  ): Promise<CapabilitiesMap> {
    const { capabilitiesMap } = await this.workspaceCacheService.getOrRecompute(
      workspaceId,
      ['capabilitiesMap'],
    );

    return capabilitiesMap;
  }

  public async isCapabilityEnabled(
    key: ProductCapabilityKey,
    workspaceId: string,
  ): Promise<boolean> {
    const capabilitiesMap = await this.getCapabilitiesMap(workspaceId);

    return !!capabilitiesMap[key];
  }

  public async getWorkspaceCapabilities(
    workspaceId: string,
  ): Promise<{ key: ProductCapabilityKey; value: boolean }[]> {
    const capabilitiesMap = await this.getCapabilitiesMap(workspaceId);

    return Object.values(ProductCapabilityKey).map((key) => ({
      key,
      value: !!capabilitiesMap[key],
    }));
  }

  public async setEnabled(
    workspaceId: string,
    key: ProductCapabilityKey,
    enabled: boolean,
  ): Promise<void> {
    const definition = getProductCapabilityDefinition(key);

    if (definition.isCore && !enabled) {
      throw new BadRequestException(
        `Capability "${key}" is a core capability and cannot be disabled`,
      );
    }

    const capabilitiesMap = await this.getCapabilitiesMap(workspaceId);

    if (enabled) {
      this.assertDependenciesEnabled(
        key,
        definition.dependsOn,
        capabilitiesMap,
      );
    } else {
      this.assertNoEnabledDependents(key, capabilitiesMap);
    }

    await this.upsertWorkspaceCapability(workspaceId, key, enabled);

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'capabilitiesMap',
    ]);
  }

  private assertDependenciesEnabled(
    key: ProductCapabilityKey,
    dependsOn: ProductCapabilityKey[],
    capabilitiesMap: CapabilitiesMap,
  ): void {
    const missingDependency = dependsOn.find(
      (dependencyKey) => !capabilitiesMap[dependencyKey],
    );

    if (missingDependency) {
      throw new BadRequestException(
        `Cannot enable capability "${key}" because its dependency "${missingDependency}" is disabled`,
      );
    }
  }

  private assertNoEnabledDependents(
    key: ProductCapabilityKey,
    capabilitiesMap: CapabilitiesMap,
  ): void {
    const enabledDependent = Object.values(ProductCapabilityKey).find(
      (candidateKey) =>
        capabilitiesMap[candidateKey] &&
        PRODUCT_CAPABILITY_CATALOG[candidateKey].dependsOn.includes(key),
    );

    if (enabledDependent) {
      throw new BadRequestException(
        `Cannot disable capability "${key}" because capability "${enabledDependent}" depends on it`,
      );
    }
  }

  private async upsertWorkspaceCapability(
    workspaceId: string,
    key: ProductCapabilityKey,
    value: boolean,
  ): Promise<void> {
    const existingCapability = await this.workspaceCapabilityRepository.findOne(
      workspaceId,
      { where: { key } },
    );

    const capabilityToSave = existingCapability
      ? { ...existingCapability, value }
      : { key, value };

    await this.workspaceCapabilityRepository.save(
      workspaceId,
      capabilityToSave,
    );
  }
}
