import { Test, type TestingModule } from '@nestjs/testing';

import { ProductCapabilityKey } from 'twenty-shared/types';

import { type CapabilitiesMap } from 'src/engine/core-modules/product-capability/interfaces/capabilities-map.interface';

import { PRODUCT_CAPABILITY_CATALOG } from 'src/engine/core-modules/product-capability/constants/product-capability-catalog.constant';
import { WorkspaceCapabilityService } from 'src/engine/core-modules/product-capability/services/workspace-capability.service';
import { WorkspaceCapabilityEntity } from 'src/engine/core-modules/product-capability/workspace-capability.entity';
import { getWorkspaceScopedRepositoryToken } from 'src/engine/twenty-orm/workspace-scoped-repository/get-workspace-scoped-repository-token.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

// A resolved map where every catalog capability is enabled.
const buildAllEnabledMap = (): CapabilitiesMap =>
  Object.values(ProductCapabilityKey).reduce((result, key) => {
    result[key] = true;

    return result;
  }, {} as CapabilitiesMap);

describe('WorkspaceCapabilityService', () => {
  let service: WorkspaceCapabilityService;

  const mockWorkspaceCapabilityRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockWorkspaceCacheService = {
    getOrRecompute: jest.fn(),
    invalidateAndRecompute: jest.fn(),
  };

  const workspaceId = 'workspace-id';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceCapabilityService,
        {
          provide: getWorkspaceScopedRepositoryToken(WorkspaceCapabilityEntity),
          useValue: mockWorkspaceCapabilityRepository,
        },
        {
          provide: WorkspaceCacheService,
          useValue: mockWorkspaceCacheService,
        },
      ],
    }).compile();

    service = module.get<WorkspaceCapabilityService>(
      WorkspaceCapabilityService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isCapabilityEnabled', () => {
    it('should return the value from the capabilities map', async () => {
      mockWorkspaceCacheService.getOrRecompute.mockResolvedValue({
        capabilitiesMap: { [ProductCapabilityKey.EMAIL]: false },
      });

      const result = await service.isCapabilityEnabled(
        ProductCapabilityKey.EMAIL,
        workspaceId,
      );

      expect(result).toBe(false);
      expect(mockWorkspaceCacheService.getOrRecompute).toHaveBeenCalledWith(
        workspaceId,
        ['capabilitiesMap'],
      );
    });
  });

  describe('getWorkspaceCapabilities', () => {
    it('should return an entry for every catalog capability', async () => {
      mockWorkspaceCacheService.getOrRecompute.mockResolvedValue({
        capabilitiesMap: buildAllEnabledMap(),
      });

      const result = await service.getWorkspaceCapabilities(workspaceId);

      expect(result).toHaveLength(Object.values(ProductCapabilityKey).length);
      expect(result).toEqual(
        Object.values(ProductCapabilityKey).map((key) => ({
          key,
          value: true,
        })),
      );
    });
  });

  describe('setEnabled', () => {
    it('should reject disabling a core capability', async () => {
      await expect(
        service.setEnabled(workspaceId, ProductCapabilityKey.CONTACTS, false),
      ).rejects.toThrow(/core capability/);

      expect(mockWorkspaceCapabilityRepository.save).not.toHaveBeenCalled();
    });

    it('should reject enabling when a dependency is disabled', async () => {
      const map = buildAllEnabledMap();

      map[ProductCapabilityKey.CONTACTS] = false;

      mockWorkspaceCacheService.getOrRecompute.mockResolvedValue({
        capabilitiesMap: map,
      });

      // EMAIL depends on CONTACTS
      await expect(
        service.setEnabled(workspaceId, ProductCapabilityKey.EMAIL, true),
      ).rejects.toThrow(/CONTACTS/);

      expect(mockWorkspaceCapabilityRepository.save).not.toHaveBeenCalled();
    });

    it('should reject disabling a capability that an enabled dependent needs', async () => {
      mockWorkspaceCacheService.getOrRecompute.mockResolvedValue({
        capabilitiesMap: buildAllEnabledMap(),
      });

      // In the shipped catalog every dependency target is a core capability
      // (which cannot be disabled anyway), so temporarily wire an optional→optional
      // dependency to exercise the dependent-detection branch, then restore it.
      const originalDependsOn =
        PRODUCT_CAPABILITY_CATALOG[ProductCapabilityKey.AI_ASSISTANT].dependsOn;

      PRODUCT_CAPABILITY_CATALOG[ProductCapabilityKey.AI_ASSISTANT].dependsOn =
        [ProductCapabilityKey.EMAIL];

      try {
        // AI_ASSISTANT (enabled) now depends on EMAIL, so disabling EMAIL is blocked.
        await expect(
          service.setEnabled(workspaceId, ProductCapabilityKey.EMAIL, false),
        ).rejects.toThrow(/AI_ASSISTANT/);

        expect(mockWorkspaceCapabilityRepository.save).not.toHaveBeenCalled();
      } finally {
        PRODUCT_CAPABILITY_CATALOG[
          ProductCapabilityKey.AI_ASSISTANT
        ].dependsOn = originalDependsOn;
      }
    });

    it('should upsert and invalidate the cache on the happy path', async () => {
      mockWorkspaceCacheService.getOrRecompute.mockResolvedValue({
        capabilitiesMap: buildAllEnabledMap(),
      });
      mockWorkspaceCapabilityRepository.findOne.mockResolvedValue(null);
      mockWorkspaceCapabilityRepository.save.mockResolvedValue({});

      await service.setEnabled(
        workspaceId,
        ProductCapabilityKey.AI_ASSISTANT,
        true,
      );

      expect(mockWorkspaceCapabilityRepository.save).toHaveBeenCalledWith(
        workspaceId,
        { key: ProductCapabilityKey.AI_ASSISTANT, value: true },
      );
      expect(
        mockWorkspaceCacheService.invalidateAndRecompute,
      ).toHaveBeenCalledWith(workspaceId, ['capabilitiesMap']);
    });
  });
});
