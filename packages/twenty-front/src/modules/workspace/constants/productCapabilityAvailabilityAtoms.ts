import { isDashboardsModuleEnabledState } from '@/client-config/states/isDashboardsModuleEnabledState';
import { type State } from '@/ui/utilities/state/jotai/types/State';
import { ProductCapabilityKey } from '~/generated-metadata/graphql';

// Maps a capability to the clientConfig deploy-flag atom that gates it.
// Capabilities absent from this map have no deploy flag and are always available.
// NOTE: because Jotai atom reads are hooks, each atom here must also be read
// unconditionally in useIsCapabilityEnabled; adding an entry requires adding its read there.
export const PRODUCT_CAPABILITY_AVAILABILITY_ATOM: Partial<
  Record<ProductCapabilityKey, State<boolean>>
> = {
  [ProductCapabilityKey.DASHBOARDS]: isDashboardsModuleEnabledState,
};
