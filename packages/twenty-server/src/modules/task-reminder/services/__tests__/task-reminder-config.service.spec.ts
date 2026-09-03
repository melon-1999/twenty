import { Test, type TestingModule } from '@nestjs/testing';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { TaskReminderConfigService } from 'src/modules/task-reminder/services/task-reminder-config.service';
import { TASK_REMINDERS_KEY } from 'src/modules/task-reminder/types/task-reminders-key-value.type';

describe('TaskReminderConfigService', () => {
  const workspaceId = 'ws-1';
  let service: TaskReminderConfigService;
  const get = jest.fn();
  const set = jest.fn();

  beforeEach(async () => {
    get.mockReset();
    set.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskReminderConfigService,
        { provide: KeyValuePairService, useValue: { get, set } },
      ],
    }).compile();
    service = module.get(TaskReminderConfigService);
  });

  it('returns { enabled: false } when nothing is stored', async () => {
    get.mockResolvedValue([]);

    await expect(service.getConfig(workspaceId)).resolves.toEqual({
      enabled: false,
    });
    expect(get).toHaveBeenCalledWith({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: TASK_REMINDERS_KEY,
    });
  });

  it('returns the stored config', async () => {
    get.mockResolvedValue([{ value: { enabled: true } }]);

    await expect(service.getConfig(workspaceId)).resolves.toEqual({
      enabled: true,
    });
  });

  it('persists the config and returns it', async () => {
    set.mockResolvedValue(undefined);

    await expect(
      service.setConfig(workspaceId, { enabled: true }),
    ).resolves.toEqual({ enabled: true });
    expect(set).toHaveBeenCalledWith({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: TASK_REMINDERS_KEY,
      value: { enabled: true },
    });
  });
});
