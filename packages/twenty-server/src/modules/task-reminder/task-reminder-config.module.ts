import { Module } from '@nestjs/common';

import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { TaskReminderConfigResolver } from 'src/modules/task-reminder/resolvers/task-reminder-config.resolver';
import { TaskReminderConfigService } from 'src/modules/task-reminder/services/task-reminder-config.service';

@Module({
  imports: [KeyValuePairModule, PermissionsModule],
  providers: [TaskReminderConfigService, TaskReminderConfigResolver],
  exports: [TaskReminderConfigService],
})
export class TaskReminderConfigModule {}
