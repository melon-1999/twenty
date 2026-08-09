import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { type ProductCapabilityKey } from '~/generated-metadata/graphql';

export const useIsCapabilityEnabled = (
  capabilityKey: ProductCapabilityKey | null,
) => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  if (!capabilityKey) {
    return false;
  }

  const capability = currentWorkspace?.enabledCapabilities?.find(
    (enabledCapability) => enabledCapability.key === capabilityKey,
  );

  return !!capability?.value;
};
