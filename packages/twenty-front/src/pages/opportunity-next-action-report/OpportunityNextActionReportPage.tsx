import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import {
  CoreObjectNameSingular,
  type CurrencyMetadata,
} from 'twenty-shared/types';
import { IconCalendarDue } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { OpportunityNextActionTable } from '@/object-record/opportunity-next-action/components/OpportunityNextActionTable';
import { computeMissingNextAction } from '@/object-record/opportunity-next-action/utils/computeMissingNextAction';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

type NextActionOpportunityRecord = {
  id: string;
  __typename: 'Opportunity';
  name: string | null;
  stage: string | null;
  amount: CurrencyMetadata | null;
  status: string;
};

type NextActionTaskTargetRecord = {
  id: string;
  __typename: 'TaskTarget';
  targetOpportunityId: string | null;
  task: { dueAt: string | null; status: string | null } | null;
};

export const OpportunityNextActionReportPage = () => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const stageField = objectMetadataItem.fields.find(
    (field) => field.name === 'stage',
  );
  const stageLabelByValue = Object.fromEntries(
    (stageField?.options ?? []).map((option) => [option.value, option.label]),
  );

  const { records: opportunities, loading: opportunitiesLoading } =
    useFindManyRecords<NextActionOpportunityRecord>({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      filter: { status: { eq: 'OPEN' } },
      recordGqlFields: {
        id: true,
        name: true,
        stage: true,
        amount: true,
        status: true,
      },
      limit: 1000,
    });

  const { records: taskTargets, loading: taskTargetsLoading } =
    useFindManyRecords<NextActionTaskTargetRecord>({
      objectNameSingular: CoreObjectNameSingular.TaskTarget,
      filter: { targetOpportunityId: { is: 'NOT_NULL' } },
      recordGqlFields: {
        targetOpportunityId: true,
        task: { dueAt: true, status: true },
      },
      limit: 1000,
    });

  const loading = opportunitiesLoading || taskTargetsLoading;

  const result = computeMissingNextAction(
    opportunities.map((opportunity) => ({
      id: opportunity.id,
      name: opportunity.name,
      stage: opportunity.stage,
      amountMicros: opportunity.amount?.amountMicros ?? null,
    })),
    taskTargets.map((taskTarget) => ({
      targetOpportunityId: taskTarget.targetOpportunityId,
      dueAt: taskTarget.task?.dueAt ?? null,
      status: taskTarget.task?.status ?? null,
    })),
    new Date(),
  );

  const currencyCode =
    opportunities
      .map((opportunity) => opportunity.amount?.currencyCode)
      .find((code): code is string => typeof code === 'string') ?? 'USD';

  return (
    <PageContainer>
      <PageHeader title={t`Nächste Aktionen`} Icon={IconCalendarDue} />
      <StyledBody>
        {loading ? null : result.totalMissing === 0 ? (
          <StyledEmpty>{t`Alle offenen Opportunities haben eine nächste Aktion.`}</StyledEmpty>
        ) : (
          <OpportunityNextActionTable
            result={result}
            stageLabelByValue={stageLabelByValue}
            currencyCode={currencyCode}
          />
        )}
      </StyledBody>
    </PageContainer>
  );
};
