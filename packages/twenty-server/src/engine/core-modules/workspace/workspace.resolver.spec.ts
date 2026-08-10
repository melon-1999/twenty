import { ProductCapabilityKey } from 'twenty-shared/types';

import { type WorkspaceCapabilityService } from 'src/engine/core-modules/product-capability/services/workspace-capability.service';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceResolver } from 'src/engine/core-modules/workspace/workspace.resolver';

// updateWorkspaceCapability is gated by WorkspaceAuthGuard +
// SettingsPermissionGuard(PermissionFlagType.WORKSPACE), which are exercised
// through the full HTTP/GraphQL pipeline (see the settings-permissions
// integration suites for other WorkspaceResolver mutations). Guard behavior
// isn't re-tested here; core-cannot-disable and dependency invariants are
// already covered by
// workspace-capability.service.spec.ts. This spec only verifies the resolver
// wires the input into WorkspaceCapabilityService and shapes the response.
describe('WorkspaceResolver.updateWorkspaceCapability', () => {
  const mockWorkspace = { id: 'workspace-id' } as WorkspaceEntity;

  const buildResolver = (
    workspaceCapabilityService: Partial<WorkspaceCapabilityService>,
  ) =>
    new WorkspaceResolver(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      workspaceCapabilityService as WorkspaceCapabilityService,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

  it('calls setEnabled with the workspace id and input, and returns the resolved capability state', async () => {
    const setEnabled = jest.fn().mockResolvedValue(undefined);
    const isCapabilityEnabled = jest.fn().mockResolvedValue(true);
    const resolver = buildResolver({ setEnabled, isCapabilityEnabled });

    const result = await resolver.updateWorkspaceCapability(
      { key: ProductCapabilityKey.DASHBOARDS, enabled: true },
      mockWorkspace,
    );

    expect(setEnabled).toHaveBeenCalledWith(
      mockWorkspace.id,
      ProductCapabilityKey.DASHBOARDS,
      true,
    );
    expect(isCapabilityEnabled).toHaveBeenCalledWith(
      ProductCapabilityKey.DASHBOARDS,
      mockWorkspace.id,
    );
    expect(result).toEqual({
      key: ProductCapabilityKey.DASHBOARDS,
      value: true,
    });
  });

  it('propagates errors thrown by the service (e.g. core-cannot-disable, dependency violations)', async () => {
    const setEnabled = jest
      .fn()
      .mockRejectedValue(
        new Error('Capability "CONTACTS" is a core capability'),
      );
    const isCapabilityEnabled = jest.fn();
    const resolver = buildResolver({ setEnabled, isCapabilityEnabled });

    await expect(
      resolver.updateWorkspaceCapability(
        { key: ProductCapabilityKey.CONTACTS, enabled: false },
        mockWorkspace,
      ),
    ).rejects.toThrow('Capability "CONTACTS" is a core capability');

    expect(isCapabilityEnabled).not.toHaveBeenCalled();
  });
});
