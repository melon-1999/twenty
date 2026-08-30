import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';

import { type StageDurationBreakdownResult } from '@/object-record/opportunity-stage-duration-report/utils/computeStageDurationBreakdown';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const StyledNumeric = styled.span`
  font-variant-numeric: tabular-nums;
`;

type OpportunityStageDurationTableProps = {
  result: StageDurationBreakdownResult;
};

export const OpportunityStageDurationTable = ({
  result,
}: OpportunityStageDurationTableProps) => {
  const formatDays = (averageDays: number | null) =>
    averageDays === null ? '-' : String(Math.round(averageDays));

  return (
    <Table>
      <TableRow>
        <TableHeader>{t`Phase`}</TableHeader>
        <TableHeader>{t`Offene Deals`}</TableHeader>
        <TableHeader>{t`Ø Tage in Phase`}</TableHeader>
      </TableRow>
      <TableBody>
        {result.buckets.map((bucket) => (
          <TableRow key={bucket.stage}>
            <TableCell>{bucket.label}</TableCell>
            <TableCell>
              <StyledNumeric>{bucket.openCount}</StyledNumeric>
            </TableCell>
            <TableCell>
              <StyledNumeric>{formatDays(bucket.averageDays)}</StyledNumeric>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
