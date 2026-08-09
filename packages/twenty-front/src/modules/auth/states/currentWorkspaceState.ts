import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import { type ProductCapabilityKey } from 'twenty-shared/types';
import {
  type Application,
  type Role,
  type Workspace,
} from '~/generated-metadata/graphql';

export type CurrentWorkspace = Pick<
  Workspace,
  | 'id'
  | 'inviteHash'
  | 'logo'
  | 'displayName'
  | 'allowImpersonation'
  | 'featureFlags'
  | 'activationStatus'
  | 'billingSubscriptions'
  | 'billingEntitlements'
  | 'billingCustomer'
  | 'currentBillingSubscription'
  | 'workspaceMembersCount'
  | 'isPublicInviteLinkEnabled'
  | 'workspaceDiscoverability'
  | 'isGoogleAuthEnabled'
  | 'isGoogleAuthBypassEnabled'
  | 'isMicrosoftAuthEnabled'
  | 'isMicrosoftAuthBypassEnabled'
  | 'isPasswordAuthEnabled'
  | 'isPasswordAuthBypassEnabled'
  | 'isCustomDomainEnabled'
  | 'hasValidSignedEnterpriseKey'
  | 'hasValidEnterpriseValidityToken'
  | 'subdomain'
  | 'customDomain'
  | 'workspaceUrls'
  | 'isTwoFactorAuthenticationEnforced'
  | 'trashRetentionDays'
  | 'eventLogRetentionDays'
  | 'fastModel'
  | 'smartModel'
  | 'aiAdditionalInstructions'
  | 'editableProfileFields'
  | 'enabledAiModelIds'
  | 'useRecommendedModels'
  | 'isInternalMessagesImportEnabled'
> & {
  defaultRole?: Omit<Role, 'workspaceMembers' | 'agents' | 'apiKeys'> | null;
  workspaceCustomApplication: Pick<Application, 'id'> | null;
  installedApplications: Pick<
    Application,
    'id' | 'name' | 'universalIdentifier' | 'logoUrl'
  >[];
  // TODO: remove this once `enabledCapabilities` is present in the generated
  // metadata graphql types (requires running `graphql:generate` against a live backend).
  enabledCapabilities?: { key: ProductCapabilityKey; value: boolean }[] | null;
};

export const currentWorkspaceState = createAtomState<CurrentWorkspace | null>({
  key: 'currentWorkspaceState',
  defaultValue: null,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
});
