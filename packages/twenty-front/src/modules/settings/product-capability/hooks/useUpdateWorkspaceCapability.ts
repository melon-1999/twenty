import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { type ErrorLike } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import {
  type ProductCapabilityKey,
  UpdateWorkspaceCapabilityDocument,
} from '~/generated-metadata/graphql';
import { getErrorMessageFromApolloError } from '~/utils/get-error-message-from-apollo-error.util';

export const useUpdateWorkspaceCapability = () => {
  const [currentWorkspace, setCurrentWorkspace] = useAtomState(
    currentWorkspaceState,
  );
  const { enqueueErrorSnackBar } = useSnackBar();

  const [updateWorkspaceCapabilityMutation] = useMutation(
    UpdateWorkspaceCapabilityDocument,
  );

  const updateWorkspaceCapability = async (
    key: ProductCapabilityKey,
    enabled: boolean,
  ) => {
    if (!isDefined(currentWorkspace)) {
      enqueueErrorSnackBar({ message: t`No workspace selected` });
      return false;
    }

    try {
      const response = await updateWorkspaceCapabilityMutation({
        variables: { input: { key, enabled } },
      });

      const updatedCapability = response.data?.updateWorkspaceCapability;

      if (!isDefined(updatedCapability)) {
        return false;
      }

      setCurrentWorkspace({
        ...currentWorkspace,
        enabledCapabilities: [
          ...(currentWorkspace.enabledCapabilities?.filter(
            (capability) => capability.key !== updatedCapability.key,
          ) ?? []),
          { ...updatedCapability },
        ],
      });

      return true;
    } catch (error) {
      // Leave enabledCapabilities untouched so the toggle stays in sync with
      // the server (core-cannot-disable / dependency errors surface here).
      enqueueErrorSnackBar({
        message: getErrorMessageFromApolloError(error as ErrorLike),
      });

      return false;
    }
  };

  return { updateWorkspaceCapability };
};
