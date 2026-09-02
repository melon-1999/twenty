import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';

import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { type NextActionResult } from '@/object-record/opportunity-next-action/utils/computeMissingNextAction';
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

type OpportunityNextActionTableProps = {
  result: NextActionResult;
  stageLabelByValue: Record<string, string>;
  currencyCode: string;
};

export const OpportunityNextActionTable = ({
  result,
  stageLabelByValue,
  currencyCode,
}: OpportunityNextActionTableProps) => {
  const { formatNumber } = useNumberFormat();
  const symbol = getCurrencySymbol(currencyCode);

  const formatAmount = (amountMicros: number | null) =>
    amountMicros === null
      ? '-'
      : `${symbol}${formatNumber(amountMicros / 1_000_000, { decimals: 0 })}`;

  return (
    <Table>
      <TableRow>
        <TableHeader>{t`Deal`}</TableHeader>
        <TableHeader>{t`Phase`}</TableHeader>
        <TableHeader>{t`Betrag`}</TableHeader>
      </TableRow>
      <TableBody>
        {result.opportunities.map((opportunity) => (
          <TableRow key={opportunity.id}>
            <TableCell>{opportunity.name ?? '-'}</TableCell>
            <TableCell>
              {opportunity.stage !== null
                ? (stageLabelByValue[opportunity.stage] ?? opportunity.stage)
                : '-'}
            </TableCell>
            <TableCell>
              <StyledAmount>
                {formatAmount(opportunity.amountMicros)}
              </StyledAmount>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
