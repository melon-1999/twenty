import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { TASK_REMINDER_CRON_PATTERN } from 'src/modules/task-reminder/constants/task-reminder.cron-pattern.constant';
import { TaskReminderCronJob } from 'src/modules/task-reminder/crons/task-reminder.cron.job';

@Command({
  name: 'cron:task:reminders',
  description: 'Starts a cron job to email daily task reminder digests',
})
export class TaskReminderCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: TaskReminderCronJob.name,
      data: undefined,
      options: { repeat: { pattern: TASK_REMINDER_CRON_PATTERN } },
    });
  }
}
