import { useIsLogged } from '@/auth/hooks/useIsLogged';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { useIsCapabilityEnabled } from '@/workspace/hooks/useIsCapabilityEnabled';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import {
  type FeatureFlagKey,
  type PermissionFlagType,
  ProductCapabilityKey,
} from '~/generated-metadata/graphql';

type SettingsProtectedRouteWrapperProps = {
  children?: ReactNode;
  settingsPermission?: PermissionFlagType;
  requiredFeatureFlag?: FeatureFlagKey;
  requiredCapability?: ProductCapabilityKey;
};

export const SettingsProtectedRouteWrapper = ({
  children,
  settingsPermission,
  requiredFeatureFlag,
  requiredCapability,
}: SettingsProtectedRouteWrapperProps) => {
  const isLogged = useIsLogged();
  const hasPermission = useHasPermissionFlag(settingsPermission);
  const requiredFeatureFlagEnabled = useIsFeatureEnabled(
    requiredFeatureFlag || null,
  );
  const isCapabilityEnabled = useIsCapabilityEnabled(
    requiredCapability ?? null,
  );

  if (!isLogged) {
    return null;
  }

  // TODO: this should be part of PageChangeEffect as otherwise we will have multiple sources of redirection that can:
  // - conflict (race conditions)
  // - degrade performance as we will redirect multiple times
  if (
    (requiredFeatureFlag && !requiredFeatureFlagEnabled) ||
    (requiredCapability && !isCapabilityEnabled) ||
    !hasPermission
  ) {
    return <Navigate to={getSettingsPath(SettingsPath.ProfilePage)} replace />;
  }

  return children ?? <Outlet />;
};
