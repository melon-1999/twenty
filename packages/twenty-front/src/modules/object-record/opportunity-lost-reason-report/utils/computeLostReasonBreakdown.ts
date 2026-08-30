import { isDefined } from 'twenty-shared/utils';

export type LostReasonInput = {
  lostReason: string | null;
  amountMicros: number | null;
};

export type LostReasonBucket = {
  reason: string;
  hasReason: boolean;
  count: number;
  totalMicros: number;
};

export type LostReasonBreakdownResult = {
  buckets: LostReasonBucket[];
  totalCount: number;
  totalMicros: number;
};

const NO_REASON_KEY = 'no-reason';

export const computeLostReasonBreakdown = (
  rows: LostReasonInput[],
): LostReasonBreakdownResult => {
  const bucketsByReason = new Map<string, LostReasonBucket>();

  let totalCount = 0;
  let totalMicros = 0;

  for (const row of rows) {
    const amount = row.amountMicros ?? 0;
    const hasReason = isDefined(row.lostReason) && row.lostReason !== '';
    const reason = hasReason ? (row.lostReason as string) : NO_REASON_KEY;

    totalCount += 1;
    totalMicros += amount;

    const existing = bucketsByReason.get(reason);

    if (isDefined(existing)) {
      existing.count += 1;
      existing.totalMicros += amount;
    } else {
      bucketsByReason.set(reason, {
        reason,
        hasReason,
        count: 1,
        totalMicros: amount,
      });
    }
  }

  const buckets = [...bucketsByReason.values()].sort((a, b) => {
    if (a.reason === NO_REASON_KEY) return 1;
    if (b.reason === NO_REASON_KEY) return -1;

    return b.totalMicros - a.totalMicros;
  });

  return { buckets, totalCount, totalMicros };
};
