import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { IconClock } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useOpportunityRottingForRecord } from '@/object-record/record-show/opportunity/hooks/useOpportunityRottingForRecord';

const StyledIndicator = styled.span`
  align-items: center;
  color: ${themeCssVariables.tag.text.red};
  display: inline-flex;
`;

type OpportunityRottingIndicatorProps = { recordId: string };

export const OpportunityRottingIndicator = ({
  recordId,
}: OpportunityRottingIndicatorProps) => {
  const { isRotting, daysInStage } = useOpportunityRottingForRecord(recordId);

  if (!isRotting || daysInStage === null) {
    return null;
  }

  return (
    <StyledIndicator title={t`${daysInStage} Tage in Phase`}>
      <IconClock size={14} />
    </StyledIndicator>
  );
};
