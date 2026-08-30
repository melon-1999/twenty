import { reconcileStageHistory } from '../opportunity-stage-history.util';

describe('reconcileStageHistory', () => {
  const ENTERED_AT = '2026-08-30T10:00:00.000Z';

  it('seeds a single entry when history is null', () => {
    expect(reconcileStageHistory('NEW', null, ENTERED_AT)).toEqual([
      { stage: 'NEW', enteredAt: ENTERED_AT },
    ]);
  });

  it('seeds a single entry when history is empty', () => {
    expect(reconcileStageHistory('NEW', [], ENTERED_AT)).toEqual([
      { stage: 'NEW', enteredAt: ENTERED_AT },
    ]);
  });

  it('appends when the current stage differs from the last entry', () => {
    const history = [{ stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' }];
    expect(reconcileStageHistory('SCREENING', history, ENTERED_AT)).toEqual([
      { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
      { stage: 'SCREENING', enteredAt: ENTERED_AT },
    ]);
  });

  it('returns null when the current stage already equals the last entry', () => {
    const history = [
      { stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' },
      { stage: 'SCREENING', enteredAt: '2026-08-10T00:00:00.000Z' },
    ];
    expect(reconcileStageHistory('SCREENING', history, ENTERED_AT)).toBeNull();
  });

  it('does not mutate the input history array', () => {
    const history = [{ stage: 'NEW', enteredAt: '2026-08-01T00:00:00.000Z' }];
    reconcileStageHistory('SCREENING', history, ENTERED_AT);
    expect(history).toHaveLength(1);
  });
});
