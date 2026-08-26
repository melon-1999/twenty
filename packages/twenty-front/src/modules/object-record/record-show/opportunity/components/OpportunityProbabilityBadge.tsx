import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useOpportunityProbabilityForRecord } from '@/object-record/record-show/opportunity/hooks/useOpportunityProbabilityForRecord';

const StyledBadge = styled.span`
  align-items: center;
  background-color: ${themeCssVariables.tag.background.gray};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.tag.text.gray};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

type OpportunityProbabilityBadgeProps = { recordId: string };

export const OpportunityProbabilityBadge = ({
  recordId,
}: OpportunityProbabilityBadgeProps) => {
  const { probability } = useOpportunityProbabilityForRecord(recordId);

  if (probability === null) {
    return null;
  }

  return <StyledBadge>{t`${probability}%`}</StyledBadge>;
};
