import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppTokenEntity } from 'src/engine/core-modules/app-token/app-token.entity';
import { ApplicationRegistrationService } from 'src/engine/core-modules/application/application-registration/application-registration.service';
import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { AuthSsoService } from 'src/engine/core-modules/auth/services/auth-sso.service';
import { AuthService } from 'src/engine/core-modules/auth/services/auth.service';
import { CreateSsoConnectedAccountService } from 'src/engine/core-modules/auth/services/create-sso-connected-account.service';
import { SignInUpService } from 'src/engine/core-modules/auth/services/sign-in-up.service';
import { AccessTokenService } from 'src/engine/core-modules/auth/token/services/access-token.service';
import { LoginTokenService } from 'src/engine/core-modules/auth/token/services/login-token.service';
import { RefreshTokenService } from 'src/engine/core-modules/auth/token/services/refresh-token.service';
import { SsoExchangeTokenService } from 'src/engine/core-modules/auth/token/services/sso-exchange-token.service';
import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { EmailService } from 'src/engine/core-modules/email/email.service';
import { EventLogEmitterService } from 'src/engine/core-modules/event-logs/emit/event-log-emitter.service';
import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { GuardRedirectService } from 'src/engine/core-modules/guard-redirect/services/guard-redirect.service';
import { I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserSessionService } from 'src/engine/core-modules/user-session/services/user-session.service';
import { UserWorkspaceService } from 'src/engine/core-modules/user-workspace/user-workspace.service';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceInvitationService } from 'src/engine/core-modules/workspace-invitation/services/workspace-invitation.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';

describe('AuthService', () => {
  let authService: AuthService;

  const twentyConfigServiceMock = {
    get: jest.fn(),
  };
  const userServiceMock = {
    hasUserAccessToWorkspaceOrThrow: jest.fn(),
  };

  const mockConfig = (values: Record<string, boolean>) => {
    twentyConfigServiceMock.get.mockImplementation(
      (key: string) => values[key],
    );
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AccessTokenService, useValue: {} },
        { provide: SsoExchangeTokenService, useValue: {} },
        { provide: WorkspaceDomainsService, useValue: {} },
        { provide: DomainServerConfigService, useValue: {} },
        { provide: RefreshTokenService, useValue: {} },
        { provide: LoginTokenService, useValue: {} },
        { provide: GuardRedirectService, useValue: {} },
        { provide: UserWorkspaceService, useValue: {} },
        { provide: WorkspaceInvitationService, useValue: {} },
        { provide: AuthSsoService, useValue: {} },
        { provide: UserService, useValue: userServiceMock },
        { provide: SignInUpService, useValue: {} },
        { provide: PermissionsService, useValue: {} },
        { provide: getRepositoryToken(WorkspaceEntity), useValue: {} },
        { provide: getRepositoryToken(UserEntity), useValue: {} },
        { provide: TwentyConfigService, useValue: twentyConfigServiceMock },
        { provide: EmailService, useValue: {} },
        { provide: getRepositoryToken(AppTokenEntity), useValue: {} },
        { provide: I18nService, useValue: {} },
        { provide: EventLogEmitterService, useValue: {} },
        { provide: ApplicationRegistrationService, useValue: {} },
        { provide: FeatureFlagService, useValue: {} },
        { provide: CreateSsoConnectedAccountService, useValue: {} },
        { provide: UserSessionService, useValue: {} },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  // Birth-time hardening (workspace.isPublicInviteLinkEnabled set at creation)
  // only protects workspaces created after that fix. Runtime must also refuse
  // public-invite-link signup on single-instance deployments regardless of the
  // stored DB value, so a pre-fix workspace or an accidental admin re-enable
  // can't reopen self-registration.
  describe('checkAccessForSignIn public invite link runtime guard', () => {
    const newUserData = {
      userData: {
        type: 'newUser' as const,
        newUserPayload: { email: 'newcomer@example.com' },
      },
    };
    const workspace = {
      id: 'workspace-id',
      isPublicInviteLinkEnabled: true,
      approvedAccessDomains: [],
    } as unknown as WorkspaceEntity;

    it('rejects public invite link signup when multi-workspace is disabled, even if the DB flag is enabled', async () => {
      mockConfig({
        IS_MULTIWORKSPACE_ENABLED: false,
        IS_EMAIL_VERIFICATION_REQUIRED: false,
      });

      await expect(
        authService.checkAccessForSignIn({
          ...newUserData,
          workspaceInviteHash: 'invite-hash',
          workspace,
        }),
      ).rejects.toMatchObject({
        constructor: AuthException,
        code: AuthExceptionCode.FORBIDDEN_EXCEPTION,
        message: 'Public invite link is disabled for this workspace',
      });
    });

    it('lets public invite link signup through when multi-workspace is enabled and the DB flag is enabled', async () => {
      mockConfig({
        IS_MULTIWORKSPACE_ENABLED: true,
        IS_EMAIL_VERIFICATION_REQUIRED: false,
      });

      await expect(
        authService.checkAccessForSignIn({
          ...newUserData,
          workspaceInviteHash: 'invite-hash',
          workspace,
        }),
      ).resolves.toBeUndefined();
    });

    it('lets a personal invitation through when multi-workspace is disabled, even with a public hash present', async () => {
      mockConfig({
        IS_MULTIWORKSPACE_ENABLED: false,
        IS_EMAIL_VERIFICATION_REQUIRED: false,
      });

      await expect(
        authService.checkAccessForSignIn({
          ...newUserData,
          invitation: { id: 'invitation-token-id' } as never,
          workspaceInviteHash: 'invite-hash',
          workspace,
        }),
      ).resolves.toBeUndefined();
    });
  });

  // Approved access domains are a multi-workspace self-join mechanism. On a
  // single-instance deployment they must never grant membership on their own:
  // today the check is inert only because IS_EMAIL_VERIFICATION_REQUIRED is
  // off, which is a config coincidence, not a guarantee.
  describe('checkAccessForSignIn approved access domain runtime guard', () => {
    const newUserData = {
      userData: {
        type: 'newUser' as const,
        newUserPayload: { email: 'alice@kunde.de' },
      },
    };
    const workspace = {
      id: 'workspace-id',
      isPublicInviteLinkEnabled: false,
      approvedAccessDomains: [{ domain: 'kunde.de', isValidated: true }],
    } as unknown as WorkspaceEntity;

    it('refuses an approved access domain self-join when multi-workspace is disabled', async () => {
      mockConfig({
        IS_MULTIWORKSPACE_ENABLED: false,
        IS_EMAIL_VERIFICATION_REQUIRED: true,
      });

      await expect(
        authService.checkAccessForSignIn({
          ...newUserData,
          workspace,
        }),
      ).rejects.toMatchObject({
        constructor: AuthException,
        code: AuthExceptionCode.FORBIDDEN_EXCEPTION,
        message: 'User does not have access to this workspace',
      });
    });

    it('lets an approved access domain self-join through when multi-workspace is enabled', async () => {
      mockConfig({
        IS_MULTIWORKSPACE_ENABLED: true,
        IS_EMAIL_VERIFICATION_REQUIRED: true,
      });

      await expect(
        authService.checkAccessForSignIn({
          ...newUserData,
          workspace,
        }),
      ).resolves.toBeUndefined();
    });

    it('lets a personal invitation through when multi-workspace is disabled', async () => {
      mockConfig({
        IS_MULTIWORKSPACE_ENABLED: false,
        IS_EMAIL_VERIFICATION_REQUIRED: true,
      });

      await expect(
        authService.checkAccessForSignIn({
          ...newUserData,
          invitation: { id: 'invitation-token-id' } as never,
          workspace,
        }),
      ).resolves.toBeUndefined();
    });
  });
});
