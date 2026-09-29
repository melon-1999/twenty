import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';

import { FooterNote } from '@/auth/sign-in-up/components/FooterNote';
import { useIsCurrentLocationOnAWorkspace } from '@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace';
import { useWorkspaceBypass } from '@/auth/sign-in-up/hooks/useWorkspaceBypass';

jest.mock('@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace', () => ({
  useIsCurrentLocationOnAWorkspace: jest.fn(),
}));

jest.mock('@/auth/sign-in-up/hooks/useWorkspaceBypass', () => ({
  useWorkspaceBypass: jest.fn(),
}));

// PRODUCT_BRANDING.legalTermsUrl/legalDpaUrl are '' in the real module while
// those documents don't exist yet - tests override them per case to cover
// both the empty and the eventually-filled-in state.
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

const mockNotOnAWorkspace = () => {
  jest.mocked(useIsCurrentLocationOnAWorkspace).mockReturnValue({
    isOnAWorkspace: false,
  } as never);
  jest.mocked(useWorkspaceBypass).mockReturnValue({
    shouldOfferBypass: false,
    shouldUseBypass: false,
    enableBypass: jest.fn(),
  });
};

const mockOnAWorkspace = () => {
  jest.mocked(useIsCurrentLocationOnAWorkspace).mockReturnValue({
    isOnAWorkspace: true,
  } as never);
  jest.mocked(useWorkspaceBypass).mockReturnValue({
    shouldOfferBypass: false,
    shouldUseBypass: false,
    enableBypass: jest.fn(),
  });
};

const renderFooterNote = (
  secondaryAgreement?: React.ComponentProps<
    typeof FooterNote
  >['secondaryAgreement'],
) =>
  render(
    <I18nProvider i18n={i18n}>
      <FooterNote secondaryAgreement={secondaryAgreement} />
    </I18nProvider>,
  );

describe('FooterNote', () => {
  beforeEach(() => {
    PRODUCT_BRANDING.legalTermsUrl = '';
    PRODUCT_BRANDING.legalPrivacyUrl = 'https://novicode.de/datenschutz';
    PRODUCT_BRANDING.legalDpaUrl = '';
  });

  describe('outside a workspace (sign-up sentence)', () => {
    it('omits the Terms of Service link and "and" when legalTermsUrl is empty', () => {
      mockNotOnAWorkspace();

      const { container } = renderFooterNote('privacyPolicy');

      expect(screen.queryByText('Terms of Service')).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Privacy Policy' }),
      ).toHaveAttribute('href', 'https://novicode.de/datenschutz');
      expect(container.textContent).not.toMatch(/\band\b/);
    });

    it('falls back to the Privacy Policy link when legalDpaUrl is empty (DPA mode)', () => {
      mockNotOnAWorkspace();

      renderFooterNote('dataProcessingAgreement');

      expect(screen.queryByText('Terms of Service')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Data Processing Agreement'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/applicable terms/)).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Privacy Policy' }),
      ).toHaveAttribute('href', 'https://novicode.de/datenschutz');
    });

    it('renders nothing when Terms, DPA and Privacy Policy are all empty', () => {
      PRODUCT_BRANDING.legalPrivacyUrl = '';
      mockNotOnAWorkspace();

      const { container } = renderFooterNote('dataProcessingAgreement');

      expect(container).toBeEmptyDOMElement();
    });

    it('renders both links joined by "and" once terms and the secondary agreement exist', () => {
      PRODUCT_BRANDING.legalTermsUrl = 'https://novicode.de/agb';
      mockNotOnAWorkspace();

      const { container } = renderFooterNote('privacyPolicy');

      expect(
        screen.getByRole('link', { name: 'Terms of Service' }),
      ).toHaveAttribute('href', 'https://novicode.de/agb');
      expect(
        screen.getByRole('link', { name: 'Privacy Policy' }),
      ).toHaveAttribute('href', 'https://novicode.de/datenschutz');
      expect(container.textContent).toMatch(/\band\b/);
    });
  });

  describe('inside a workspace (footer links)', () => {
    it('omits the Terms of Service link and its separator when legalTermsUrl is empty', () => {
      mockOnAWorkspace();

      renderFooterNote();

      expect(
        screen.queryByRole('link', { name: 'Terms of Service' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Privacy Policy' }),
      ).toBeInTheDocument();
      expect(screen.queryByText('•')).not.toBeInTheDocument();
    });

    it('renders both links separated by a bullet when both URLs exist', () => {
      PRODUCT_BRANDING.legalTermsUrl = 'https://novicode.de/agb';
      mockOnAWorkspace();

      renderFooterNote();

      expect(
        screen.getByRole('link', { name: 'Terms of Service' }),
      ).toHaveAttribute('href', 'https://novicode.de/agb');
      expect(
        screen.getByRole('link', { name: 'Privacy Policy' }),
      ).toHaveAttribute('href', 'https://novicode.de/datenschutz');
      expect(screen.getByText('•')).toBeInTheDocument();
    });
  });
});
