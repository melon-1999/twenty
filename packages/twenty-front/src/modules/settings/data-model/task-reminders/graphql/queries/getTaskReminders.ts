import { gql } from '@apollo/client';

export const GET_TASK_REMINDERS = gql`
  query GetTaskReminders {
    taskReminders
  }
`;
