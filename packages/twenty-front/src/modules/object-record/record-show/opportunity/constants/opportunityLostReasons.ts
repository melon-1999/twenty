import { t } from '@lingui/core/macro';

export const OPPORTUNITY_LOST_REASONS: { value: string; label: string }[] = [
  { value: 'TOO_EXPENSIVE', label: t`Zu teuer` },
  { value: 'LOST_TO_COMPETITOR', label: t`Konkurrenz` },
  { value: 'NO_BUDGET', label: t`Kein Budget` },
  { value: 'BAD_TIMING', label: t`Timing` },
  { value: 'NO_DECISION', label: t`Keine Entscheidung` },
  { value: 'OTHER', label: t`Sonstiges` },
];
