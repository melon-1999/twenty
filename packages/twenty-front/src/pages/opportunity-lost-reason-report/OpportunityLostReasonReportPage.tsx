import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import {
  CoreObjectNameSingular,
  type CurrencyMetadata,
} from 'twenty-shared/types';
import { IconTrendingDown } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { OpportunityLostReasonTable } from '@/object-record/opportunity-lost-reason-report/components/OpportunityLostReasonTable';
import { computeLostReasonBreakdown } from '@/object-record/opportunity-lost-reason-report/utils/computeLostReasonBreakdown';
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

type OpportunityLostReasonRecord = {
  id: string;
  __typename: 'Opportunity';
  lostReason: string | null;
  amount: CurrencyMetadata | null;
  status: string;
};

export const OpportunityLostReasonReportPage = () => {
  const { records, loading } = useFindManyRecords<OpportunityLostReasonRecord>({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    filter: { status: { eq: 'LOST' } },
    recordGqlFields: {
      amount: true,
      lostReason: true,
      status: true,
    },
    limit: 1000,
  });

  const result = computeLostReasonBreakdown(
    records.map((record) => ({
      lostReason: record.lostReason,
      amountMicros: record.amount?.amountMicros ?? null,
    })),
  );

  const currencyCode =
    records
      .map((record) => record.amount?.currencyCode)
      .find((code): code is string => typeof code === 'string') ?? 'USD';

  return (
    <PageContainer>
      <PageHeader title={t`Verlustgründe`} Icon={IconTrendingDown} />
      <StyledBody>
        {loading ? null : result.totalCount === 0 ? (
          <StyledEmpty>{t`Keine verlorenen Opportunities.`}</StyledEmpty>
        ) : (
          <OpportunityLostReasonTable
            result={result}
            currencyCode={currencyCode}
          />
        )}
      </StyledBody>
    </PageContainer>
  );
};
