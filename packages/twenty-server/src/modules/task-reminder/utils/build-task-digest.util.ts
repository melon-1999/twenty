import { isNonEmptyString } from '@sniptt/guards';

export type TaskDigestInput = {
  title: string | null;
  dueAt: Date;
  linkedRecordName: string | null;
};

export type TaskDigestItem = {
  title: string;
  dueAt: Date;
  linkedRecordName: string | null;
};

export const buildTaskDigest = (
  tasks: TaskDigestInput[],
  now: Date,
): { overdue: TaskDigestItem[]; today: TaskDigestItem[] } => {
  const startOfTodayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  const overdue: TaskDigestItem[] = [];
  const today: TaskDigestItem[] = [];

  for (const task of tasks) {
    const item: TaskDigestItem = {
      title: isNonEmptyString(task.title) ? task.title : 'Ohne Titel',
      dueAt: task.dueAt,
      linkedRecordName: task.linkedRecordName,
    };

    if (task.dueAt.getTime() < startOfTodayUtc) {
      overdue.push(item);
    } else {
      today.push(item);
    }
  }

  return { overdue, today };
};
