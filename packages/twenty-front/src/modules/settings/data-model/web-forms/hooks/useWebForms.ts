import { useQuery } from '@apollo/client/react';

import { GET_WEB_FORMS } from '@/settings/data-model/web-forms/graphql/queries/getWebForms';
import { type WebForm } from '@/settings/data-model/web-forms/types/WebForm';

type GetWebFormsResult = {
  webForms: { forms: WebForm[] } | null;
};

export const useWebForms = (): { webForms: WebForm[]; loading: boolean } => {
  const { data, loading } = useQuery<GetWebFormsResult>(GET_WEB_FORMS);

  return { webForms: data?.webForms?.forms ?? [], loading };
};
