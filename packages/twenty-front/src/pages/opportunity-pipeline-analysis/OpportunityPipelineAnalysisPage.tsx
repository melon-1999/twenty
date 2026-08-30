import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { IconTrendingUp } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { OpportunityPipelineAnalysisTable } from '@/object-record/opportunity-pipeline-analysis/components/OpportunityPipelineAnalysisTable';
import { computeStagePipelineBreakdown } from '@/object-record/opportunity-pipeline-analysis/utils/computeStagePipelineBreakdown';
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

type StageHistoryEntry = { stage: string; enteredAt: string };

type OpportunityPipelineRecord = {
  id: string;
  __typename: 'Opportunity';
  stageHistory: StageHistoryEntry[] | null;
};

export const OpportunityPipelineAnalysisPage = () => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const stageField = objectMetadataItem.fields.find(
    (field) => field.name === 'stage',
  );

  const orderedStages = [...(stageField?.options ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((option) => ({ value: option.value, label: option.label }));

  const { records, loading } = useFindManyRecords<OpportunityPipelineRecord>({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    recordGqlFields: { stageHistory: true },
    limit: 1000,
  });

  const result = computeStagePipelineBreakdown(
    orderedStages,
    records.map((record) => ({ stageHistory: record.stageHistory })),
  );

  const hasReachedDeals = result.buckets.some(
    (bucket) => bucket.reachedCount > 0,
  );

  return (
    <PageContainer>
      <PageHeader title={t`Pipeline-Analyse`} Icon={IconTrendingUp} />
      <StyledBody>
        {loading ? null : !hasReachedDeals ? (
          <StyledEmpty>{t`Keine Opportunities.`}</StyledEmpty>
        ) : (
          <OpportunityPipelineAnalysisTable result={result} />
        )}
      </StyledBody>
    </PageContainer>
  );
};
