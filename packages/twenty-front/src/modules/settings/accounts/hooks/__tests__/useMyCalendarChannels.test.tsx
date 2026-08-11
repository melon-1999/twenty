import { MockedProvider } from '@apollo/client/testing/react';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';

import { type CalendarChannel } from '@/accounts/types/CalendarChannel';
import { isCalendarModuleEnabledState } from '@/client-config/states/isCalendarModuleEnabledState';
import { GET_MY_CALENDAR_CHANNELS } from '@/settings/accounts/graphql/queries/getMyCalendarChannels';
import { useMyCalendarChannels } from '@/settings/accounts/hooks/useMyCalendarChannels';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import {
  CalendarChannelContactAutoCreationPolicy,
  CalendarChannelSyncStage,
  CalendarChannelSyncStatus,
} from 'twenty-shared/types';
import { CalendarChannelVisibility } from '~/generated/graphql';

const mockCalendarChannel: CalendarChannel = {
  id: 'calendar-channel-id',
  handle: 'jane@twenty.com',
  visibility: CalendarChannelVisibility.SHARE_EVERYTHING,
  isContactAutoCreationEnabled: true,
  contactAutoCreationPolicy:
    CalendarChannelContactAutoCreationPolicy.AS_PARTICIPANT_AND_ORGANIZER,
  isSyncEnabled: true,
  syncStatus: CalendarChannelSyncStatus.ACTIVE,
  syncStage: CalendarChannelSyncStage.CALENDAR_EVENTS_IMPORT_ONGOING,
  syncStageStartedAt: null,
  connectedAccountId: 'connected-account-id',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  __typename: 'CalendarChannel',
};

const mocks = [
  {
    request: {
      query: GET_MY_CALENDAR_CHANNELS,
      variables: {},
    },
    result: jest.fn(() => ({
      data: {
        myCalendarChannels: [mockCalendarChannel],
      },
    })),
  },
];

const Wrapper = ({ children }: { children: ReactNode }) => (
  <JotaiProvider store={jotaiStore}>
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  </JotaiProvider>
);

describe('useMyCalendarChannels', () => {
  beforeEach(() => {
    resetJotaiStore();
  });

  it('should not fire the query and return an empty list when the Calendar module is deploy-disabled', async () => {
    jotaiStore.set(isCalendarModuleEnabledState.atom, false);

    const { result } = renderHook(() => useMyCalendarChannels(), {
      wrapper: Wrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.channels).toEqual([]);

    // Give the query loop a chance to run; the mock resolver must stay untouched.
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mocks[0].result).not.toHaveBeenCalled();
    expect(result.current.channels).toEqual([]);
  });

  it('should fire the query and return the calendar channels when the Calendar module is enabled', async () => {
    jotaiStore.set(isCalendarModuleEnabledState.atom, true);

    const { result } = renderHook(() => useMyCalendarChannels(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mocks[0].result).toHaveBeenCalled();
    expect(result.current.channels).toEqual([mockCalendarChannel]);
  });
});
