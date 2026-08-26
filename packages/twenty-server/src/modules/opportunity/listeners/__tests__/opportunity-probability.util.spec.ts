import {
  computeTargetProbability,
  computeWeightedAmount,
  shouldRecomputeProbability,
} from 'src/modules/opportunity/listeners/opportunity-probability.util';

const defaults = {
  NEW: 20,
  SCREENING: 40,
  MEETING: 60,
  PROPOSAL: 80,
  CUSTOMER: 100,
};

describe('computeTargetProbability', () => {
  it('seeds the stage default on create', () => {
    expect(
      computeTargetProbability({
        isCreate: true,
        stageBefore: null,
        stageAfter: 'MEETING',
        probabilityBefore: null,
        stageDefaults: defaults,
      }),
    ).toBe(60);
  });
  it('resets to the new stage default when the old value was the untouched old default', () => {
    expect(
      computeTargetProbability({
        isCreate: false,
        stageBefore: 'NEW',
        stageAfter: 'PROPOSAL',
        probabilityBefore: 20,
        stageDefaults: defaults,
      }),
    ).toBe(80);
  });
  it('keeps a manual override across a stage move', () => {
    expect(
      computeTargetProbability({
        isCreate: false,
        stageBefore: 'NEW',
        stageAfter: 'PROPOSAL',
        probabilityBefore: 55,
        stageDefaults: defaults,
      }),
    ).toBe(55);
  });
  it('keeps the current value when the stage did not change', () => {
    expect(
      computeTargetProbability({
        isCreate: false,
        stageBefore: 'MEETING',
        stageAfter: 'MEETING',
        probabilityBefore: 33,
        stageDefaults: defaults,
      }),
    ).toBe(33);
  });
});

describe('computeWeightedAmount', () => {
  it('is null when amount is null', () => {
    expect(computeWeightedAmount(null, 80)).toBeNull();
  });
  it('is null when probability is null', () => {
    expect(
      computeWeightedAmount({ amountMicros: 1_000_000, currencyCode: 'EUR' }, null),
    ).toBeNull();
  });
  it('multiplies micros by probability/100 and keeps the currency', () => {
    expect(
      computeWeightedAmount(
        { amountMicros: 10_000_000, currencyCode: 'EUR' },
        80,
      ),
    ).toEqual({ amountMicros: 8_000_000, currencyCode: 'EUR' });
  });
});

describe('shouldRecomputeProbability', () => {
  const base = {
    stage: 'NEW',
    probability: 20,
    amount: { amountMicros: 1_000_000, currencyCode: 'EUR' },
  };
  it('is false when nothing relevant changed', () => {
    expect(shouldRecomputeProbability(base, { ...base })).toBe(false);
  });
  it('is true when stage changed', () => {
    expect(
      shouldRecomputeProbability(base, { ...base, stage: 'MEETING' }),
    ).toBe(true);
  });
  it('is true when probability changed', () => {
    expect(
      shouldRecomputeProbability(base, { ...base, probability: 55 }),
    ).toBe(true);
  });
  it('is true when amount changed', () => {
    expect(
      shouldRecomputeProbability(base, {
        ...base,
        amount: { amountMicros: 2_000_000, currencyCode: 'EUR' },
      }),
    ).toBe(true);
  });
});
