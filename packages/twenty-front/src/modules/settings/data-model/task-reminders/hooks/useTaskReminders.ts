import { useQuery } from '@apollo/client/react';

import { GET_TASK_REMINDERS } from '@/settings/data-model/task-reminders/graphql/queries/getTaskReminders';
import { type TaskReminders } from '@/settings/data-model/task-reminders/types/TaskReminders';

type GetTaskRemindersResult = { taskReminders: TaskReminders | null };

export const useTaskReminders = (): { enabled: boolean; loading: boolean } => {
  const { data, loading } =
    useQuery<GetTaskRemindersResult>(GET_TASK_REMINDERS);

  return { enabled: data?.taskReminders?.enabled ?? false, loading };
};
