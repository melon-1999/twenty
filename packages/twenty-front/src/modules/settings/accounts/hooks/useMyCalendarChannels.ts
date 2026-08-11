import { type CalendarChannel } from '@/accounts/types/CalendarChannel';
import { GET_MY_CALENDAR_CHANNELS } from '@/settings/accounts/graphql/queries/getMyCalendarChannels';
import { useIsCapabilityEnabled } from '@/workspace/hooks/useIsCapabilityEnabled';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { ProductCapabilityKey } from '~/generated-metadata/graphql';

export const useMyCalendarChannels = () => {
  const apolloClient = useApolloClient();
  const isCalendarModuleEnabled = useIsCapabilityEnabled(
    ProductCapabilityKey.CALENDAR,
  );

  const { data, loading } = useQuery<{
    myCalendarChannels: CalendarChannel[];
  }>(GET_MY_CALENDAR_CHANNELS, {
    client: apolloClient,
    skip: !isCalendarModuleEnabled,
  });

  return {
    channels: data?.myCalendarChannels ?? [],
    loading,
  };
};
