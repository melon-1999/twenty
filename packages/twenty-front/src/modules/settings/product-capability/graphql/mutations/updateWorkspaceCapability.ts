import { gql } from '@apollo/client';

export const UPDATE_WORKSPACE_CAPABILITY = gql`
  mutation UpdateWorkspaceCapability($input: UpdateWorkspaceCapabilityInput!) {
    updateWorkspaceCapability(input: $input) {
      key
      value
    }
  }
`;
