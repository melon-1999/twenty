import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SOURCE_LOCALE } from 'twenty-shared/translations';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { allowRequestsToTwentyIconsState } from '@/client-config/states/allowRequestsToTwentyIcons';
import { RecordTableWidgetRelationPickerDropdownContent } from '@/object-record/record-table-widget/components/RecordTableWidgetRelationPickerDropdownContent';
import { DropdownComponentInstanceContext } from '@/ui/layout/dropdown/contexts/DropdownComponentInstanceContext';
import { getJestMetadataAndApolloMocksWrapper } from '~/testing/jest/getJestMetadataAndApolloMocksWrapper';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

dynamicActivate(SOURCE_LOCALE);

const company = {
  __typename: 'Company',
  id: '20202020-3ec3-4fe3-8997-b76aa0bfa408',
  name: 'Acme',
  domainName: {
    primaryLinkUrl: 'https://acme.com',
    primaryLinkLabel: '',
    secondaryLinks: [],
  },
};

jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: ({ skip }: { skip?: boolean }) => ({
    loading: false,
    records: skip === true ? [] : [company],
  }),
}));

const renderPicker = (allowRequestsToTwentyIcons: boolean) => {
  const MetadataWrapper = getJestMetadataAndApolloMocksWrapper({
    apolloMocks: [],
    onInitializeJotaiStore: (store) => {
      store.set(
        allowRequestsToTwentyIconsState.atom,
        allowRequestsToTwentyIcons,
      );
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MetadataWrapper>
      <I18nProvider i18n={i18n}>
        <ThemeProvider colorScheme="light">
          <DropdownComponentInstanceContext.Provider
            value={{ instanceId: 'relation-picker-dropdown' }}
          >
            {children}
          </DropdownComponentInstanceContext.Provider>
        </ThemeProvider>
      </I18nProvider>
    </MetadataWrapper>
  );

  return render(
    <RecordTableWidgetRelationPickerDropdownContent
      objectNameSingular="company"
      recordsFilter={{}}
      onRelationRecordSelected={jest.fn()}
    />,
    { wrapper: Wrapper },
  );
};

describe('RecordTableWidgetRelationPickerDropdownContent', () => {
  it('does not reference twenty-icons when requests to it are not allowed', async () => {
    const { container } = renderPicker(false);

    expect(await screen.findByText('Acme')).toBeInTheDocument();
    expect(container.innerHTML).not.toContain('twenty-icons.com');
  });

  it('shows company favicons when requests to twenty-icons are allowed', async () => {
    const { container } = renderPicker(true);

    expect(await screen.findByText('Acme')).toBeInTheDocument();
    expect(container.innerHTML).toContain('twenty-icons.com/acme.com');
  });
});
