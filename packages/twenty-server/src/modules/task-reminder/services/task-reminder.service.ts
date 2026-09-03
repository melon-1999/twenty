import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { TaskReminderEmail, renderEmail } from 'twenty-emails';
import { isDefined } from 'twenty-shared/utils';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { In, IsNull, LessThanOrEqual, Repository } from 'typeorm';

import { EmailService } from 'src/engine/core-modules/email/email.service';
import { I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { TaskReminderConfigService } from 'src/modules/task-reminder/services/task-reminder-config.service';
import { buildTaskDigest } from 'src/modules/task-reminder/utils/build-task-digest.util';

@Injectable()
export class TaskReminderService {
  private readonly logger = new Logger(TaskReminderService.name);

  constructor(
    // Cross-workspace cron: no workspaceId is in scope for the core repo.
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly taskReminderConfigService: TaskReminderConfigService,
    private readonly emailService: EmailService,
    private readonly i18nService: I18nService,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  async sendDailyDigests(): Promise<void> {
    const now = new Date();
    const endOfTodayUtc = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const workspaces = await this.workspaceRepository.find({
      select: { id: true },
      where: {
        activationStatus: WorkspaceActivationStatus.ACTIVE,
        deletedAt: IsNull(),
      },
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        const { enabled } =
          await this.taskReminderConfigService.getConfig(workspaceId);

        if (!enabled) {
          continue;
        }

        await this.processWorkspace(workspaceId, now, endOfTodayUtc);
      } catch (error) {
        this.logger.error(
          `Task reminders failed for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }

  private async processWorkspace(
    workspaceId: string,
    now: Date,
    endOfTodayUtc: Date,
  ): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const taskRepository =
        await this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
          workspaceId,
          'task',
          { shouldBypassPermissionChecks: true },
        );

      const tasks = await taskRepository.find({
        where: {
          status: In(['TODO', 'IN_PROGRESS']),
          dueAt: LessThanOrEqual(endOfTodayUtc),
        },
        relations: {
          assignee: true,
          taskTargets: {
            targetOpportunity: true,
            targetPerson: true,
            targetCompany: true,
          },
        },
      });

      const byAssignee = new Map<string, TaskWorkspaceEntity[]>();

      for (const task of tasks) {
        const assignee = task.assignee;

        if (!isDefined(assignee) || !isDefined(assignee.userEmail)) {
          continue;
        }

        const group = byAssignee.get(assignee.id) ?? [];

        group.push(task);
        byAssignee.set(assignee.id, group);
      }

      for (const group of byAssignee.values()) {
        await this.sendDigestForAssignee(group, now);
      }
    }, authContext);
  }

  private resolveLinkedRecordName(task: TaskWorkspaceEntity): string | null {
    const target = task.taskTargets?.[0];

    if (!isDefined(target)) {
      return null;
    }

    if (isDefined(target.targetOpportunity?.name)) {
      return target.targetOpportunity.name;
    }

    if (isDefined(target.targetPerson?.name)) {
      const { firstName, lastName } = target.targetPerson.name;

      return `${firstName ?? ''} ${lastName ?? ''}`.trim() || null;
    }

    if (isDefined(target.targetCompany?.name)) {
      return target.targetCompany.name;
    }

    return null;
  }

  private async sendDigestForAssignee(
    tasks: TaskWorkspaceEntity[],
    now: Date,
  ): Promise<void> {
    const assignee = tasks[0].assignee;

    if (!isDefined(assignee) || !isDefined(assignee.userEmail)) {
      return;
    }

    const digest = buildTaskDigest(
      tasks.map((task) => ({
        title: task.title,
        dueAt: task.dueAt as Date,
        linkedRecordName: this.resolveLinkedRecordName(task),
      })),
      now,
    );

    if (digest.overdue.length === 0 && digest.today.length === 0) {
      return;
    }

    const toLine = (item: {
      title: string;
      dueAt: Date;
      linkedRecordName: string | null;
    }) => ({
      title: item.title,
      due: item.dueAt.toLocaleDateString('de-DE'),
      linkedRecordName: item.linkedRecordName,
    });

    const userName =
      `${assignee.name.firstName ?? ''} ${assignee.name.lastName ?? ''}`.trim();
    const locale = assignee.locale;
    const i18n = this.i18nService.getI18nInstance(locale);

    const emailTemplate = TaskReminderEmail({
      userName,
      overdue: digest.overdue.map(toLine),
      today: digest.today.map(toLine),
      locale,
    });

    const html = await renderEmail(emailTemplate, { pretty: true });
    const text = await renderEmail(emailTemplate, { plainText: true });

    await this.emailService.send({
      to: assignee.userEmail,
      from: `${this.twentyConfigService.get('EMAIL_FROM_NAME')} <${this.twentyConfigService.get('EMAIL_FROM_ADDRESS')}>`,
      subject: i18n._(msg`Deine fälligen Aktivitäten`),
      html,
      text,
    });
  }
}
