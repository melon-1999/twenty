import { gql } from '@apollo/client';

export const UPDATE_TASK_REMINDERS = gql`
  mutation UpdateTaskReminders($input: UpdateTaskRemindersInput!) {
    updateTaskReminders(input: $input)
  }
`;
