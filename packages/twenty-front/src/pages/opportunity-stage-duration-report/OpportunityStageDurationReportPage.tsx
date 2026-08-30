import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { IconHourglassHigh } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { OpportunityStageDurationTable } from '@/object-record/opportunity-stage-duration-report/components/OpportunityStageDurationTable';
import { computeStageDurationBreakdown } from '@/object-record/opportunity-stage-duration-report/utils/computeStageDurationBreakdown';
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

type OpportunityStageDurationRecord = {
  id: string;
  __typename: 'Opportunity';
  stage: string | null;
  stageChangedAt: string | null;
  status: string;
};

export const OpportunityStageDurationReportPage = () => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const stageField = objectMetadataItem.fields.find(
    (field) => field.name === 'stage',
  );

  const orderedStages = [...(stageField?.options ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((option) => ({ value: option.value, label: option.label }));

  const { records, loading } =
    useFindManyRecords<OpportunityStageDurationRecord>({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      filter: { status: { eq: 'OPEN' } },
      recordGqlFields: {
        stage: true,
        stageChangedAt: true,
        status: true,
      },
      limit: 1000,
    });

  const result = computeStageDurationBreakdown(
    orderedStages,
    records.map((record) => ({
      stage: record.stage,
      stageChangedAt: record.stageChangedAt,
    })),
    new Date(),
  );

  return (
    <PageContainer>
      <PageHeader title={t`Phasen-Dauer`} Icon={IconHourglassHigh} />
      <StyledBody>
        {loading ? null : result.totalOpenCount === 0 ? (
          <StyledEmpty>{t`Keine offenen Opportunities.`}</StyledEmpty>
        ) : (
          <OpportunityStageDurationTable result={result} />
        )}
      </StyledBody>
    </PageContainer>
  );
};
