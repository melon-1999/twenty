import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { SOURCE_LOCALE } from 'twenty-shared/translations';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { authProvidersState } from '@/client-config/states/authProvidersState';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { SettingsSecurityAuthProvidersOptionsList } from '@/settings/security/components/SettingsSecurityAuthProvidersOptionsList';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { getJestMetadataAndApolloMocksWrapper } from '~/testing/jest/getJestMetadataAndApolloMocksWrapper';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

dynamicActivate(SOURCE_LOCALE);

const currentWorkspace = {
  id: '20202020-1c25-4d02-bf25-6aeccf7ea419',
  isGoogleAuthEnabled: false,
  isMicrosoftAuthEnabled: false,
  isPasswordAuthEnabled: true,
  isPublicInviteLinkEnabled: false,
  isTwoFactorAuthenticationEnforced: false,
  workspaceDiscoverability: 'HIDDEN',
};

const renderComponent = (isMultiWorkspaceEnabled: boolean) => {
  const Wrapper = getJestMetadataAndApolloMocksWrapper({ apolloMocks: [] });

  jotaiStore.set(currentWorkspaceState.atom, currentWorkspace as never);
  jotaiStore.set(authProvidersState.atom, {
    google: false,
    magicLink: false,
    password: true,
    microsoft: false,
    sso: [],
  });
  jotaiStore.set(isMultiWorkspaceEnabledState.atom, isMultiWorkspaceEnabled);

  render(
    <I18nProvider i18n={i18n}>
      <SettingsSecurityAuthProvidersOptionsList />
    </I18nProvider>,
    { wrapper: Wrapper },
  );
};

describe('SettingsSecurityAuthProvidersOptionsList', () => {
  it('hides "Invite by Link" when multi-workspace is disabled', () => {
    renderComponent(false);

    // The rest of the card still renders, so this absence is meaningful.
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Two Factor Authentication')).toBeInTheDocument();
    expect(screen.queryByText('Invite by Link')).not.toBeInTheDocument();
  });

  it('shows "Invite by Link" when multi-workspace is enabled', () => {
    renderComponent(true);

    expect(screen.getByText('Invite by Link')).toBeInTheDocument();
  });
});
