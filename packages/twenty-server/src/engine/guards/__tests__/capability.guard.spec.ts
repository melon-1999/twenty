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
      isCapabilityAvailable: jest.fn(),
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
    it('should return true when no capability metadata is set on the handler', () => {
      mockReflector.get.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(
        mockWorkspaceCapabilityService.isCapabilityAvailable,
      ).not.toHaveBeenCalled();
    });

    it('should return true for pass-through even without workspace context, since availability is deployment-scoped', () => {
      mockGqlContext.req.workspace = undefined;
      mockReflector.get.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('returns true when the capability is available', () => {
      mockReflector.get.mockReturnValue(ProductCapabilityKey.DASHBOARDS);
      mockWorkspaceCapabilityService.isCapabilityAvailable.mockReturnValue(
        true,
      );

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(
        mockWorkspaceCapabilityService.isCapabilityAvailable,
      ).toHaveBeenCalledWith(ProductCapabilityKey.DASHBOARDS);
    });

    it('throws ForbiddenException when the capability is not available', () => {
      mockReflector.get.mockReturnValue(ProductCapabilityKey.DASHBOARDS);
      mockWorkspaceCapabilityService.isCapabilityAvailable.mockReturnValue(
        false,
      );

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });
  });
});
