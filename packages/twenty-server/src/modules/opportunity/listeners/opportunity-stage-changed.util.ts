import { isDefined } from 'twenty-shared/utils';

// Recursion guard: a write that only touches stageChangedAt leaves stage
// equal, so this returns false and the listener does not re-trigger itself.
export const shouldResetStageChangedAt = (
  before: { stage?: string | null } | undefined,
  after: { stage?: string | null } | undefined,
): boolean =>
  isDefined(before) && isDefined(after) && before.stage !== after.stage;
