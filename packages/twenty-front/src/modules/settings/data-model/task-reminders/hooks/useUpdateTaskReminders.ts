import { useMutation } from '@apollo/client/react';

import { UPDATE_TASK_REMINDERS } from '@/settings/data-model/task-reminders/graphql/mutations/updateTaskReminders';
import { GET_TASK_REMINDERS } from '@/settings/data-model/task-reminders/graphql/queries/getTaskReminders';

export const useUpdateTaskReminders = (): {
  updateTaskReminders: (enabled: boolean) => Promise<unknown>;
} => {
  const [mutate] = useMutation(UPDATE_TASK_REMINDERS, {
    refetchQueries: [{ query: GET_TASK_REMINDERS }],
  });

  const updateTaskReminders = (enabled: boolean) =>
    mutate({ variables: { input: { value: { enabled } } } });

  return { updateTaskReminders };
};
