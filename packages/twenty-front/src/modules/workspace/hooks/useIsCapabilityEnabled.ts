import { isCalendarModuleEnabledState } from '@/client-config/states/isCalendarModuleEnabledState';
import { isDashboardsModuleEnabledState } from '@/client-config/states/isDashboardsModuleEnabledState';
import { isEmailModuleEnabledState } from '@/client-config/states/isEmailModuleEnabledState';
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
  const isEmailModuleEnabled = useAtomStateValue(isEmailModuleEnabledState);
  const isCalendarModuleEnabled = useAtomStateValue(
    isCalendarModuleEnabledState,
  );

  if (!isDefined(capabilityKey)) {
    return false;
  }

  // Capabilities with a deploy flag resolve to it; all others are always available.
  const availabilityByCapability: Partial<
    Record<ProductCapabilityKey, boolean>
  > = {
    [ProductCapabilityKey.DASHBOARDS]: isDashboardsModuleEnabled,
    [ProductCapabilityKey.EMAIL]: isEmailModuleEnabled,
    [ProductCapabilityKey.CALENDAR]: isCalendarModuleEnabled,
  };

  return availabilityByCapability[capabilityKey] ?? true;
};
