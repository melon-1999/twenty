import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { format } from 'date-fns';
import { IconCalendarDue } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useOpportunityNextActivity } from '@/object-record/record-show/opportunity/hooks/useOpportunityNextActivity';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { dateLocaleState } from '~/localization/states/dateLocaleState';

const StyledBadge = styled.span`
  align-items: center;
  border-radius: ${themeCssVariables.border.radius.sm};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledMissing = styled(StyledBadge)`
  background-color: ${themeCssVariables.tag.background.red};
  color: ${themeCssVariables.tag.text.red};
`;

const StyledUpcoming = styled(StyledBadge)`
  background-color: ${themeCssVariables.background.transparent.light};
  color: ${themeCssVariables.font.color.secondary};
`;

type OpportunityNextActivityBadgeProps = {
  recordId: string;
  status: string;
};

export const OpportunityNextActivityBadge = ({
  recordId,
  status,
}: OpportunityNextActivityBadgeProps) => {
  const dateLocale = useAtomStateValue(dateLocaleState);
  const { nextActivityAt, loading } = useOpportunityNextActivity(recordId, {
    skip: status !== 'OPEN',
  });

  // Closed deals do not need a next action.
  if (status !== 'OPEN') {
    return null;
  }

  // Avoid flashing the "missing" state while the task query is in flight.
  if (loading) {
    return null;
  }

  if (nextActivityAt === null) {
    return (
      <StyledMissing>
        <IconCalendarDue size={14} />
        {t`Keine nächste Aktion`}
      </StyledMissing>
    );
  }

  const formatted = format(new Date(nextActivityAt), 'd. MMMM yyyy', {
    locale: dateLocale.localeCatalog,
  });

  return (
    <StyledUpcoming>
      <IconCalendarDue size={14} />
      {t`Nächste Aktion: ${formatted}`}
    </StyledUpcoming>
  );
};
