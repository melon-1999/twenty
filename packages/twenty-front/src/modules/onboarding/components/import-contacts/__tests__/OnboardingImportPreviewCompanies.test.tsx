import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { SOURCE_LOCALE } from 'twenty-shared/translations';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { allowRequestsToTwentyIconsState } from '@/client-config/states/allowRequestsToTwentyIcons';
import { OnboardingImportPreviewCompanies } from '@/onboarding/components/import-contacts/OnboardingImportPreviewCompanies';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

dynamicActivate(SOURCE_LOCALE);

const renderPreview = (allowRequestsToTwentyIcons: boolean) => {
  jotaiStore.set(
    allowRequestsToTwentyIconsState.atom,
    allowRequestsToTwentyIcons,
  );

  return render(
    <JotaiProvider store={jotaiStore}>
      <I18nProvider i18n={i18n}>
        <ThemeProvider colorScheme="light">
          <OnboardingImportPreviewCompanies />
        </ThemeProvider>
      </I18nProvider>
    </JotaiProvider>,
  );
};

describe('OnboardingImportPreviewCompanies', () => {
  it('does not reference twenty-icons when requests to it are not allowed', () => {
    const { container } = renderPreview(false);

    expect(container.innerHTML).not.toContain('twenty-icons.com');
  });

  it('shows company favicons when requests to twenty-icons are allowed', () => {
    const { container } = renderPreview(true);

    expect(container.innerHTML).toContain('twenty-icons.com/figma.com');
  });
});
