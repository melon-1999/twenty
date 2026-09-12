const DEFAULT_TWENTY_APP_BASE_URL = 'https://app.example.com';

export const buildAppInstallUrl = (universalIdentifier: string): string => {
  const baseUrl =
    process.env.TWENTY_APP_BASE_URL ?? DEFAULT_TWENTY_APP_BASE_URL;

  const returnToPath = `/settings/applications/available/${universalIdentifier}`;

  return `${baseUrl.replace(/\/$/, '')}/?returnToPath=${encodeURIComponent(returnToPath)}`;
};
