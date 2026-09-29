import { render } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { allowRequestsToTwentyIconsState } from '@/client-config/states/allowRequestsToTwentyIcons';
import { BackgroundMockTableRow } from '@/sign-in-background-mock/components/BackgroundMockTableRow';
import { type BackgroundMockCompany } from '@/sign-in-background-mock/constants/BackgroundMockCompanies';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';

const company: BackgroundMockCompany = {
  id: 'acme',
  name: 'Acme',
  domainName: 'acme.com',
  createdBy: null,
  accountOwner: null,
  creationDate: 'about 13 hours ago',
  employees: 42,
  address: 'Berlin',
};

const renderRow = (allowRequestsToTwentyIcons: boolean) => {
  jotaiStore.set(
    allowRequestsToTwentyIconsState.atom,
    allowRequestsToTwentyIcons,
  );

  return render(
    <JotaiProvider store={jotaiStore}>
      <ThemeProvider colorScheme="light">
        <BackgroundMockTableRow company={company} />
      </ThemeProvider>
    </JotaiProvider>,
  );
};

describe('BackgroundMockTableRow', () => {
  it('does not reference twenty-icons when requests to it are not allowed', () => {
    const { container } = renderRow(false);

    expect(container.innerHTML).not.toContain('twenty-icons.com');
  });

  it('shows the company favicon when requests to twenty-icons are allowed', () => {
    const { container } = renderRow(true);

    expect(container.innerHTML).toContain('twenty-icons.com/acme.com');
  });
});
