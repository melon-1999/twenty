import {
  buildWebFormPersonInsert,
  type WebFormSubmissionInput,
} from 'src/modules/opportunity/utils/build-web-form-person-insert.util';

const base: WebFormSubmissionInput = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'Ada@X.io',
  phone: '',
  jobTitle: '',
};

describe('buildWebFormPersonInsert', () => {
  it('maps name and lowercased primary email', () => {
    const record = buildWebFormPersonInsert(base);

    expect(record.name).toEqual({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(record.emails).toEqual({
      primaryEmail: 'ada@x.io',
      additionalEmails: null,
    });
  });

  it('omits phones and jobTitle when empty', () => {
    const record = buildWebFormPersonInsert(base);

    expect(record.phones).toBeUndefined();
    expect(record.jobTitle).toBeUndefined();
  });

  it('sets phones and jobTitle when present', () => {
    const record = buildWebFormPersonInsert({
      ...base,
      phone: '+49 170 1234567',
      jobTitle: 'CTO',
    });

    expect(record.phones).toEqual({
      primaryPhoneNumber: '+49 170 1234567',
      primaryPhoneCountryCode: '',
      primaryPhoneCallingCode: '',
      additionalPhones: null,
    });
    expect(record.jobTitle).toBe('CTO');
  });
});
