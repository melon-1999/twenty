import { isDefined } from 'twenty-shared/utils';

export type OpportunityForecastInput = {
  closeDate: string | null;
  amountMicros: number | null;
  probability: number | null;
};

export type OpportunityForecastBucket = {
  monthKey: string;
  year: number;
  month: number;
  hasDate: boolean;
  count: number;
  totalMicros: number;
  weightedMicros: number;
};

export type OpportunityForecastResult = {
  buckets: OpportunityForecastBucket[];
  totalCount: number;
  totalMicros: number;
  totalWeightedMicros: number;
};

const NO_DATE_KEY = 'no-date';

const weightedMicrosOf = (
  amountMicros: number | null,
  probability: number | null,
): number => {
  if (!isDefined(amountMicros) || !isDefined(probability)) {
    return 0;
  }

  return Math.round((amountMicros * probability) / 100);
};

export const computeOpportunityForecast = (
  rows: OpportunityForecastInput[],
): OpportunityForecastResult => {
  const bucketsByKey = new Map<string, OpportunityForecastBucket>();

  let totalCount = 0;
  let totalMicros = 0;
  let totalWeightedMicros = 0;

  for (const row of rows) {
    const amount = row.amountMicros ?? 0;
    const weighted = weightedMicrosOf(row.amountMicros, row.probability);

    totalCount += 1;
    totalMicros += amount;
    totalWeightedMicros += weighted;

    const hasDate = isDefined(row.closeDate);
    const date = hasDate ? new Date(row.closeDate as string) : null;
    const year = date?.getFullYear() ?? 0;
    const month = date?.getMonth() ?? 0;
    const monthKey = hasDate
      ? `${year}-${String(month + 1).padStart(2, '0')}`
      : NO_DATE_KEY;

    const existing = bucketsByKey.get(monthKey);

    if (isDefined(existing)) {
      existing.count += 1;
      existing.totalMicros += amount;
      existing.weightedMicros += weighted;
    } else {
      bucketsByKey.set(monthKey, {
        monthKey,
        year,
        month,
        hasDate,
        count: 1,
        totalMicros: amount,
        weightedMicros: weighted,
      });
    }
  }

  const buckets = [...bucketsByKey.values()].sort((a, b) => {
    if (a.monthKey === NO_DATE_KEY) return 1;
    if (b.monthKey === NO_DATE_KEY) return -1;

    return a.monthKey < b.monthKey ? -1 : a.monthKey > b.monthKey ? 1 : 0;
  });

  return { buckets, totalCount, totalMicros, totalWeightedMicros };
};
