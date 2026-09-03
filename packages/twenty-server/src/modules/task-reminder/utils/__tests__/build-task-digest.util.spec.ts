import {
  buildTaskDigest,
  type TaskDigestInput,
} from 'src/modules/task-reminder/utils/build-task-digest.util';

const now = new Date('2026-09-03T09:00:00.000Z');

describe('buildTaskDigest', () => {
  it('splits overdue (before today UTC) from today', () => {
    const tasks: TaskDigestInput[] = [
      { title: 'Alt', dueAt: new Date('2026-09-01T10:00:00Z'), linkedRecordName: 'Acme' },
      { title: 'Heute', dueAt: new Date('2026-09-03T15:00:00Z'), linkedRecordName: null },
    ];

    const result = buildTaskDigest(tasks, now);

    expect(result.overdue.map((t) => t.title)).toEqual(['Alt']);
    expect(result.today.map((t) => t.title)).toEqual(['Heute']);
    expect(result.overdue[0].linkedRecordName).toBe('Acme');
  });

  it('treats a due time earlier today as today, not overdue', () => {
    const result = buildTaskDigest(
      [{ title: 'Frueh', dueAt: new Date('2026-09-03T06:00:00Z'), linkedRecordName: null }],
      now,
    );

    expect(result.today).toHaveLength(1);
    expect(result.overdue).toHaveLength(0);
  });

  it('falls back to Ohne Titel for null/empty title', () => {
    const result = buildTaskDigest(
      [{ title: null, dueAt: new Date('2026-09-03T12:00:00Z'), linkedRecordName: null }],
      now,
    );

    expect(result.today[0].title).toBe('Ohne Titel');
  });

  it('returns empty groups for no tasks', () => {
    expect(buildTaskDigest([], now)).toEqual({ overdue: [], today: [] });
  });
});
