import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { TASK_REMINDER_CRON_PATTERN } from 'src/modules/task-reminder/constants/task-reminder.cron-pattern.constant';
import { TaskReminderService } from 'src/modules/task-reminder/services/task-reminder.service';

@Processor(MessageQueue.cronQueue)
export class TaskReminderCronJob {
  constructor(private readonly taskReminderService: TaskReminderService) {}

  @Process(TaskReminderCronJob.name)
  @SentryCronMonitor(TaskReminderCronJob.name, TASK_REMINDER_CRON_PATTERN)
  async handle(): Promise<void> {
    await this.taskReminderService.sendDailyDigests();
  }
}
