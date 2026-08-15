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
  statusLabel: string;
  closedAt: string | null;
};

export const OpportunityWonLostActions = ({
  recordId,
  status,
  statusLabel,
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
      <OpportunityStatusPill status={status} label={statusLabel} />
      {isClosed && closedAt && (
        <StyledClosedAtLabel>{beautifyExactDate(closedAt)}</StyledClosedAtLabel>
      )}
      {isClosed ? (
        <Button
          variant="secondary"
          title="Reopen"
          onClick={() => setOutcome('OPEN')}
        />
      ) : (
        <>
          <Button
            variant="primary"
            accent="green"
            title="Mark as Won"
            onClick={() => setOutcome('WON')}
          />
          <Button
            variant="primary"
            accent="danger"
            title="Mark as Lost"
            onClick={() => setOutcome('LOST')}
          />
        </>
      )}
    </StyledContainer>
  );
};
