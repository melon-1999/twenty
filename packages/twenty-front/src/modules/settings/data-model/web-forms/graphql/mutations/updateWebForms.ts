import { gql } from '@apollo/client';

export const UPDATE_WEB_FORMS = gql`
  mutation UpdateWebForms($input: UpdateWebFormsInput!) {
    updateWebForms(input: $input)
  }
`;
