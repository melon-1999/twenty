import { computeNextActivityAt } from '@/object-record/opportunity-next-action/utils/computeNextActivityAt';

const NOW = new Date('2026-09-01T12:00:00.000Z');
const at = (iso: string) => iso;

describe('computeNextActivityAt', () => {
  it('returns null when there are no tasks', () => {
    expect(computeNextActivityAt([], NOW)).toBeNull();
  });

  it('returns the earliest future open due date', () => {
    const tasks = [
      { dueAt: at('2026-09-10T00:00:00.000Z'), status: 'TODO' },
      { dueAt: at('2026-09-05T00:00:00.000Z'), status: 'IN_PROGRESS' },
      { dueAt: at('2026-09-20T00:00:00.000Z'), status: 'TODO' },
    ];
    expect(computeNextActivityAt(tasks, NOW)).toBe('2026-09-05T00:00:00.000Z');
  });

  it('ignores DONE tasks even if their due date is sooner', () => {
    const tasks = [
      { dueAt: at('2026-09-03T00:00:00.000Z'), status: 'DONE' },
      { dueAt: at('2026-09-08T00:00:00.000Z'), status: 'TODO' },
    ];
    expect(computeNextActivityAt(tasks, NOW)).toBe('2026-09-08T00:00:00.000Z');
  });

  it('ignores past-due tasks', () => {
    const tasks = [
      { dueAt: at('2026-08-01T00:00:00.000Z'), status: 'TODO' },
      { dueAt: at('2026-09-09T00:00:00.000Z'), status: 'TODO' },
    ];
    expect(computeNextActivityAt(tasks, NOW)).toBe('2026-09-09T00:00:00.000Z');
  });

  it('ignores open tasks with no due date', () => {
    const tasks = [
      { dueAt: null, status: 'TODO' },
      { dueAt: at('2026-09-07T00:00:00.000Z'), status: 'TODO' },
    ];
    expect(computeNextActivityAt(tasks, NOW)).toBe('2026-09-07T00:00:00.000Z');
  });

  it('returns null when every open task is past-due, done, or dateless', () => {
    const tasks = [
      { dueAt: at('2026-08-01T00:00:00.000Z'), status: 'TODO' },
      { dueAt: at('2026-09-30T00:00:00.000Z'), status: 'DONE' },
      { dueAt: null, status: 'IN_PROGRESS' },
    ];
    expect(computeNextActivityAt(tasks, NOW)).toBeNull();
  });
});
