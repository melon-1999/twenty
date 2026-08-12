import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const isAiAssistantModuleEnabledState = createAtomState<boolean>({
  key: 'isAiAssistantModuleEnabled',
  defaultValue: true,
});
