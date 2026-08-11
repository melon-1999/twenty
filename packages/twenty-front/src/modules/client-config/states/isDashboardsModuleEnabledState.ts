import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const isDashboardsModuleEnabledState = createAtomState<boolean>({
  key: 'isDashboardsModuleEnabled',
  defaultValue: true,
});
