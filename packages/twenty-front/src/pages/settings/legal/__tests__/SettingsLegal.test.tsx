import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';

import { SettingsLegal } from '~/pages/settings/legal/SettingsLegal';

jest.mock('@/settings/components/layout/SettingsPageLayout', () => ({
  SettingsPageLayout: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('@/settings/components/SettingsPageContainer', () => ({
  SettingsPageContainer: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

// legalTermsUrl is '' until a Terms document exists - tests override it per
// case to cover both the empty and the eventually-filled-in state.
jest.mock('twenty-shared/constants', () => {
  const actual = jest.requireActual('twenty-shared/constants');
  return {
    ...actual,
    PRODUCT_BRANDING: { ...actual.PRODUCT_BRANDING },
  };
});

const { PRODUCT_BRANDING } = jest.requireMock('twenty-shared/constants') as {
  PRODUCT_BRANDING: Record<string, string>;
};

const renderSettingsLegal = () =>
  render(
    <I18nProvider i18n={i18n}>
      <SettingsLegal />
    </I18nProvider>,
  );

describe('SettingsLegal', () => {
  beforeEach(() => {
    PRODUCT_BRANDING.legalTermsUrl = '';
    PRODUCT_BRANDING.legalPrivacyUrl = 'https://novicode.de/datenschutz';
  });

  it('hides the Terms of Service card when legalTermsUrl is empty', () => {
    renderSettingsLegal();

    expect(screen.queryByText('Terms of Service')).not.toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('shows the Terms of Service card once legalTermsUrl is set', () => {
    PRODUCT_BRANDING.legalTermsUrl = 'https://novicode.de/agb';

    renderSettingsLegal();

    expect(screen.getByText('Terms of Service').closest('a')).toHaveAttribute(
      'href',
      'https://novicode.de/agb',
    );
  });
});
