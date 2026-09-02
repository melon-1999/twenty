import { computeMissingNextAction } from '@/object-record/opportunity-next-action/utils/computeMissingNextAction';

const NOW = new Date('2026-09-01T12:00:00.000Z');

const opp = (id: string): { id: string; name: string | null; stage: string | null; amountMicros: number | null } => ({
  id,
  name: `Deal ${id}`,
  stage: 'NEW',
  amountMicros: 1000000,
});

describe('computeMissingNextAction', () => {
  it('excludes an opportunity that has an upcoming open task', () => {
    const result = computeMissingNextAction(
      [opp('a'), opp('b')],
      [
        { targetOpportunityId: 'a', dueAt: '2026-09-10T00:00:00.000Z', status: 'TODO' },
      ],
      NOW,
    );
    expect(result.opportunities.map((o) => o.id)).toEqual(['b']);
    expect(result.totalMissing).toBe(1);
  });

  it('includes an opportunity whose only task is DONE, past-due, or dateless', () => {
    const result = computeMissingNextAction(
      [opp('a'), opp('b'), opp('c')],
      [
        { targetOpportunityId: 'a', dueAt: '2026-09-10T00:00:00.000Z', status: 'DONE' },
        { targetOpportunityId: 'b', dueAt: '2026-08-01T00:00:00.000Z', status: 'TODO' },
        { targetOpportunityId: 'c', dueAt: null, status: 'TODO' },
      ],
      NOW,
    );
    expect(result.opportunities.map((o) => o.id)).toEqual(['a', 'b', 'c']);
  });

  it('includes an opportunity with no task targets at all', () => {
    const result = computeMissingNextAction([opp('a')], [], NOW);
    expect(result.opportunities.map((o) => o.id)).toEqual(['a']);
  });

  it('ignores task targets whose targetOpportunityId is null', () => {
    const result = computeMissingNextAction(
      [opp('a')],
      [{ targetOpportunityId: null, dueAt: '2026-09-10T00:00:00.000Z', status: 'TODO' }],
      NOW,
    );
    expect(result.opportunities.map((o) => o.id)).toEqual(['a']);
  });

  it('preserves input order of opportunities', () => {
    const result = computeMissingNextAction([opp('x'), opp('y'), opp('z')], [], NOW);
    expect(result.opportunities.map((o) => o.id)).toEqual(['x', 'y', 'z']);
  });
});
