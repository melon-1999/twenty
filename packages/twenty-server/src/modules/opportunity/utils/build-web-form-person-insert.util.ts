import { isNonEmptyString } from '@sniptt/guards';

import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

export type WebFormSubmissionInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
};

export const buildWebFormPersonInsert = (
  input: WebFormSubmissionInput,
): Partial<PersonWorkspaceEntity> => {
  const record: Partial<PersonWorkspaceEntity> = {
    name: { firstName: input.firstName, lastName: input.lastName },
    emails: {
      primaryEmail: input.email.toLowerCase(),
      additionalEmails: null,
    },
  };

  if (isNonEmptyString(input.phone)) {
    record.phones = {
      primaryPhoneNumber: input.phone,
      primaryPhoneCountryCode: '',
      primaryPhoneCallingCode: '',
      additionalPhones: null,
    };
  }

  if (isNonEmptyString(input.jobTitle)) {
    record.jobTitle = input.jobTitle;
  }

  return record;
};
