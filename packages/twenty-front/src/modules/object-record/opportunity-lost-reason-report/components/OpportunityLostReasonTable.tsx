import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';

import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { type LostReasonBreakdownResult } from '@/object-record/opportunity-lost-reason-report/utils/computeLostReasonBreakdown';
import { getLostReasonLabel } from '@/object-record/record-show/opportunity/utils/getLostReasonLabel';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const getCurrencySymbol = (currencyCode: string): string => {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0);

  return parts.find((part) => part.type === 'currency')?.value ?? currencyCode;
};

const StyledAmount = styled.span`
  font-variant-numeric: tabular-nums;
`;

type OpportunityLostReasonTableProps = {
  result: LostReasonBreakdownResult;
  currencyCode: string;
};

export const OpportunityLostReasonTable = ({
  result,
  currencyCode,
}: OpportunityLostReasonTableProps) => {
  const { formatNumber } = useNumberFormat();
  const symbol = getCurrencySymbol(currencyCode);

  const formatMicros = (micros: number) =>
    `${symbol}${formatNumber(micros / 1_000_000, { decimals: 0 })}`;

  const reasonLabel = (bucket: LostReasonBreakdownResult['buckets'][number]) =>
    bucket.hasReason ? getLostReasonLabel(bucket.reason) : t`Ohne Grund`;

  return (
    <Table>
      <TableRow>
        <TableHeader>{t`Grund`}</TableHeader>
        <TableHeader>{t`Anzahl`}</TableHeader>
        <TableHeader>{t`Verlorener Betrag`}</TableHeader>
      </TableRow>
      <TableBody>
        {result.buckets.map((bucket) => (
          <TableRow key={bucket.reason}>
            <TableCell>{reasonLabel(bucket)}</TableCell>
            <TableCell>{bucket.count}</TableCell>
            <TableCell>
              <StyledAmount>{formatMicros(bucket.totalMicros)}</StyledAmount>
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell>{t`Gesamt`}</TableCell>
          <TableCell>{result.totalCount}</TableCell>
          <TableCell>
            <StyledAmount>{formatMicros(result.totalMicros)}</StyledAmount>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
