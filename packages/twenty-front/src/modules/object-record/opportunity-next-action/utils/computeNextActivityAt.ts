export type ActivityTaskInput = { dueAt: string | null; status: string | null };

export const computeNextActivityAt = (
  tasks: ActivityTaskInput[],
  now: Date,
): string | null => {
  const nowMs = now.getTime();

  const upcoming = tasks
    .filter((task) => task.status !== 'DONE' && task.dueAt !== null)
    .map((task) => task.dueAt as string)
    .filter((dueAt) => new Date(dueAt).getTime() >= nowMs);

  if (upcoming.length === 0) {
    return null;
  }

  return upcoming.reduce((earliest, dueAt) =>
    new Date(dueAt).getTime() < new Date(earliest).getTime() ? dueAt : earliest,
  );
};
