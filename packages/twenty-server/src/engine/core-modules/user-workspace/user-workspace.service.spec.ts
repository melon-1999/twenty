import { WorkspaceDiscoverability } from 'src/engine/core-modules/workspace/types/workspace-discoverability.type';
import { UserWorkspaceService } from 'src/engine/core-modules/user-workspace/user-workspace.service';

describe('UserWorkspaceService', () => {
  const twentyConfigServiceMock = {
    get: jest.fn(),
  };
  const userRepositoryMock = {
    findOne: jest.fn(),
  };
  const workspaceInvitationServiceMock = {
    findInvitationsByEmail: jest.fn(),
  };
  const approvedAccessDomainServiceMock = {
    findValidatedApprovedAccessDomainWithWorkspacesAndSsoIdentityProvidersDomain:
      jest.fn(),
  };

  const mockConfig = (values: Record<string, boolean>) => {
    twentyConfigServiceMock.get.mockImplementation(
      (key: string) => values[key],
    );
  };

  let userWorkspaceService: UserWorkspaceService;

  beforeEach(() => {
    jest.clearAllMocks();

    userWorkspaceService = new UserWorkspaceService(
      {} as never, // userWorkspaceRepository
      userRepositoryMock as never, // userRepository
      {} as never, // roleTargetRepository
      {} as never, // roleValidationService
      workspaceInvitationServiceMock as never, // workspaceInvitationService
      {} as never, // workspaceDomainsService
      {} as never, // loginTokenService
      approvedAccessDomainServiceMock as never, // approvedAccessDomainService
      {} as never, // workspaceOrmManager
      {} as never, // userRoleService
      {} as never, // fileCorePictureService
      {} as never, // fileUrlService
      {} as never, // onboardingService
      {} as never, // coreEntityCacheService
      twentyConfigServiceMock as never, // twentyConfigService
    );

    userRepositoryMock.findOne.mockResolvedValue(null);
    workspaceInvitationServiceMock.findInvitationsByEmail.mockResolvedValue([]);
  });

  // Approved-domain self-join is now denied server-side at
  // IS_MULTIWORKSPACE_ENABLED=false (auth.service checkAccessForSignIn), so
  // advertising those workspaces (and their inviteHash) in the sign-up picker
  // would be a fail-closed dead end for the user.
  describe('findAvailableWorkspacesByEmail approved access domain picker gate', () => {
    const approvedAccessDomainWorkspace = {
      id: 'workspace-id',
      workspaceDiscoverability: WorkspaceDiscoverability.PUBLIC,
    };

    beforeEach(() => {
      approvedAccessDomainServiceMock.findValidatedApprovedAccessDomainWithWorkspacesAndSsoIdentityProvidersDomain.mockResolvedValue(
        [{ workspace: approvedAccessDomainWorkspace, isValidated: true }],
      );
    });

    it('does not list approved-domain workspaces when multi-workspace is disabled, even with email verification required', async () => {
      mockConfig({
        IS_MULTIWORKSPACE_ENABLED: false,
        IS_EMAIL_VERIFICATION_REQUIRED: true,
      });

      const result =
        await userWorkspaceService.findAvailableWorkspacesByEmail(
          'alice@kunde.de',
        );

      expect(result.availableWorkspacesForSignUp).toEqual([]);
    });

    it('lists approved-domain workspaces when multi-workspace is enabled and email verification is required', async () => {
      mockConfig({
        IS_MULTIWORKSPACE_ENABLED: true,
        IS_EMAIL_VERIFICATION_REQUIRED: true,
      });

      const result =
        await userWorkspaceService.findAvailableWorkspacesByEmail(
          'alice@kunde.de',
        );

      expect(result.availableWorkspacesForSignUp).toEqual([
        { workspace: approvedAccessDomainWorkspace },
      ]);
    });

    it('does not list approved-domain workspaces when email verification is not required, regardless of multi-workspace', async () => {
      mockConfig({
        IS_MULTIWORKSPACE_ENABLED: true,
        IS_EMAIL_VERIFICATION_REQUIRED: false,
      });

      const result =
        await userWorkspaceService.findAvailableWorkspacesByEmail(
          'alice@kunde.de',
        );

      expect(result.availableWorkspacesForSignUp).toEqual([]);
    });
  });
});
