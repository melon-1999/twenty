import { Injectable } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  TASK_REMINDERS_KEY,
  type TaskRemindersConfig,
  type TaskRemindersKeyValueTypeMap,
} from 'src/modules/task-reminder/types/task-reminders-key-value.type';

@Injectable()
export class TaskReminderConfigService {
  constructor(
    private readonly keyValuePairService: KeyValuePairService<TaskRemindersKeyValueTypeMap>,
  ) {}

  async getConfig(workspaceId: string): Promise<TaskRemindersConfig> {
    const stored = await this.keyValuePairService.get({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: TASK_REMINDERS_KEY,
    });

    const value = (stored[0] as { value?: TaskRemindersConfig } | undefined)
      ?.value;

    return value ?? { enabled: false };
  }

  async setConfig(
    workspaceId: string,
    config: TaskRemindersConfig,
  ): Promise<TaskRemindersConfig> {
    await this.keyValuePairService.set({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: TASK_REMINDERS_KEY,
      value: config,
    });

    return config;
  }
}
