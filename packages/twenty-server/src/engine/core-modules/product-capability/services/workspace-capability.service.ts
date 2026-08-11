import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-shared/metadata';
import { ProductCapabilityKey } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { type CapabilitiesMap } from 'src/engine/core-modules/product-capability/interfaces/capabilities-map.interface';

import {
  getProductCapabilityDefinition,
  PRODUCT_CAPABILITY_CATALOG,
} from 'src/engine/core-modules/product-capability/constants/product-capability-catalog.constant';
import { WorkspaceCapabilityEntity } from 'src/engine/core-modules/product-capability/workspace-capability.entity';
import { type ConfigVariables } from 'src/engine/core-modules/twenty-config/config-variables';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

// Reverse index universal-identifier UUID -> standard object nameSingular.
// ObjectMetadataEntity has no standardId column, so effect application resolves
// the per-workspace object row by nameSingular (the identifier map is keyed by
// nameSingular, e.g. dashboard UUID -> 'dashboard').
const STANDARD_OBJECT_NAME_SINGULAR_BY_UNIVERSAL_IDENTIFIER: Record<
  string,
  string
> = Object.fromEntries(
  Object.entries(STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS).map(
    ([nameSingular, universalIdentifier]) => [
      universalIdentifier,
      nameSingular,
    ],
  ),
);

@Injectable()
export class WorkspaceCapabilityService {
  constructor(
    @InjectWorkspaceScopedRepository(WorkspaceCapabilityEntity)
    private readonly workspaceCapabilityRepository: WorkspaceScopedRepository<WorkspaceCapabilityEntity>,
    private readonly workspaceCacheService: WorkspaceCacheService,
    @InjectRepository(ObjectMetadataEntity)
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
    // forwardRef: TwentyORMModule (@Global) imports ProductCapabilityModule and
    // ObjectMetadataModule's transitive closure can reach TwentyORMModule, so a
    // plain import risks a Nest module cycle; forwardRef breaks it defensively.
    @Inject(forwardRef(() => ObjectMetadataService))
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly twentyConfigService: TwentyConfigService,
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

  public isCapabilityAvailable(key: ProductCapabilityKey): boolean {
    const configFlag = PRODUCT_CAPABILITY_CATALOG[key].availability.configFlag;

    if (!isDefined(configFlag)) {
      return true;
    }

    return Boolean(
      this.twentyConfigService.get(configFlag as keyof ConfigVariables),
    );
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

    // Apply the capability's effect (object isActive toggle) BEFORE returning so
    // a failure is visible to the caller. The row change is already persisted;
    // if effect application throws we let it propagate — re-toggling re-applies
    // it idempotently.
    await this.applyCapabilityEffect(workspaceId, key, enabled);

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'capabilitiesMap',
    ]);
  }

  // For each object referenced by the capability's effect, align its isActive
  // with the toggle. NOTE: isActive is only a UI-hide + data-preservation lever
  // (proven not to remove the object from the per-workspace GraphQL schema), so
  // this is NOT the access boundary — @RequireCapability guards the discrete
  // dashboard endpoints for that. Raw dashboard record CRUD via the dynamic
  // workspace resolver stays reachable when disabled (documented limitation).
  private async applyCapabilityEffect(
    workspaceId: string,
    key: ProductCapabilityKey,
    enabled: boolean,
  ): Promise<void> {
    const { effect } = getProductCapabilityDefinition(key);
    const objectStandardIds = effect.objectStandardIds ?? [];

    for (const objectStandardId of objectStandardIds) {
      const nameSingular =
        STANDARD_OBJECT_NAME_SINGULAR_BY_UNIVERSAL_IDENTIFIER[objectStandardId];

      if (!isDefined(nameSingular)) {
        continue;
      }

      const objectMetadata = await this.objectMetadataRepository.findOne({
        where: { workspaceId, nameSingular },
      });

      // A workspace may not have this object — skip gracefully, do not throw.
      if (!isDefined(objectMetadata)) {
        continue;
      }

      // Idempotent — already in the desired isActive state.
      if (objectMetadata.isActive === enabled) {
        continue;
      }

      await this.objectMetadataService.updateOneObject({
        workspaceId,
        updateObjectInput: {
          id: objectMetadata.id,
          update: { isActive: enabled },
        },
      });
    }
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
