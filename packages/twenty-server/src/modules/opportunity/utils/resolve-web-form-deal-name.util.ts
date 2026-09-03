export const resolveWebFormDealName = (
  template: string,
  fields: { firstName: string; lastName: string; email: string },
): string => {
  const resolved = template
    .replaceAll('{firstName}', fields.firstName)
    .replaceAll('{lastName}', fields.lastName)
    .replaceAll('{email}', fields.email)
    .trim();

  return resolved.length > 0 ? resolved : 'Web-Lead';
};
