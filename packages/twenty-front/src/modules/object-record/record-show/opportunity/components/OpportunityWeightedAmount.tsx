import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { computeWeightedAmountDisplay } from '@/object-record/record-show/opportunity/utils/computeWeightedAmountDisplay';

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type OpportunityWeightedAmountProps = {
  amount: { amountMicros: number; currencyCode: string } | null;
  probability: number | null;
};

// derives the currency symbol via Intl instead of hand-rolling a code-to-symbol map
const getCurrencySymbol = (currencyCode: string): string => {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0);

  return parts.find((part) => part.type === 'currency')?.value ?? currencyCode;
};

export const OpportunityWeightedAmount = ({
  amount,
  probability,
}: OpportunityWeightedAmountProps) => {
  const { formatNumber } = useNumberFormat();

  const weightedAmountDisplay = computeWeightedAmountDisplay({
    amount,
    probability,
  });

  if (!weightedAmountDisplay) {
    return null;
  }

  const formattedAmount = formatNumber(
    weightedAmountDisplay.amountMicros / 1_000_000,
    { decimals: 0 },
  );
  const currencySymbol = getCurrencySymbol(weightedAmountDisplay.currencyCode);

  return (
    <StyledLabel>
      {t`Gewichtet`}: {formattedAmount} {currencySymbol} (
      {weightedAmountDisplay.probability}%)
    </StyledLabel>
  );
};
