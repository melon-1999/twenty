import { PermissionFlagType } from 'twenty-shared/constants';
import { ProductCapabilityKey } from 'twenty-shared/types';

import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { DashboardToolProvider } from 'src/engine/core-modules/tool-provider/providers/dashboard-tool.provider';
import { type WorkspaceCapabilityService } from 'src/engine/core-modules/product-capability/services/workspace-capability.service';
import { type WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { type PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import { type DashboardToolWorkspaceService } from 'src/modules/dashboard/tools/services/dashboard-tool.workspace-service';

const workspaceId = 'workspace-id';
const callerRoleId = 'caller-role-id';

const buildProvider = (options?: {
  dashboardToolService?: DashboardToolWorkspaceService | null;
  isCapabilityAvailable?: boolean;
  hasLayoutsPermission?: boolean;
}) => {
  const dashboardToolService =
    options?.dashboardToolService === undefined
      ? ({
          generateDashboardTools: jest.fn(),
        } as unknown as DashboardToolWorkspaceService)
      : options.dashboardToolService;

  const permissionsService = {
    checkRolesPermissions: jest
      .fn()
      .mockResolvedValue(options?.hasLayoutsPermission ?? true),
  };

  const flatEntityMapsCacheService = {
    getMinimalFlatEntityMapsOrThrow: jest.fn(),
  };

  const workspaceCapabilityService = {
    isCapabilityAvailable: jest
      .fn()
      .mockReturnValue(options?.isCapabilityAvailable ?? true),
  };

  const provider = new DashboardToolProvider(
    dashboardToolService,
    permissionsService as unknown as PermissionsService,
    flatEntityMapsCacheService as unknown as WorkspaceManyOrAllFlatEntityMapsCacheService,
    workspaceCapabilityService as unknown as WorkspaceCapabilityService,
  );

  return {
    provider,
    permissionsService,
    flatEntityMapsCacheService,
    workspaceCapabilityService,
  };
};

const context: ToolProviderContext = {
  workspaceId,
  roleId: callerRoleId,
  rolePermissionConfig: { unionOf: [callerRoleId] },
};

describe('DashboardToolProvider', () => {
  describe('isAvailable', () => {
    it('is not available when the dashboard tool service is not injected', async () => {
      const { provider, permissionsService, workspaceCapabilityService } =
        buildProvider({ dashboardToolService: null });

      await expect(provider.isAvailable(context)).resolves.toBe(false);
      expect(
        workspaceCapabilityService.isCapabilityAvailable,
      ).not.toHaveBeenCalled();
      expect(permissionsService.checkRolesPermissions).not.toHaveBeenCalled();
    });

    it('is not available when the Dashboards capability is not deployment-available, even if permissions would allow it', async () => {
      const { provider, permissionsService, workspaceCapabilityService } =
        buildProvider({
          isCapabilityAvailable: false,
          hasLayoutsPermission: true,
        });

      await expect(provider.isAvailable(context)).resolves.toBe(false);
      expect(
        workspaceCapabilityService.isCapabilityAvailable,
      ).toHaveBeenCalledWith(ProductCapabilityKey.DASHBOARDS);
      expect(permissionsService.checkRolesPermissions).not.toHaveBeenCalled();
    });

    it('returns the permission check result when the Dashboards capability is deployment-available', async () => {
      const { provider, permissionsService, workspaceCapabilityService } =
        buildProvider({
          isCapabilityAvailable: true,
          hasLayoutsPermission: true,
        });

      await expect(provider.isAvailable(context)).resolves.toBe(true);
      expect(
        workspaceCapabilityService.isCapabilityAvailable,
      ).toHaveBeenCalledWith(ProductCapabilityKey.DASHBOARDS);
      expect(permissionsService.checkRolesPermissions).toHaveBeenCalledWith(
        context.rolePermissionConfig,
        workspaceId,
        PermissionFlagType.LAYOUTS,
      );
    });

    it('is not available without the LAYOUTS permission, even when the capability is deployment-available', async () => {
      const { provider } = buildProvider({
        isCapabilityAvailable: true,
        hasLayoutsPermission: false,
      });

      await expect(provider.isAvailable(context)).resolves.toBe(false);
    });
  });
});
