import { type CurrentWorkspace } from '@/auth/states/currentWorkspaceState';
import { type ProductCapabilityKey } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const checkIfCapabilityIsEnabledOnWorkspace = (
  capabilityKey: ProductCapabilityKey | null | undefined,
  workspace: CurrentWorkspace | null | undefined,
) => {
  if (
    !isDefined(capabilityKey) ||
    !isDefined(workspace) ||
    !isDefined(workspace.enabledCapabilities)
  ) {
    return false;
  }

  const capability = workspace.enabledCapabilities.find(
    (enabledCapability) => enabledCapability.key === capabilityKey,
  );

  return capability?.value === true;
};
