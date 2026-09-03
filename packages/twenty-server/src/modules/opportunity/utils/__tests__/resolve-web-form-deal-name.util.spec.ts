import { resolveWebFormDealName } from 'src/modules/opportunity/utils/resolve-web-form-deal-name.util';

describe('resolveWebFormDealName', () => {
  const fields = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.io' };

  it('substitutes all placeholders', () => {
    expect(
      resolveWebFormDealName('Web-Lead: {firstName} {lastName}', fields),
    ).toBe('Web-Lead: Ada Lovelace');
  });

  it('substitutes email', () => {
    expect(resolveWebFormDealName('Lead {email}', fields)).toBe(
      'Lead ada@x.io',
    );
  });

  it('leaves unknown placeholders untouched', () => {
    expect(resolveWebFormDealName('X {company}', fields)).toBe('X {company}');
  });

  it('trims and falls back to Web-Lead when the result is empty', () => {
    expect(
      resolveWebFormDealName('{firstName}{lastName}', {
        firstName: '',
        lastName: '',
        email: 'a@b.c',
      }),
    ).toBe('Web-Lead');
    expect(resolveWebFormDealName('   ', fields)).toBe('Web-Lead');
  });
});
