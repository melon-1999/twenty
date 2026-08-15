import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { Button } from 'twenty-ui/input';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { OpportunityStatusPill } from '@/object-record/record-show/opportunity/components/OpportunityStatusPill';
import { beautifyExactDate } from '~/utils/date-utils';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledClosedAtLabel = styled.span`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
`;

type OpportunityWonLostActionsProps = {
  recordId: string;
  status: string;
  closedAt: string | null;
};

const getStatusLabel = (status: string): string => {
  if (status === 'WON') return t({ message: 'Won', context: 'Opportunity status' });
  if (status === 'LOST')
    return t({ message: 'Lost', context: 'Opportunity status' });
  return t({ message: 'Open', context: 'Opportunity status' });
};

export const OpportunityWonLostActions = ({
  recordId,
  status,
  closedAt,
}: OpportunityWonLostActionsProps) => {
  const { updateOneRecord } = useUpdateOneRecord();

  const setOutcome = (nextStatus: 'OPEN' | 'WON' | 'LOST') =>
    updateOneRecord({
      objectNameSingular: 'opportunity',
      idToUpdate: recordId,
      updateOneRecordInput: {
        status: nextStatus,
        closedAt: nextStatus === 'OPEN' ? null : new Date().toISOString(),
      },
    });

  const isClosed = status === 'WON' || status === 'LOST';

  return (
    <StyledContainer>
      <OpportunityStatusPill status={status} label={getStatusLabel(status)} />
      {isClosed && closedAt && (
        <StyledClosedAtLabel>{beautifyExactDate(closedAt)}</StyledClosedAtLabel>
      )}
      {isClosed ? (
        <Button
          variant="secondary"
          title={t`Reopen`}
          onClick={() => setOutcome('OPEN')}
        />
      ) : (
        <>
          <Button
            variant="primary"
            accent="green"
            title={t`Mark as Won`}
            onClick={() => setOutcome('WON')}
          />
          <Button
            variant="primary"
            accent="danger"
            title={t`Mark as Lost`}
            onClick={() => setOutcome('LOST')}
          />
        </>
      )}
    </StyledContainer>
  );
};
