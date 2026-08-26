import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import {
  CoreObjectNameSingular,
  type CurrencyMetadata,
} from 'twenty-shared/types';
import { IconChartBar } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { OpportunityForecastTable } from '@/object-record/opportunity-forecast/components/OpportunityForecastTable';
import { computeOpportunityForecast } from '@/object-record/opportunity-forecast/utils/computeOpportunityForecast';
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

type OpportunityForecastRecord = {
  id: string;
  __typename: 'Opportunity';
  closeDate: string | null;
  amount: CurrencyMetadata | null;
  probability: number | null;
  status: string;
};

export const OpportunityForecastPage = () => {
  const { records, loading } = useFindManyRecords<OpportunityForecastRecord>({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    filter: { status: { eq: 'OPEN' } },
    recordGqlFields: {
      amount: true,
      closeDate: true,
      probability: true,
      status: true,
    },
    limit: 1000,
  });

  const result = computeOpportunityForecast(
    records.map((record) => ({
      closeDate: record.closeDate,
      amountMicros: record.amount?.amountMicros ?? null,
      probability: record.probability,
    })),
  );

  const currencyCode =
    records
      .map((record) => record.amount?.currencyCode)
      .find((code): code is string => typeof code === 'string') ?? 'USD';

  return (
    <PageContainer>
      <PageHeader title={t`Forecast`} Icon={IconChartBar} />
      <StyledBody>
        {loading ? null : result.totalCount === 0 ? (
          <StyledEmpty>{t`No open opportunities to forecast.`}</StyledEmpty>
        ) : (
          <OpportunityForecastTable
            result={result}
            currencyCode={currencyCode}
          />
        )}
      </StyledBody>
    </PageContainer>
  );
};
