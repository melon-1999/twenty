import { type MessageChannel } from '@/accounts/types/MessageChannel';
import { GET_MY_MESSAGE_CHANNELS } from '@/settings/accounts/graphql/queries/getMyMessageChannels';
import { useIsCapabilityEnabled } from '@/workspace/hooks/useIsCapabilityEnabled';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { ProductCapabilityKey } from '~/generated-metadata/graphql';

export const useMyMessageChannels = () => {
  const apolloClient = useApolloClient();
  const isEmailModuleEnabled = useIsCapabilityEnabled(
    ProductCapabilityKey.EMAIL,
  );

  const { data, loading } = useQuery<{
    myMessageChannels: MessageChannel[];
  }>(GET_MY_MESSAGE_CHANNELS, {
    client: apolloClient,
    skip: !isEmailModuleEnabled,
  });

  return {
    channels: data?.myMessageChannels ?? [],
    loading,
  };
};
