import { Test, type TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';

import { EventLogEmitterService } from 'src/engine/core-modules/event-logs/emit/event-log-emitter.service';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { BillingCreditService } from 'src/engine/core-modules/billing/services/billing-credit.service';
import { BillingService } from 'src/engine/core-modules/billing/services/billing.service';
import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { SignInUpService } from 'src/engine/core-modules/auth/services/sign-in-up.service';
import { type ExistingUserOrPartialUserWithPicture } from 'src/engine/core-modules/auth/types/signInUp.type';
import { SubdomainManagerService } from 'src/engine/core-modules/domain/subdomain-manager/services/subdomain-manager.service';
import { EnterprisePlanService } from 'src/engine/core-modules/enterprise/services/enterprise-plan.service';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { FileCorePictureService } from 'src/engine/core-modules/file/file-core-picture/services/file-core-picture.service';
import { MetricsService } from 'src/engine/core-modules/metrics/metrics.service';
import { OnboardingService } from 'src/engine/core-modules/onboarding/onboarding.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserWorkspaceService } from 'src/engine/core-modules/user-workspace/user-workspace.service';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceInvitationService } from 'src/engine/core-modules/workspace-invitation/services/workspace-invitation.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceEventEmitter } from 'src/engine/workspace-event-emitter/workspace-event-emitter';

describe('SignInUpService', () => {
  let signInUpService: SignInUpService;

  const workspaceRepositoryMock = {
    count: jest.fn(),
    create: jest.fn(),
  };
  const userRepositoryMock = {
    count: jest.fn(),
  };
  const twentyConfigServiceMock = {
    get: jest.fn(),
  };
  const enterprisePlanServiceMock = {
    isValid: jest.fn(),
  };
  const dataSourceMock = {
    transaction: jest.fn(),
  };
  const subdomainManagerServiceMock = {
    generateSubdomain: jest.fn(),
    validateSubdomainOrThrow: jest.fn(),
  };
  const workspaceCacheServiceMock = {
    invalidateAndRecompute: jest.fn(),
  };

  const buildExistingUserData = (
    canAccessFullAdminPanel: boolean,
  ): ExistingUserOrPartialUserWithPicture['userData'] => ({
    type: 'existingUser',
    existingUser: {
      id: '20202020-1c25-4d02-bf25-6aeccf7ea419',
      email: 'user@testfirma.example.com',
      canAccessFullAdminPanel,
    } as UserEntity,
  });

  const mockConfig = (values: Record<string, boolean>) => {
    twentyConfigServiceMock.get.mockImplementation(
      (key: string) => values[key],
    );
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignInUpService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepositoryMock,
        },
        {
          provide: getRepositoryToken(WorkspaceEntity),
          useValue: workspaceRepositoryMock,
        },
        { provide: WorkspaceInvitationService, useValue: {} },
        { provide: UserWorkspaceService, useValue: {} },
        { provide: OnboardingService, useValue: {} },
        { provide: WorkspaceEventEmitter, useValue: {} },
        { provide: TwentyConfigService, useValue: twentyConfigServiceMock },
        {
          provide: SubdomainManagerService,
          useValue: subdomainManagerServiceMock,
        },
        { provide: UserService, useValue: {} },
        { provide: MetricsService, useValue: {} },
        {
          provide: WorkspaceCacheService,
          useValue: workspaceCacheServiceMock,
        },
        { provide: ApplicationService, useValue: {} },
        { provide: FileCorePictureService, useValue: {} },
        { provide: ExceptionHandlerService, useValue: {} },
        { provide: EnterprisePlanService, useValue: enterprisePlanServiceMock },
        { provide: EventLogEmitterService, useValue: {} },
        { provide: BillingCreditService, useValue: {} },
        { provide: BillingService, useValue: {} },
        { provide: getDataSourceToken(), useValue: dataSourceMock },
      ],
    }).compile();

    signInUpService = module.get<SignInUpService>(SignInUpService);
  });

  // These tests pin the single-workspace contract of signUpOnNewWorkspace:
  // assertWorkspaceCreationAllowed runs before the displayName validation, so
  // an INVALID_INPUT "Workspace name is required" rejection proves the guard
  // let the request through, while SIGNUP_DISABLED proves it refused.
  describe('signUpOnNewWorkspace single-workspace guard', () => {
    it('refuses a second workspace for a regular user when multi-workspace is disabled', async () => {
      mockConfig({ IS_MULTIWORKSPACE_ENABLED: false });
      workspaceRepositoryMock.count.mockResolvedValue(1);

      await expect(
        signInUpService.signUpOnNewWorkspace(buildExistingUserData(false), {
          displayName: 'Zweite Firma',
        }),
      ).rejects.toMatchObject({
        constructor: AuthException,
        code: AuthExceptionCode.SIGNUP_DISABLED,
      });

      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
    });

    it('refuses a second workspace even for a server admin when multi-workspace is disabled', async () => {
      mockConfig({ IS_MULTIWORKSPACE_ENABLED: false });
      workspaceRepositoryMock.count.mockResolvedValue(1);

      await expect(
        signInUpService.signUpOnNewWorkspace(buildExistingUserData(true), {
          displayName: 'Zweite Firma',
        }),
      ).rejects.toMatchObject({
        constructor: AuthException,
        code: AuthExceptionCode.SIGNUP_DISABLED,
      });

      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
    });

    it('lets the first workspace of a fresh instance through the guard when multi-workspace is disabled', async () => {
      mockConfig({ IS_MULTIWORKSPACE_ENABLED: false });
      workspaceRepositoryMock.count.mockResolvedValue(0);

      // Failing on the missing displayName, which is validated after the
      // guard, proves the creation itself was allowed.
      await expect(
        signInUpService.signUpOnNewWorkspace(buildExistingUserData(false), {}),
      ).rejects.toMatchObject({
        constructor: AuthException,
        code: AuthExceptionCode.INVALID_INPUT,
        message: 'Workspace name is required',
      });
    });

    it('passes the guard for an additional workspace when multi-workspace is enabled', async () => {
      mockConfig({
        IS_MULTIWORKSPACE_ENABLED: true,
        IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS: false,
      });
      workspaceRepositoryMock.count.mockResolvedValue(1);
      enterprisePlanServiceMock.isValid.mockReturnValue(true);

      await expect(
        signInUpService.signUpOnNewWorkspace(buildExistingUserData(false), {}),
      ).rejects.toMatchObject({
        constructor: AuthException,
        code: AuthExceptionCode.INVALID_INPUT,
        message: 'Workspace name is required',
      });
    });
  });

  // Single-instance workspaces must be born invite-only: the inviteHash is
  // embedded in every invite email and never rotates, so a public invite
  // link on a single-tenant deployment lets anyone self-register into the
  // customer's workspace, bypassing SIGNUP_DISABLED.
  describe('signUpOnNewWorkspace isPublicInviteLinkEnabled default', () => {
    const STOP_AFTER_CREATE_ERROR = new Error('stop after workspace create');

    const setUpTransactionThatStopsAfterWorkspaceCreate = () => {
      dataSourceMock.transaction.mockImplementation(async (callback) => {
        const queryRunner = {
          manager: {
            save: jest.fn().mockRejectedValue(STOP_AFTER_CREATE_ERROR),
          },
        };

        return callback({ queryRunner });
      });
    };

    beforeEach(() => {
      workspaceRepositoryMock.count.mockResolvedValue(0);
      userRepositoryMock.count.mockResolvedValue(0);
      subdomainManagerServiceMock.generateSubdomain.mockResolvedValue('acme');
      setUpTransactionThatStopsAfterWorkspaceCreate();
    });

    it('creates the workspace with the public invite link disabled when multi-workspace is disabled', async () => {
      mockConfig({ IS_MULTIWORKSPACE_ENABLED: false });

      await expect(
        signInUpService.signUpOnNewWorkspace(buildExistingUserData(false), {
          displayName: 'Acme',
        }),
      ).rejects.toBe(STOP_AFTER_CREATE_ERROR);

      expect(workspaceRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPublicInviteLinkEnabled: false }),
      );
    });

    it('creates the workspace with the public invite link enabled when multi-workspace is enabled', async () => {
      mockConfig({ IS_MULTIWORKSPACE_ENABLED: true });

      await expect(
        signInUpService.signUpOnNewWorkspace(buildExistingUserData(false), {
          displayName: 'Acme',
        }),
      ).rejects.toBe(STOP_AFTER_CREATE_ERROR);

      expect(workspaceRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPublicInviteLinkEnabled: true }),
      );
    });
  });
});
