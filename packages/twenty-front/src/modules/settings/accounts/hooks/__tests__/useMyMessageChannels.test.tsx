import { MockedProvider } from '@apollo/client/testing/react';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';

import { type MessageChannel } from '@/accounts/types/MessageChannel';
import { isEmailModuleEnabledState } from '@/client-config/states/isEmailModuleEnabledState';
import { GET_MY_MESSAGE_CHANNELS } from '@/settings/accounts/graphql/queries/getMyMessageChannels';
import { useMyMessageChannels } from '@/settings/accounts/hooks/useMyMessageChannels';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import {
  MessageChannelContactAutoCreationPolicy,
  MessageChannelSyncStage,
  MessageChannelSyncStatus,
  MessageChannelType,
  MessageFolderImportPolicy,
} from 'twenty-shared/types';
import { MessageChannelVisibility } from '~/generated/graphql';

const mockMessageChannel: MessageChannel = {
  id: 'message-channel-id',
  handle: 'jane@twenty.com',
  displayName: 'Jane',
  visibility: MessageChannelVisibility.SHARE_EVERYTHING,
  type: MessageChannelType.EMAIL,
  isContactAutoCreationEnabled: true,
  contactAutoCreationPolicy:
    MessageChannelContactAutoCreationPolicy.SENT_AND_RECEIVED,
  messageFolderImportPolicy: MessageFolderImportPolicy.ALL_FOLDERS,
  excludeNonProfessionalEmails: false,
  excludeGroupEmails: false,
  isSyncEnabled: true,
  syncStatus: MessageChannelSyncStatus.ACTIVE,
  syncStage: MessageChannelSyncStage.MESSAGES_IMPORT_ONGOING,
  syncStageStartedAt: null,
  connectedAccountId: 'connected-account-id',
  connectedAccount: {
    id: 'connected-account-id',
    handle: 'jane@twenty.com',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  __typename: 'MessageChannel',
};

const mocks = [
  {
    request: {
      query: GET_MY_MESSAGE_CHANNELS,
      variables: {},
    },
    result: jest.fn(() => ({
      data: {
        myMessageChannels: [mockMessageChannel],
      },
    })),
  },
];

const Wrapper = ({ children }: { children: ReactNode }) => (
  <JotaiProvider store={jotaiStore}>
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  </JotaiProvider>
);

describe('useMyMessageChannels', () => {
  beforeEach(() => {
    resetJotaiStore();
  });

  it('should not fire the query and return an empty list when the Email module is deploy-disabled', async () => {
    jotaiStore.set(isEmailModuleEnabledState.atom, false);

    const { result } = renderHook(() => useMyMessageChannels(), {
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

  it('should fire the query and return the message channels when the Email module is enabled', async () => {
    jotaiStore.set(isEmailModuleEnabledState.atom, true);

    const { result } = renderHook(() => useMyMessageChannels(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mocks[0].result).toHaveBeenCalled();
    expect(result.current.channels).toEqual([mockMessageChannel]);
  });
});
