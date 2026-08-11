import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const isEmailModuleEnabledState = createAtomState<boolean>({
  key: 'isEmailModuleEnabled',
  defaultValue: true,
});
