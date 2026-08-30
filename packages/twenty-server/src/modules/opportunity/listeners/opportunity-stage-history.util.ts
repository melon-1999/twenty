import { type OpportunityStageHistoryEntry } from 'src/modules/opportunity/types/opportunity-stage-history-entry.type';

// Returns the next stageHistory when it must change, or null when the current
// stage already matches the last entry (idempotent: no write needed then).
export const reconcileStageHistory = (
  currentStage: string,
  history: OpportunityStageHistoryEntry[] | null | undefined,
  enteredAtIso: string,
): OpportunityStageHistoryEntry[] | null => {
  const safeHistory = history ?? [];
  const lastEntry = safeHistory[safeHistory.length - 1];

  if (lastEntry?.stage === currentStage) {
    return null;
  }

  return [...safeHistory, { stage: currentStage, enteredAt: enteredAtIso }];
};
