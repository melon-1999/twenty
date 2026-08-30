import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';

import { type StagePipelineBreakdownResult } from '@/object-record/opportunity-pipeline-analysis/utils/computeStagePipelineBreakdown';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const StyledNumeric = styled.span`
  font-variant-numeric: tabular-nums;
`;

type OpportunityPipelineAnalysisTableProps = {
  result: StagePipelineBreakdownResult;
};

export const OpportunityPipelineAnalysisTable = ({
  result,
}: OpportunityPipelineAnalysisTableProps) => {
  const formatDays = (averageDurationDays: number | null) =>
    averageDurationDays === null
      ? '-'
      : String(Math.round(averageDurationDays));

  const formatConversion = (conversionToNextRate: number | null) =>
    conversionToNextRate === null
      ? '-'
      : `${Math.round(conversionToNextRate * 100)}%`;

  return (
    <Table>
      <TableRow>
        <TableHeader>{t`Phase`}</TableHeader>
        <TableHeader>{t`Erreicht`}</TableHeader>
        <TableHeader>{t`Ø Dauer (Tage)`}</TableHeader>
        <TableHeader>{t`Konversion → nächste`}</TableHeader>
      </TableRow>
      <TableBody>
        {result.buckets.map((bucket) => (
          <TableRow key={bucket.stage}>
            <TableCell>{bucket.label}</TableCell>
            <TableCell>
              <StyledNumeric>{bucket.reachedCount}</StyledNumeric>
            </TableCell>
            <TableCell>
              <StyledNumeric>
                {formatDays(bucket.averageDurationDays)}
              </StyledNumeric>
            </TableCell>
            <TableCell>
              <StyledNumeric>
                {formatConversion(bucket.conversionToNextRate)}
              </StyledNumeric>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
