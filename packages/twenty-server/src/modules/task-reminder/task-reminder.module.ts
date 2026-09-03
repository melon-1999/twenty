import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from 'src/engine/core-modules/email/email.module';
import { I18nModule } from 'src/engine/core-modules/i18n/i18n.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TaskReminderCronCommand } from 'src/modules/task-reminder/crons/commands/task-reminder.cron.command';
import { TaskReminderService } from 'src/modules/task-reminder/services/task-reminder.service';
import { TaskReminderConfigModule } from 'src/modules/task-reminder/task-reminder-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    EmailModule,
    I18nModule,
    TaskReminderConfigModule,
  ],
  providers: [TaskReminderService, TaskReminderCronCommand],
  exports: [TaskReminderService, TaskReminderCronCommand],
})
export class TaskReminderModule {}
