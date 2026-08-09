import { Test, type TestingModule } from '@nestjs/testing';

import { ProductCapabilityKey } from 'twenty-shared/types';

import { PRODUCT_CAPABILITY_CATALOG } from 'src/engine/core-modules/product-capability/constants/product-capability-catalog.constant';
import { WorkspaceCapabilityEntity } from 'src/engine/core-modules/product-capability/workspace-capability.entity';
import { WorkspaceCapabilitiesMapCacheService } from 'src/engine/metadata-modules/workspace-capabilities-map-cache/workspace-capabilities-map-cache.service';
import { getWorkspaceScopedRepositoryToken } from 'src/engine/twenty-orm/workspace-scoped-repository/get-workspace-scoped-repository-token.util';

describe('WorkspaceCapabilitiesMapCacheService', () => {
  let service: WorkspaceCapabilitiesMapCacheService;

  const mockWorkspaceCapabilityRepository = {
    find: jest.fn(),
  };

  const workspaceId = 'workspace-id';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceCapabilitiesMapCacheService,
        {
          provide: getWorkspaceScopedRepositoryToken(WorkspaceCapabilityEntity),
          useValue: mockWorkspaceCapabilityRepository,
        },
      ],
    }).compile();

    service = module.get<WorkspaceCapabilitiesMapCacheService>(
      WorkspaceCapabilitiesMapCacheService,
    );
  });

  it('should resolve to catalog defaults when no rows exist', async () => {
    mockWorkspaceCapabilityRepository.find.mockResolvedValue([]);

    const result = await service.computeForCache(workspaceId);

    // Every catalog key is present and matches its default (all true in this step).
    expect(Object.keys(result)).toHaveLength(
      Object.values(ProductCapabilityKey).length,
    );
    for (const key of Object.values(ProductCapabilityKey)) {
      expect(result[key]).toBe(PRODUCT_CAPABILITY_CATALOG[key].defaultEnabled);
    }
  });

  it('should let a stored row override the default for an optional capability', async () => {
    mockWorkspaceCapabilityRepository.find.mockResolvedValue([
      { key: ProductCapabilityKey.EMAIL, value: false },
    ]);

    const result = await service.computeForCache(workspaceId);

    expect(result[ProductCapabilityKey.EMAIL]).toBe(false);
  });

  it('should keep core capabilities enabled even when a row says false', async () => {
    mockWorkspaceCapabilityRepository.find.mockResolvedValue([
      { key: ProductCapabilityKey.CONTACTS, value: false },
    ]);

    const result = await service.computeForCache(workspaceId);

    expect(result[ProductCapabilityKey.CONTACTS]).toBe(true);
  });
});
