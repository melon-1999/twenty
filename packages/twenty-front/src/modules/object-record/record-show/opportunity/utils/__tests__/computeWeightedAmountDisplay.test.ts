import { computeWeightedAmountDisplay } from '@/object-record/record-show/opportunity/utils/computeWeightedAmountDisplay';

describe('computeWeightedAmountDisplay', () => {
  it('is null when amount is missing', () => {
    expect(
      computeWeightedAmountDisplay({ amount: null, probability: 80 }),
    ).toBeNull();
  });

  it('is null when probability is missing', () => {
    expect(
      computeWeightedAmountDisplay({
        amount: { amountMicros: 10_000_000, currencyCode: 'EUR' },
        probability: null,
      }),
    ).toBeNull();
  });

  it('returns weighted micros + probability', () => {
    expect(
      computeWeightedAmountDisplay({
        amount: { amountMicros: 10_000_000, currencyCode: 'EUR' },
        probability: 80,
      }),
    ).toEqual({
      amountMicros: 8_000_000,
      currencyCode: 'EUR',
      probability: 80,
    });
  });
});
