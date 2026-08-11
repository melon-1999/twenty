import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const isCalendarModuleEnabledState = createAtomState<boolean>({
  key: 'isCalendarModuleEnabled',
  defaultValue: true,
});
