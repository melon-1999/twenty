import { useMutation } from '@apollo/client/react';

import { UPDATE_WEB_FORMS } from '@/settings/data-model/web-forms/graphql/mutations/updateWebForms';
import { GET_WEB_FORMS } from '@/settings/data-model/web-forms/graphql/queries/getWebForms';
import { type WebForm } from '@/settings/data-model/web-forms/types/WebForm';

export const useUpdateWebForms = (): {
  updateWebForms: (forms: WebForm[]) => Promise<unknown>;
} => {
  const [mutate] = useMutation(UPDATE_WEB_FORMS, {
    refetchQueries: [{ query: GET_WEB_FORMS }],
  });

  const updateWebForms = (forms: WebForm[]) =>
    mutate({ variables: { input: { value: { forms } } } });

  return { updateWebForms };
};
