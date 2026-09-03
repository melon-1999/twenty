export const resolveWebFormDealName = (
  template: string,
  fields: { firstName: string; lastName: string; email: string },
): string => {
  const resolved = template
    .split('{firstName}')
    .join(fields.firstName)
    .split('{lastName}')
    .join(fields.lastName)
    .split('{email}')
    .join(fields.email)
    .trim();

  return resolved.length > 0 ? resolved : 'Web-Lead';
};
