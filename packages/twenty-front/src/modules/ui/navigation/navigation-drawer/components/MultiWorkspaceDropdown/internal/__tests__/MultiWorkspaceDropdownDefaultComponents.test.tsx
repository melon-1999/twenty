import { MockedProvider } from '@apollo/client/testing/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SOURCE_LOCALE } from 'twenty-shared/translations';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { availableWorkspacesState } from '@/auth/states/availableWorkspacesState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { MultiWorkspaceDropdownDefaultComponents } from '@/ui/navigation/navigation-drawer/components/MultiWorkspaceDropdown/internal/MultiWorkspaceDropdownDefaultComponents';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

// Render the nested context-menu content inline so its items are assertable
// without opening the dropdown.
jest.mock('@/ui/layout/dropdown/components/Dropdown', () => ({
  Dropdown: ({ dropdownComponents }: { dropdownComponents: ReactNode }) =>
    dropdownComponents,
}));

jest.mock('@/ui/layout/dropdown/hooks/useCloseDropdown', () => ({
  useCloseDropdown: () => ({ closeDropdown: jest.fn() }),
}));

jest.mock('@/auth/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: jest.fn() }),
}));

jest.mock('@/domain-manager/hooks/useBuildWorkspaceUrl', () => ({
  useBuildWorkspaceUrl: () => ({ buildWorkspaceUrl: jest.fn(() => '/') }),
}));

jest.mock('@/domain-manager/hooks/useRedirectToWorkspaceDomain', () => ({
  useRedirectToWorkspaceDomain: () => ({
    redirectToWorkspaceDomain: jest.fn(),
  }),
}));

jest.mock('@/domain-manager/hooks/useRedirectToDefaultDomain', () => ({
  useRedirectToDefaultDomain: () => ({ redirectToDefaultDomain: jest.fn() }),
}));

jest.mock('@/ui/theme/hooks/useColorScheme', () => ({
  useColorScheme: () => ({ colorScheme: 'Light', colorSchemeList: [] }),
}));

jest.mock('~/hooks/useNavigateSettings', () => ({
  useNavigateSettings: () => jest.fn(),
}));

dynamicActivate(SOURCE_LOCALE);

const currentWorkspace = {
  id: '20202020-1c25-4d02-bf25-6aeccf7ea419',
  displayName: 'Testfirma GmbH',
};

const availableWorkspaceForCurrent = {
  id: currentWorkspace.id,
  displayName: currentWorkspace.displayName,
  logo: null,
  inviteHash: null,
  loginToken: null,
  personalInviteToken: null,
  sso: [],
  workspaceUrls: {
    subdomainUrl: 'https://testfirma.example.com',
    customUrl: null,
  },
};

const renderDropdown = () => {
  render(
    <MemoryRouter>
      <MockedProvider mocks={[]}>
        <JotaiProvider store={jotaiStore}>
          <ThemeProvider colorScheme="light">
            <I18nProvider i18n={i18n}>
              <MultiWorkspaceDropdownDefaultComponents />
            </I18nProvider>
          </ThemeProvider>
        </JotaiProvider>
      </MockedProvider>
    </MemoryRouter>,
  );
};

describe('MultiWorkspaceDropdownDefaultComponents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetJotaiStore();
    jotaiStore.set(currentWorkspaceState.atom, currentWorkspace as never);
    jotaiStore.set(availableWorkspacesState.atom, {
      availableWorkspacesForSignIn: [availableWorkspaceForCurrent],
      availableWorkspacesForSignUp: [],
    });
  });

  it('hides "Create Workspace" when multi-workspace is disabled', () => {
    jotaiStore.set(isMultiWorkspaceEnabledState.atom, false);

    renderDropdown();

    expect(screen.getByText('Log out')).toBeInTheDocument();
    expect(screen.queryByText('Create Workspace')).not.toBeInTheDocument();
  });

  it('shows "Create Workspace" when multi-workspace is enabled', () => {
    jotaiStore.set(isMultiWorkspaceEnabledState.atom, true);

    renderDropdown();

    expect(screen.getByText('Create Workspace')).toBeInTheDocument();
  });

  it('shows no workspace switcher with a single available workspace', () => {
    jotaiStore.set(isMultiWorkspaceEnabledState.atom, false);

    renderDropdown();

    // The rest of the menu renders, so the absences below are meaningful.
    expect(screen.getByText('Invite user')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.queryByText('Other workspaces')).not.toBeInTheDocument();
    expect(screen.queryByText('(No name)')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /testfirma/i }),
    ).not.toBeInTheDocument();
  });
});
