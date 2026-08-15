import { statusPillVariantColor } from '../statusPillVariantColor';

describe('statusPillVariantColor', () => {
  it('maps each variant to its theme color', () => {
    expect(statusPillVariantColor('success')).toBe('green');
    expect(statusPillVariantColor('danger')).toBe('red');
    expect(statusPillVariantColor('warning')).toBe('orange');
    expect(statusPillVariantColor('info')).toBe('blue');
    expect(statusPillVariantColor('neutral')).toBe('gray');
  });
});
