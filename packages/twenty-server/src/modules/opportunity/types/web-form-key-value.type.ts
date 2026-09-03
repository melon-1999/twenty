export const WEB_FORMS_KEY = 'WEB_FORMS';

export type WebForm = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  stage: string;
  dealNameTemplate: string;
  thankYouText: string;
};

export type WebFormsConfig = { forms: WebForm[] };

export type WebFormKeyValueTypeMap = {
  [WEB_FORMS_KEY]: WebFormsConfig;
};
