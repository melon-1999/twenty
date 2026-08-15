import { computeOpportunityRotting } from '@/object-record/record-show/opportunity/utils/computeOpportunityRotting';

const now = new Date('2026-08-15T00:00:00.000Z');
const config = { NEW: 7, PROPOSAL: 21 };
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 86400000).toISOString();

describe('computeOpportunityRotting', () => {
  it('rots when open and past the stage threshold', () => {
    expect(
      computeOpportunityRotting({
        status: 'OPEN',
        stage: 'NEW',
        stageChangedAt: daysAgo(10),
        config,
        now,
      }),
    ).toEqual({ isRotting: true, daysInStage: 10 });
  });
  it('does not rot at exactly the threshold', () => {
    expect(
      computeOpportunityRotting({
        status: 'OPEN',
        stage: 'NEW',
        stageChangedAt: daysAgo(7),
        config,
        now,
      }),
    ).toEqual({ isRotting: false, daysInStage: 7 });
  });
  it('never rots when closed', () => {
    expect(
      computeOpportunityRotting({
        status: 'WON',
        stage: 'NEW',
        stageChangedAt: daysAgo(30),
        config,
        now,
      }).isRotting,
    ).toBe(false);
  });
  it('never rots when the stage has no threshold', () => {
    expect(
      computeOpportunityRotting({
        status: 'OPEN',
        stage: 'MEETING',
        stageChangedAt: daysAgo(99),
        config,
        now,
      }).isRotting,
    ).toBe(false);
  });
  it('returns null daysInStage when stageChangedAt is null', () => {
    expect(
      computeOpportunityRotting({
        status: 'OPEN',
        stage: 'NEW',
        stageChangedAt: null,
        config,
        now,
      }),
    ).toEqual({ isRotting: false, daysInStage: null });
  });
});
