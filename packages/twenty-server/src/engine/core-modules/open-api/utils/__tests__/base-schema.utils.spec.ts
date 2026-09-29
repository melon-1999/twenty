// legalTermsUrl is '' until a Terms document exists - tests override it per
// case to cover both the empty and the eventually-filled-in state.
jest.mock('twenty-shared/constants', () => {
  const actual = jest.requireActual('twenty-shared/constants');
  return {
    ...actual,
    PRODUCT_BRANDING: { ...actual.PRODUCT_BRANDING },
  };
});

import { baseSchema } from 'src/engine/core-modules/open-api/utils/base-schema.utils';

const { PRODUCT_BRANDING } = jest.requireMock('twenty-shared/constants') as {
  PRODUCT_BRANDING: Record<string, string>;
};

describe('baseSchema', () => {
  beforeEach(() => {
    PRODUCT_BRANDING.legalTermsUrl = '';
  });

  it('omits termsOfService when legalTermsUrl is empty', () => {
    const schema = baseSchema('core', 'https://mycompany.twenty.com');

    expect(schema.info.termsOfService).toBeUndefined();
    expect(schema.info).not.toHaveProperty('termsOfService');
  });

  it('includes termsOfService once legalTermsUrl is set', () => {
    PRODUCT_BRANDING.legalTermsUrl = 'https://novicode.de/agb';

    const schema = baseSchema('core', 'https://mycompany.twenty.com');

    expect(schema.info.termsOfService).toBe('https://novicode.de/agb');
  });
});
