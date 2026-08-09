import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

import { ProductCapabilityKey } from 'twenty-shared/types';

import { CapabilityGuard } from 'src/engine/guards/capability.guard';
import { type WorkspaceCapabilityService } from 'src/engine/core-modules/product-capability/services/workspace-capability.service';

describe('CapabilityGuard', () => {
  let guard: CapabilityGuard;
  let mockReflector: jest.Mocked<Reflector>;
  let mockWorkspaceCapabilityService: jest.Mocked<WorkspaceCapabilityService>;
  let mockExecutionContext: ExecutionContext;
  let mockGqlContext: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReflector = {
      get: jest.fn(),
    } as any;

    mockWorkspaceCapabilityService = {
      isCapabilityEnabled: jest.fn(),
    } as any;

    mockGqlContext = {
      req: {
        workspace: {
          id: 'workspace-id',
        },
      },
    };

    mockExecutionContext = {
      getHandler: jest.fn(),
    } as any;

    jest
      .spyOn(GqlExecutionContext, 'create')
      .mockReturnValue({ getContext: () => mockGqlContext } as any);

    guard = new CapabilityGuard(mockReflector, mockWorkspaceCapabilityService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no capability metadata is set on the handler', async () => {
      mockReflector.get.mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(
        mockWorkspaceCapabilityService.isCapabilityEnabled,
      ).not.toHaveBeenCalled();
    });

    it('should return false when there is no workspace on the request', async () => {
      mockGqlContext.req.workspace = undefined;

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockReflector.get).not.toHaveBeenCalled();
    });

    it('should return true when the capability is enabled', async () => {
      mockReflector.get.mockReturnValue(ProductCapabilityKey.EMAIL);
      mockWorkspaceCapabilityService.isCapabilityEnabled.mockResolvedValue(
        true,
      );

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(
        mockWorkspaceCapabilityService.isCapabilityEnabled,
      ).toHaveBeenCalledWith(ProductCapabilityKey.EMAIL, 'workspace-id');
    });

    it('should throw ForbiddenException when the capability is disabled', async () => {
      mockReflector.get.mockReturnValue(ProductCapabilityKey.EMAIL);
      mockWorkspaceCapabilityService.isCapabilityEnabled.mockResolvedValue(
        false,
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
