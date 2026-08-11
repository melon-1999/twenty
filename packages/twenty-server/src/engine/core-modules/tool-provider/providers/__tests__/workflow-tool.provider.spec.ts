import { PermissionFlagType } from 'twenty-shared/constants';
import { ProductCapabilityKey } from 'twenty-shared/types';

import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { WorkflowToolProvider } from 'src/engine/core-modules/tool-provider/providers/workflow-tool.provider';
import { type WorkspaceCapabilityService } from 'src/engine/core-modules/product-capability/services/workspace-capability.service';
import { type WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { type PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import { type WorkflowToolWorkspaceService } from 'src/modules/workflow/workflow-tools/services/workflow-tool.workspace-service';

const workspaceId = 'workspace-id';
const callerRoleId = 'caller-role-id';

const buildProvider = (options?: {
  workflowToolService?: WorkflowToolWorkspaceService | null;
  isCapabilityAvailable?: boolean;
  hasWorkflowsPermission?: boolean;
}) => {
  const workflowToolService =
    options?.workflowToolService === undefined
      ? ({
          generateWorkflowTools: jest.fn(),
        } as unknown as WorkflowToolWorkspaceService)
      : options.workflowToolService;

  const permissionsService = {
    checkRolesPermissions: jest
      .fn()
      .mockResolvedValue(options?.hasWorkflowsPermission ?? true),
  };

  const flatEntityMapsCacheService = {
    getMinimalFlatEntityMapsOrThrow: jest.fn(),
  };

  const workspaceCapabilityService = {
    isCapabilityAvailable: jest
      .fn()
      .mockReturnValue(options?.isCapabilityAvailable ?? true),
  };

  const provider = new WorkflowToolProvider(
    workflowToolService,
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

describe('WorkflowToolProvider', () => {
  describe('isAvailable', () => {
    it('is not available when the workflow tool service is not injected', async () => {
      const { provider, permissionsService, workspaceCapabilityService } =
        buildProvider({ workflowToolService: null });

      await expect(provider.isAvailable(context)).resolves.toBe(false);
      expect(workspaceCapabilityService.isCapabilityAvailable).not.toHaveBeenCalled();
      expect(permissionsService.checkRolesPermissions).not.toHaveBeenCalled();
    });

    it('is not available when the Automations capability is not deployment-available, even if permissions would allow it', async () => {
      const { provider, permissionsService, workspaceCapabilityService } =
        buildProvider({
          isCapabilityAvailable: false,
          hasWorkflowsPermission: true,
        });

      await expect(provider.isAvailable(context)).resolves.toBe(false);
      expect(workspaceCapabilityService.isCapabilityAvailable).toHaveBeenCalledWith(
        ProductCapabilityKey.AUTOMATIONS,
      );
      expect(permissionsService.checkRolesPermissions).not.toHaveBeenCalled();
    });

    it('returns the permission check result when the Automations capability is deployment-available', async () => {
      const { provider, permissionsService, workspaceCapabilityService } =
        buildProvider({
          isCapabilityAvailable: true,
          hasWorkflowsPermission: true,
        });

      await expect(provider.isAvailable(context)).resolves.toBe(true);
      expect(workspaceCapabilityService.isCapabilityAvailable).toHaveBeenCalledWith(
        ProductCapabilityKey.AUTOMATIONS,
      );
      expect(permissionsService.checkRolesPermissions).toHaveBeenCalledWith(
        context.rolePermissionConfig,
        workspaceId,
        PermissionFlagType.WORKFLOWS,
      );
    });

    it('is not available without the WORKFLOWS permission, even when the capability is deployment-available', async () => {
      const { provider } = buildProvider({
        isCapabilityAvailable: true,
        hasWorkflowsPermission: false,
      });

      await expect(provider.isAvailable(context)).resolves.toBe(false);
    });
  });
});
