import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SOURCE_LOCALE } from 'twenty-shared/translations';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { GetWorkspaceInvitationsDocument } from '~/generated-metadata/graphql';
import { getJestMetadataAndApolloMocksWrapper } from '~/testing/jest/getJestMetadataAndApolloMocksWrapper';
import { SettingsWorkspaceMembersInviteTab } from '~/pages/settings/members/tabs/SettingsWorkspaceMembersInviteTab';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

// Irrelevant to the invite-by-link gating under test, and each pulls in its
// own GraphQL/form dependencies.
jest.mock('@/settings/roles/components/SettingsRolesQueryEffect', () => ({
  SettingsRolesQueryEffect: () => null,
}));

jest.mock('@/workspace/components/WorkspaceInviteTeam', () => ({
  WorkspaceInviteTeam: () => <div>workspace-invite-team</div>,
}));

jest.mock(
  '@/settings/security/components/approvedAccessDomains/SettingsApprovedAccessDomainsListCard',
  () => ({
    SettingsApprovedAccessDomainsListCard: () => (
      <div>approved-access-domains</div>
    ),
  }),
);

dynamicActivate(SOURCE_LOCALE);

const baseWorkspace = {
  id: '20202020-1c25-4d02-bf25-6aeccf7ea419',
  inviteHash: 'invite-hash-1234',
  isPublicInviteLinkEnabled: true,
};

const renderTab = (isMultiWorkspaceEnabled: boolean) => {
  const Wrapper = getJestMetadataAndApolloMocksWrapper({
    apolloMocks: [
      {
        request: { query: GetWorkspaceInvitationsDocument },
        result: { data: { findWorkspaceInvitations: [] } },
      },
    ],
  });

  jotaiStore.set(currentWorkspaceState.atom, baseWorkspace as never);
  jotaiStore.set(isMultiWorkspaceEnabledState.atom, isMultiWorkspaceEnabled);

  render(
    <MemoryRouter>
      <I18nProvider i18n={i18n}>
        <ThemeProvider colorScheme="light">
          <SettingsWorkspaceMembersInviteTab />
        </ThemeProvider>
      </I18nProvider>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
};

describe('SettingsWorkspaceMembersInviteTab', () => {
  it('hides "Invite by link" when multi-workspace is disabled, even with a stale isPublicInviteLinkEnabled=true', () => {
    renderTab(false);

    // The rest of the tab still renders, so this absence is meaningful.
    expect(screen.getByText('Invite by email')).toBeInTheDocument();
    expect(screen.queryByText('Invite by link')).not.toBeInTheDocument();
  });

  it('shows "Invite by link" when multi-workspace is enabled and the link is enabled', () => {
    renderTab(true);

    expect(screen.getByText('Invite by link')).toBeInTheDocument();
  });

  it('hides "Approved Domains" when multi-workspace is disabled', () => {
    renderTab(false);

    // The rest of the tab still renders, so this absence is meaningful.
    expect(screen.getByText('Invite by email')).toBeInTheDocument();
    expect(screen.queryByText('Approved Domains')).not.toBeInTheDocument();
    expect(
      screen.queryByText('approved-access-domains'),
    ).not.toBeInTheDocument();
  });

  it('shows "Approved Domains" when multi-workspace is enabled', () => {
    renderTab(true);

    expect(screen.getByText('Approved Domains')).toBeInTheDocument();
    expect(screen.getByText('approved-access-domains')).toBeInTheDocument();
  });
});
