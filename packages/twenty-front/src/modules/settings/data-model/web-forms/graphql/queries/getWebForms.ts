import { gql } from '@apollo/client';

export const GET_WEB_FORMS = gql`
  query GetWebForms {
    webForms
  }
`;
