import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useInvalidateMetadataStore } from '@/metadata-store/hooks/useInvalidateMetadataStore';
import { PRODUCT_CAPABILITY_DISPLAY_CATALOG } from '@/settings/product-capability/constants/productCapabilityCatalog';
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
  const { invalidateMetadataStore } = useInvalidateMetadataStore();

  const [updateWorkspaceCapabilityMutation, { loading: isUpdatingCapability }] =
    useMutation(UpdateWorkspaceCapabilityDocument);

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

      // Merge onto the fresh atom value (functional updater) rather than the
      // `currentWorkspace` closed over at render time, which can be stale by
      // the time this slow, object-backed mutation resolves.
      setCurrentWorkspace((previousWorkspace) =>
        isDefined(previousWorkspace)
          ? {
              ...previousWorkspace,
              enabledCapabilities: [
                ...(previousWorkspace.enabledCapabilities?.filter(
                  (capability) => capability.key !== updatedCapability.key,
                ) ?? []),
                { ...updatedCapability },
              ],
            }
          : previousWorkspace,
      );

      // Object-backed capabilities flip a backing object's isActive server-side.
      // Invalidate the metadata store so the nav reflects the change live,
      // mirroring how object create/delete refresh metadata.
      if (PRODUCT_CAPABILITY_DISPLAY_CATALOG[key]?.objectBacked === true) {
        invalidateMetadataStore();
      }

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

  return { updateWorkspaceCapability, isUpdatingCapability };
};
