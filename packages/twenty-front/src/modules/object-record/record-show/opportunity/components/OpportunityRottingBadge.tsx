import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { IconClock } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useOpportunityStageRottingConfig } from '@/object-record/record-show/opportunity/hooks/useOpportunityStageRottingConfig';
import { computeOpportunityRotting } from '@/object-record/record-show/opportunity/utils/computeOpportunityRotting';

const StyledBadge = styled.span`
  align-items: center;
  background-color: ${themeCssVariables.tag.background.red};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.tag.text.red};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

type OpportunityRottingBadgeProps = {
  status: string;
  stage: string;
  stageChangedAt: string | null;
  now?: Date;
};

export const OpportunityRottingBadge = ({
  status,
  stage,
  stageChangedAt,
  now,
}: OpportunityRottingBadgeProps) => {
  const { config } = useOpportunityStageRottingConfig();

  const { isRotting, daysInStage } = computeOpportunityRotting({
    status,
    stage,
    stageChangedAt,
    config,
    now: now ?? new Date(),
  });

  if (!isRotting || daysInStage === null) {
    return null;
  }

  return (
    <StyledBadge>
      <IconClock size={14} />
      {t`${daysInStage} Tage in Phase`}
    </StyledBadge>
  );
};
