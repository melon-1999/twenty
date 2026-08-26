import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { Button } from 'twenty-ui/input';
import { MenuItem } from 'twenty-ui/navigation';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { OpportunityStatusPill } from '@/object-record/record-show/opportunity/components/OpportunityStatusPill';
import { OPPORTUNITY_LOST_REASONS } from '@/object-record/record-show/opportunity/constants/opportunityLostReasons';
import { getLostReasonLabel } from '@/object-record/record-show/opportunity/utils/getLostReasonLabel';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { beautifyExactDate } from '~/utils/date-utils';

const DROPDOWN_ID = 'opportunity-lost-reason-dropdown';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledClosedAtLabel = styled.span`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledReasonLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type OpportunityWonLostActionsProps = {
  recordId: string;
  status: string;
  closedAt: string | null;
  lostReason: string | null;
};

const getStatusLabel = (status: string): string => {
  if (status === 'WON')
    return t({ message: 'Won', context: 'Opportunity status' });
  if (status === 'LOST')
    return t({ message: 'Lost', context: 'Opportunity status' });
  return t({ message: 'Open', context: 'Opportunity status' });
};

export const OpportunityWonLostActions = ({
  recordId,
  status,
  closedAt,
  lostReason,
}: OpportunityWonLostActionsProps) => {
  const { updateOneRecord } = useUpdateOneRecord();
  const { closeDropdown } = useCloseDropdown();

  const setOutcome = (
    nextStatus: 'OPEN' | 'WON' | 'LOST',
    nextLostReason: string | null,
  ) =>
    updateOneRecord({
      objectNameSingular: 'opportunity',
      idToUpdate: recordId,
      updateOneRecordInput: {
        status: nextStatus,
        closedAt: nextStatus === 'OPEN' ? null : new Date().toISOString(),
        lostReason: nextLostReason,
      },
    });

  const handleLost = (nextLostReason: string | null) => {
    setOutcome('LOST', nextLostReason);
    closeDropdown(DROPDOWN_ID);
  };

  const isClosed = status === 'WON' || status === 'LOST';
  const reasonLabel = getLostReasonLabel(lostReason);

  return (
    <StyledContainer>
      <OpportunityStatusPill status={status} label={getStatusLabel(status)} />
      {isClosed && closedAt && (
        <StyledClosedAtLabel>{beautifyExactDate(closedAt)}</StyledClosedAtLabel>
      )}
      {status === 'LOST' && reasonLabel !== '' && (
        <StyledReasonLabel>{reasonLabel}</StyledReasonLabel>
      )}
      {isClosed ? (
        <Button
          variant="secondary"
          title={t`Reopen`}
          onClick={() => setOutcome('OPEN', null)}
        />
      ) : (
        <>
          <Button
            variant="primary"
            accent="green"
            title={t`Mark as Won`}
            onClick={() => setOutcome('WON', null)}
          />
          <Dropdown
            dropdownId={DROPDOWN_ID}
            dropdownPlacement="bottom-end"
            clickableComponent={
              <Button
                variant="primary"
                accent="danger"
                title={t`Mark as Lost`}
              />
            }
            dropdownComponents={
              <DropdownContent>
                <DropdownMenuItemsContainer>
                  {OPPORTUNITY_LOST_REASONS.map((reason) => (
                    <MenuItem
                      key={reason.value}
                      text={reason.label}
                      onClick={() => handleLost(reason.value)}
                    />
                  ))}
                  <MenuItem
                    text={t`Ohne Grund`}
                    onClick={() => handleLost(null)}
                  />
                </DropdownMenuItemsContainer>
              </DropdownContent>
            }
          />
        </>
      )}
    </StyledContainer>
  );
};
