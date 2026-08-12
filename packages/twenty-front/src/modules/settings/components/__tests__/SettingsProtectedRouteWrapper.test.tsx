import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { ProductCapabilityKey } from '~/generated-metadata/graphql';

import { isCookieAuthActiveState } from '@/auth/states/isCookieAuthActiveState';
import { SettingsProtectedRouteWrapper } from '@/settings/components/SettingsProtectedRouteWrapper';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import { isAiAssistantModuleEnabledState } from '@/client-config/states/isAiAssistantModuleEnabledState';
import { isCalendarModuleEnabledState } from '@/client-config/states/isCalendarModuleEnabledState';
import { isEmailModuleEnabledState } from '@/client-config/states/isEmailModuleEnabledState';

const renderRoutes = () =>
  render(
    <JotaiProvider store={jotaiStore}>
      <MemoryRouter
        initialEntries={[getSettingsPath(SettingsPath.AccountsEmails)]}
      >
        <Routes>
          <Route
            path={getSettingsPath(SettingsPath.ProfilePage)}
            element={<div>Profile Page</div>}
          />
          <Route
            element={
              <SettingsProtectedRouteWrapper
                requiredCapability={ProductCapabilityKey.EMAIL}
              />
            }
          >
            <Route
              path={getSettingsPath(SettingsPath.AccountsEmails)}
              element={<div>Emails Settings Content</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </JotaiProvider>,
  );

const renderCalendarRoutes = () =>
  render(
    <JotaiProvider store={jotaiStore}>
      <MemoryRouter
        initialEntries={[getSettingsPath(SettingsPath.AccountsCalendars)]}
      >
        <Routes>
          <Route
            path={getSettingsPath(SettingsPath.ProfilePage)}
            element={<div>Profile Page</div>}
          />
          <Route
            element={
              <SettingsProtectedRouteWrapper
                requiredCapability={ProductCapabilityKey.CALENDAR}
              />
            }
          >
            <Route
              path={getSettingsPath(SettingsPath.AccountsCalendars)}
              element={<div>Calendars Settings Content</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </JotaiProvider>,
  );

const renderAiRoutes = () =>
  render(
    <JotaiProvider store={jotaiStore}>
      <MemoryRouter initialEntries={[getSettingsPath(SettingsPath.AI)]}>
        <Routes>
          <Route
            path={getSettingsPath(SettingsPath.ProfilePage)}
            element={<div>Profile Page</div>}
          />
          <Route
            element={
              <SettingsProtectedRouteWrapper
                requiredCapability={ProductCapabilityKey.AI_ASSISTANT}
              />
            }
          >
            <Route
              path={getSettingsPath(SettingsPath.AI)}
              element={<div>AI Settings Content</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </JotaiProvider>,
  );

describe('SettingsProtectedRouteWrapper', () => {
  beforeEach(() => {
    resetJotaiStore();
    jotaiStore.set(isCookieAuthActiveState.atom, true);
  });

  it('redirects away and does not render children when the required capability is disabled', () => {
    jotaiStore.set(isEmailModuleEnabledState.atom, false);

    renderRoutes();

    expect(screen.getByText('Profile Page')).toBeInTheDocument();
    expect(
      screen.queryByText('Emails Settings Content'),
    ).not.toBeInTheDocument();
  });

  it('renders children when the required capability is enabled', () => {
    jotaiStore.set(isEmailModuleEnabledState.atom, true);

    renderRoutes();

    expect(screen.getByText('Emails Settings Content')).toBeInTheDocument();
    expect(screen.queryByText('Profile Page')).not.toBeInTheDocument();
  });

  it('redirects away and does not render children when the required calendar capability is disabled', () => {
    jotaiStore.set(isCalendarModuleEnabledState.atom, false);

    renderCalendarRoutes();

    expect(screen.getByText('Profile Page')).toBeInTheDocument();
    expect(
      screen.queryByText('Calendars Settings Content'),
    ).not.toBeInTheDocument();
  });

  it('renders children when the required calendar capability is enabled', () => {
    jotaiStore.set(isCalendarModuleEnabledState.atom, true);

    renderCalendarRoutes();

    expect(screen.getByText('Calendars Settings Content')).toBeInTheDocument();
    expect(screen.queryByText('Profile Page')).not.toBeInTheDocument();
  });

  it('redirects away and does not render children when the required AI assistant capability is disabled', () => {
    jotaiStore.set(isAiAssistantModuleEnabledState.atom, false);

    renderAiRoutes();

    expect(screen.getByText('Profile Page')).toBeInTheDocument();
    expect(screen.queryByText('AI Settings Content')).not.toBeInTheDocument();
  });

  it('renders children when the required AI assistant capability is enabled', () => {
    jotaiStore.set(isAiAssistantModuleEnabledState.atom, true);

    renderAiRoutes();

    expect(screen.getByText('AI Settings Content')).toBeInTheDocument();
    expect(screen.queryByText('Profile Page')).not.toBeInTheDocument();
  });
});
