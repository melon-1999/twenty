import { Button } from 'twenty-ui/input';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { OpportunityStatusPill } from '@/object-record/record-show/opportunity/components/OpportunityStatusPill';

type OpportunityWonLostActionsProps = {
  recordId: string;
  status: string;
  statusLabel: string;
};

export const OpportunityWonLostActions = ({
  recordId,
  status,
  statusLabel,
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <OpportunityStatusPill status={status} label={statusLabel} />
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
    </div>
  );
};
