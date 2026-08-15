import { shouldResetStageChangedAt } from 'src/modules/opportunity/listeners/opportunity-stage-changed.util';

describe('shouldResetStageChangedAt', () => {
  it('is true when stage changes', () => {
    expect(
      shouldResetStageChangedAt({ stage: 'NEW' }, { stage: 'MEETING' }),
    ).toBe(true);
  });

  it('is false when stage is unchanged', () => {
    expect(shouldResetStageChangedAt({ stage: 'NEW' }, { stage: 'NEW' })).toBe(
      false,
    );
  });

  it('is false when a non-stage field (e.g. stageChangedAt) changes', () => {
    expect(
      shouldResetStageChangedAt(
        { stage: 'NEW', stageChangedAt: '2024-01-01' } as {
          stage?: string | null;
        },
        { stage: 'NEW', stageChangedAt: '2024-02-02' } as {
          stage?: string | null;
        },
      ),
    ).toBe(false);
  });
});
