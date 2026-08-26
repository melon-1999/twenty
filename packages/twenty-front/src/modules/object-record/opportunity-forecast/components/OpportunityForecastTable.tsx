import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { format } from 'date-fns';

import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { type OpportunityForecastResult } from '@/object-record/opportunity-forecast/utils/computeOpportunityForecast';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { dateLocaleState } from '~/localization/states/dateLocaleState';

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

type OpportunityForecastTableProps = {
  result: OpportunityForecastResult;
  currencyCode: string;
};

export const OpportunityForecastTable = ({
  result,
  currencyCode,
}: OpportunityForecastTableProps) => {
  const { formatNumber } = useNumberFormat();
  const dateLocale = useAtomStateValue(dateLocaleState);
  const symbol = getCurrencySymbol(currencyCode);

  const formatMicros = (micros: number) =>
    `${symbol}${formatNumber(micros / 1_000_000, { decimals: 0 })}`;

  const monthLabel = (bucket: OpportunityForecastResult['buckets'][number]) =>
    bucket.hasDate
      ? format(new Date(bucket.year, bucket.month, 1), 'MMMM yyyy', {
          locale: dateLocale.localeCatalog,
        })
      : t`No close date`;

  return (
    <Table>
      <TableRow>
        <TableHeader>{t`Month`}</TableHeader>
        <TableHeader>{t`Deals`}</TableHeader>
        <TableHeader>{t`Total`}</TableHeader>
        <TableHeader>{t`Weighted`}</TableHeader>
      </TableRow>
      <TableBody>
        {result.buckets.map((bucket) => (
          <TableRow key={bucket.monthKey}>
            <TableCell>{monthLabel(bucket)}</TableCell>
            <TableCell>{bucket.count}</TableCell>
            <TableCell>
              <StyledAmount>{formatMicros(bucket.totalMicros)}</StyledAmount>
            </TableCell>
            <TableCell>
              <StyledAmount>{formatMicros(bucket.weightedMicros)}</StyledAmount>
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell>{t`Total`}</TableCell>
          <TableCell>{result.totalCount}</TableCell>
          <TableCell>
            <StyledAmount>{formatMicros(result.totalMicros)}</StyledAmount>
          </TableCell>
          <TableCell>
            <StyledAmount>
              {formatMicros(result.totalWeightedMicros)}
            </StyledAmount>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
