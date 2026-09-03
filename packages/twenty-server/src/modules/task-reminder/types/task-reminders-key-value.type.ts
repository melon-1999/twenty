export const TASK_REMINDERS_KEY = 'TASK_REMINDERS';

export type TaskRemindersConfig = { enabled: boolean };

export type TaskRemindersKeyValueTypeMap = {
  [TASK_REMINDERS_KEY]: TaskRemindersConfig;
};
