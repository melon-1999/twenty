import { type StatusPillVariant } from 'twenty-ui/data-display';

export const opportunityStatusPillVariant = (
  status: string,
): StatusPillVariant => {
  if (status === 'WON') return 'success';
  if (status === 'LOST') return 'danger';
  return 'neutral';
};
