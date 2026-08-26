import { isDefined } from 'twenty-shared/utils';

type Currency = { amountMicros: number; currencyCode: string } | null;

export const computeTargetProbability = ({
  isCreate,
  stageBefore,
  stageAfter,
  probabilityBefore,
  currentProbability,
  stageDefaults,
}: {
  isCreate: boolean;
  stageBefore: string | null;
  stageAfter: string;
  probabilityBefore: number | null;
  currentProbability: number | null;
  stageDefaults: Record<string, number>;
}): number => {
  const afterDefault = stageDefaults[stageAfter] ?? 0;

  if (isCreate) {
    return currentProbability ?? afterDefault;
  }

  const stageChanged = stageBefore !== stageAfter;

  if (!stageChanged) {
    return currentProbability ?? afterDefault;
  }

  const beforeDefault = isDefined(stageBefore)
    ? (stageDefaults[stageBefore] ?? 0)
    : 0;
  const wasUntouched = probabilityBefore === beforeDefault;

  return wasUntouched ? afterDefault : (currentProbability ?? afterDefault);
};

export const computeWeightedAmount = (
  amount: Currency,
  probability: number | null,
): Currency => {
  if (!isDefined(amount) || !isDefined(probability)) {
    return null;
  }

  return {
    amountMicros: Math.round((amount.amountMicros * probability) / 100),
    currencyCode: amount.currencyCode,
  };
};

export const isSameWeightedAmount = (a: Currency, b: Currency): boolean => {
  if (!isDefined(a) || !isDefined(b)) {
    return a === b;
  }

  return a.amountMicros === b.amountMicros && a.currencyCode === b.currencyCode;
};

type ChangeShape = {
  stage?: string | null;
  probability?: number | null;
  amount?: Currency;
};

export const shouldRecomputeProbability = (
  before: ChangeShape | undefined,
  after: ChangeShape | undefined,
): boolean => {
  if (!isDefined(before) || !isDefined(after)) {
    return false;
  }

  return (
    before.stage !== after.stage ||
    before.probability !== after.probability ||
    !isSameWeightedAmount(before.amount ?? null, after.amount ?? null)
  );
};
