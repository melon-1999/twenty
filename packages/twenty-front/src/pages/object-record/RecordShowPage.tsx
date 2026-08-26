import { useParams } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { SidePanelToggleButton } from '@/side-panel/components/SidePanelToggleButton';
import { RecordShowCommandMenu } from '@/command-menu-item/components/RecordShowCommandMenu';
import { CommandMenuComponentInstanceContext } from '@/command-menu/states/contexts/CommandMenuComponentInstanceContext';
import { TimelineActivityContext } from '@/activities/timeline-activities/contexts/TimelineActivityContext';
import { MAIN_CONTEXT_STORE_INSTANCE_ID } from '@/context-store/constants/MainContextStoreInstanceId';
import { ContextStoreComponentInstanceContext } from '@/context-store/states/contexts/ContextStoreComponentInstanceContext';
import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { RecordComponentInstanceContextsWrapper } from '@/object-record/components/RecordComponentInstanceContextsWrapper';
import { OpportunityRottingBadge } from '@/object-record/record-show/opportunity/components/OpportunityRottingBadge';
import { OpportunityWeightedAmount } from '@/object-record/record-show/opportunity/components/OpportunityWeightedAmount';
import { OpportunityWonLostActions } from '@/object-record/record-show/opportunity/components/OpportunityWonLostActions';
import { PageLayoutRecordPageRenderer } from '@/object-record/record-show/components/PageLayoutRecordPageRenderer';
import { RecordShowPageSSESubscribeEffect } from '@/object-record/record-show/components/RecordShowPageSSESubscribeEffect';
import { useRecordShowPage } from '@/object-record/record-show/hooks/useRecordShowPage';
import { computeRecordShowComponentInstanceId } from '@/object-record/record-show/utils/computeRecordShowComponentInstanceId';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { RecordShowPageHeader } from '~/pages/object-record/RecordShowPageHeader';
import { RecordShowPageTitle } from '~/pages/object-record/RecordShowPageTitle';

export const RecordShowPage = () => {
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );

  const parameters = useParams<{
    objectNameSingular: string;
    objectRecordId: string;
  }>();

  const { objectNameSingular, objectRecordId } = useRecordShowPage(
    parameters.objectNameSingular ?? '',
    parameters.objectRecordId ?? '',
  );

  const recordShowComponentInstanceId =
    computeRecordShowComponentInstanceId(objectRecordId);

  // harmless no-op for non-opportunity records
  const opportunityStatus = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    {
      recordId: objectRecordId,
      fieldName: 'status',
    },
  ) as string | null;

  const opportunityClosedAt = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    {
      recordId: objectRecordId,
      fieldName: 'closedAt',
    },
  ) as string | null;

  const opportunityLostReason = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    {
      recordId: objectRecordId,
      fieldName: 'lostReason',
    },
  ) as string | null;

  const opportunityStage = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    {
      recordId: objectRecordId,
      fieldName: 'stage',
    },
  ) as string | null;

  const opportunityStageChangedAt = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    {
      recordId: objectRecordId,
      fieldName: 'stageChangedAt',
    },
  ) as string | null;

  const opportunityProbability = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    {
      recordId: objectRecordId,
      fieldName: 'probability',
    },
  ) as number | null;

  const opportunityAmount = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    {
      recordId: objectRecordId,
      fieldName: 'amount',
    },
  ) as { amountMicros: number; currencyCode: string } | null;

  return (
    <RecordComponentInstanceContextsWrapper
      componentInstanceId={recordShowComponentInstanceId}
    >
      <ContextStoreComponentInstanceContext.Provider
        value={{ instanceId: MAIN_CONTEXT_STORE_INSTANCE_ID }}
      >
        <CommandMenuComponentInstanceContext.Provider
          value={{ instanceId: recordShowComponentInstanceId }}
        >
          <RecordShowPageTitle
            objectNameSingular={objectNameSingular}
            objectRecordId={objectRecordId}
          />
          <PageCardLayout
            header={
              <RecordShowPageHeader
                objectNameSingular={objectNameSingular}
                objectRecordId={objectRecordId}
              >
                {objectNameSingular === CoreObjectNameSingular.Opportunity && (
                  <>
                    <OpportunityRottingBadge
                      status={opportunityStatus ?? 'OPEN'}
                      stage={opportunityStage ?? ''}
                      stageChangedAt={opportunityStageChangedAt}
                    />
                    <OpportunityWeightedAmount
                      amount={opportunityAmount}
                      probability={opportunityProbability}
                    />
                    <OpportunityWonLostActions
                      recordId={objectRecordId}
                      status={opportunityStatus ?? 'OPEN'}
                      closedAt={opportunityClosedAt}
                      lostReason={opportunityLostReason}
                    />
                  </>
                )}
                <RecordShowCommandMenu />
                {!isLayoutCustomizationModeEnabled && <SidePanelToggleButton />}
              </RecordShowPageHeader>
            }
          >
            <TimelineActivityContext.Provider
              value={{
                recordId: objectRecordId,
              }}
            >
              <PageLayoutRecordPageRenderer
                targetRecordIdentifier={{
                  id: objectRecordId,
                  targetObjectNameSingular: objectNameSingular,
                }}
                isInSidePanel={false}
              />
              <RecordShowPageSSESubscribeEffect
                objectNameSingular={objectNameSingular}
                recordId={objectRecordId}
              />
            </TimelineActivityContext.Provider>
          </PageCardLayout>
        </CommandMenuComponentInstanceContext.Provider>
      </ContextStoreComponentInstanceContext.Provider>
    </RecordComponentInstanceContextsWrapper>
  );
};
