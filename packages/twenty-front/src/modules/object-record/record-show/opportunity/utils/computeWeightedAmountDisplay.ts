import { isDefined } from 'twenty-shared/utils';

type OpportunityAmount = { amountMicros: number; currencyCode: string } | null;

type WeightedAmountDisplay = {
  amountMicros: number;
  currencyCode: string;
  probability: number;
};

// mirrors the server-side computeWeightedAmount math, adding probability for the label
export const computeWeightedAmountDisplay = ({
  amount,
  probability,
}: {
  amount: OpportunityAmount;
  probability: number | null;
}): WeightedAmountDisplay | null => {
  if (!isDefined(amount) || !isDefined(probability)) {
    return null;
  }

  return {
    amountMicros: Math.round((amount.amountMicros * probability) / 100),
    currencyCode: amount.currencyCode,
    probability,
  };
};
