import { type CurrentWorkspace } from '@/auth/states/currentWorkspaceState';
import { isDefined } from 'twenty-shared/utils';
import { type ProductCapabilityKey } from '~/generated-metadata/graphql';

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
