import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const isAutomationsModuleEnabledState = createAtomState<boolean>({
  key: 'isAutomationsModuleEnabled',
  defaultValue: true,
});
