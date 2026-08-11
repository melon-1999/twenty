import { isDashboardsModuleEnabledState } from '@/client-config/states/isDashboardsModuleEnabledState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';
import { ProductCapabilityKey } from '~/generated-metadata/graphql';

export const useIsCapabilityEnabled = (
  capabilityKey: ProductCapabilityKey | null,
): boolean => {
  // Read all deploy-flag availability atoms unconditionally (hooks rule).
  const isDashboardsModuleEnabled = useAtomStateValue(
    isDashboardsModuleEnabledState,
  );

  if (!isDefined(capabilityKey)) {
    return false;
  }

  // Capabilities with a deploy flag resolve to it; all others are always available.
  const availabilityByCapability: Partial<
    Record<ProductCapabilityKey, boolean>
  > = {
    [ProductCapabilityKey.DASHBOARDS]: isDashboardsModuleEnabled,
  };

  return availabilityByCapability[capabilityKey] ?? true;
};
