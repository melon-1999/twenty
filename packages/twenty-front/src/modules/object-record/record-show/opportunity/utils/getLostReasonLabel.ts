import { OPPORTUNITY_LOST_REASONS } from '@/object-record/record-show/opportunity/constants/opportunityLostReasons';

export const getLostReasonLabel = (value: string | null): string =>
  OPPORTUNITY_LOST_REASONS.find((reason) => reason.value === value)?.label ??
  '';
