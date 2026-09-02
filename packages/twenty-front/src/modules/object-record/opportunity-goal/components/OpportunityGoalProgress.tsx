import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { format } from 'date-fns';

import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { type MonthlyGoalProgressResult } from '@/object-record/opportunity-goal/utils/computeMonthlyGoalProgress';
import { Table } from '@/ui/layout/table/components/Table';
import { TableBody } from '@/ui/layout/table/components/TableBody';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const getCurrencySymbol = (currencyCode: string): string => {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0);

  return parts.find((part) => part.type === 'currency')?.value ?? currencyCode;
};

const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[6]};
`;

const StyledStatRow = styled.div`
  display: flex;
  font-variant-numeric: tabular-nums;
  gap: ${themeCssVariables.spacing[6]};
`;

const StyledStatLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  margin-right: ${themeCssVariables.spacing[1]};
`;

const StyledBarTrack = styled.div`
  background-color: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  height: 10px;
  overflow: hidden;
  width: 100%;
`;

const StyledBarFill = styled.div<{ ratio: number }>`
  background-color: ${themeCssVariables.color.green};
  height: 100%;
  width: ${({ ratio }) => Math.min(1, Math.max(0, ratio)) * 100}%;
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledAmount = styled.span`
  font-variant-numeric: tabular-nums;
`;

type OpportunityGoalProgressProps = {
  result: MonthlyGoalProgressResult;
  currencyCode: string;
};

export const OpportunityGoalProgress = ({
  result,
  currencyCode,
}: OpportunityGoalProgressProps) => {
  const { formatNumber } = useNumberFormat();
  const dateLocale = useAtomStateValue(dateLocaleState);
  const symbol = getCurrencySymbol(currencyCode);

  const formatMicros = (micros: number) =>
    `${symbol}${formatNumber(micros / 1_000_000, { decimals: 0 })}`;

  const { current, history } = result;

  return (
    <div>
      <StyledHeader>
        <StyledStatRow>
          <span>
            <StyledStatLabel>{t`Ziel`}</StyledStatLabel>
            {current.targetMicros === null
              ? t`Kein Ziel gesetzt`
              : formatMicros(current.targetMicros)}
          </span>
          <span>
            <StyledStatLabel>{t`Erreicht`}</StyledStatLabel>
            {formatMicros(current.achievedMicros)}
          </span>
        </StyledStatRow>
        {current.ratio === null ? (
          <StyledHint>{t`Lege ein Monatsziel in den Einstellungen fest.`}</StyledHint>
        ) : (
          <>
            <StyledBarTrack>
              <StyledBarFill ratio={current.ratio} />
            </StyledBarTrack>
            <span>{Math.round(current.ratio * 100)}%</span>
          </>
        )}
      </StyledHeader>

      <Table>
        <TableRow>
          <TableHeader>{t`Monat`}</TableHeader>
          <TableHeader>{t`Gewonnen`}</TableHeader>
          <TableHeader>{t`Ziel`}</TableHeader>
          <TableHeader>%</TableHeader>
        </TableRow>
        <TableBody>
          {history.map((bucket) => {
            const rowRatio =
              current.targetMicros !== null && current.targetMicros > 0
                ? bucket.achievedMicros / current.targetMicros
                : null;

            return (
              <TableRow key={`${bucket.year}-${bucket.month}`}>
                <TableCell>
                  {format(
                    new Date(bucket.year, bucket.month - 1, 1),
                    'MMMM yyyy',
                    {
                      locale: dateLocale.localeCatalog,
                    },
                  )}
                </TableCell>
                <TableCell>
                  <StyledAmount>
                    {formatMicros(bucket.achievedMicros)}
                  </StyledAmount>
                </TableCell>
                <TableCell>
                  <StyledAmount>
                    {current.targetMicros === null
                      ? '-'
                      : formatMicros(current.targetMicros)}
                  </StyledAmount>
                </TableCell>
                <TableCell>
                  {rowRatio === null ? '-' : `${Math.round(rowRatio * 100)}%`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
