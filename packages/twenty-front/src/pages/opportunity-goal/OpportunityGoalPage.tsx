import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import {
  CoreObjectNameSingular,
  type CurrencyMetadata,
} from 'twenty-shared/types';
import { IconTarget } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useOpportunityMonthlyGoal } from '@/object-record/record-show/opportunity/hooks/useOpportunityMonthlyGoal';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { OpportunityGoalProgress } from '@/object-record/opportunity-goal/components/OpportunityGoalProgress';
import { computeMonthlyGoalProgress } from '@/object-record/opportunity-goal/utils/computeMonthlyGoalProgress';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

type GoalWonDealRecord = {
  id: string;
  __typename: 'Opportunity';
  amount: CurrencyMetadata | null;
  closedAt: string | null;
  status: string;
};

export const OpportunityGoalPage = () => {
  const { config, loading: goalLoading } = useOpportunityMonthlyGoal();

  const { records, loading: recordsLoading } =
    useFindManyRecords<GoalWonDealRecord>({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      filter: { status: { eq: 'WON' } },
      recordGqlFields: { amount: true, closedAt: true, status: true },
      limit: 1000,
    });

  const loading = goalLoading || recordsLoading;

  const targetMicros =
    config?.targetAmount && config.targetAmount > 0
      ? config.targetAmount * 1_000_000
      : null;

  const result = computeMonthlyGoalProgress(
    records.map((record) => ({
      amountMicros: record.amount?.amountMicros ?? null,
      closedAt: record.closedAt,
    })),
    targetMicros,
    new Date(),
  );

  const currencyCode =
    records
      .map((record) => record.amount?.currencyCode)
      .find((code): code is string => typeof code === 'string') ?? 'USD';

  return (
    <PageContainer>
      <PageHeader title={t`Ziele`} Icon={IconTarget} />
      <StyledBody>
        {loading ? null : (
          <OpportunityGoalProgress
            result={result}
            currencyCode={currencyCode}
          />
        )}
      </StyledBody>
    </PageContainer>
  );
};
