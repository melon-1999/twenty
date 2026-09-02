type WonDealInput = { amountMicros: number | null; closedAt: string | null };

export type GoalMonthBucket = {
  year: number;
  month: number; // 1-12
  achievedMicros: number;
};

export type MonthlyGoalProgressResult = {
  current: {
    achievedMicros: number;
    targetMicros: number | null;
    ratio: number | null;
  };
  history: GoalMonthBucket[];
};

const monthKey = (year: number, month: number) => `${year}-${month}`;

export const computeMonthlyGoalProgress = (
  wonDeals: WonDealInput[],
  targetMicros: number | null,
  now: Date,
  monthsBack: number = 6,
): MonthlyGoalProgressResult => {
  const sumByMonth = new Map<string, number>();

  for (const deal of wonDeals) {
    if (deal.closedAt === null || deal.amountMicros === null) {
      continue;
    }
    const closed = new Date(deal.closedAt);
    const key = monthKey(closed.getFullYear(), closed.getMonth() + 1);
    sumByMonth.set(key, (sumByMonth.get(key) ?? 0) + deal.amountMicros);
  }

  const currentAchieved =
    sumByMonth.get(monthKey(now.getFullYear(), now.getMonth() + 1)) ?? 0;

  const ratio =
    targetMicros !== null && targetMicros > 0
      ? currentAchieved / targetMicros
      : null;

  const history: GoalMonthBucket[] = [];
  for (let offset = monthsBack - 1; offset >= 0; offset--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;
    history.push({
      year,
      month,
      achievedMicros: sumByMonth.get(monthKey(year, month)) ?? 0,
    });
  }

  return {
    current: { achievedMicros: currentAchieved, targetMicros, ratio },
    history,
  };
};
