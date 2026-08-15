import { StatusPill } from 'twenty-ui/data-display';

import { opportunityStatusPillVariant } from '@/object-record/record-show/opportunity/utils/opportunityStatusPillVariant';

type OpportunityStatusPillProps = { status: string; label: string };

export const OpportunityStatusPill = ({
  status,
  label,
}: OpportunityStatusPillProps) => (
  <StatusPill
    variant={opportunityStatusPillVariant(status)}
    label={label}
    withDot
  />
);
