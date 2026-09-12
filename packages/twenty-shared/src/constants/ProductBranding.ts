// Central branding configuration for the rebranded product.
// Replace these values (and the assets listed in docs/product/rebranding.md)
// to rebrand the whole app, emails and server-rendered surfaces.
// Placeholder values are intentional: no final product name exists yet.
type ProductBranding = {
  name: string;
  shortName: string;
  description: string;
  websiteUrl: string;
  supportUrl: string;
  sourceCodeUrl: string;
  legalTermsUrl: string;
  legalPrivacyUrl: string;
  legalDpaUrl: string;
  supportEmail: string;
  emailLogoUrl: string;
  defaultWorkspaceLogoUrl: string;
  legalEntityLine: string;
  legalEntityLocationLine: string;
};

export const PRODUCT_BRANDING: ProductBranding = {
  name: 'YourCRM',
  shortName: 'YourCRM',
  description: 'A modern CRM',
  websiteUrl: 'https://example.com',
  supportUrl: 'https://example.com/support',
  sourceCodeUrl: 'https://github.com/melon-1999/twenty',
  legalTermsUrl: 'https://example.com/legal/terms',
  legalPrivacyUrl: 'https://example.com/legal/privacy',
  legalDpaUrl: 'https://example.com/legal/dpa',
  supportEmail: 'support@example.com',
  emailLogoUrl:
    'https://raw.githubusercontent.com/melon-1999/twenty/product/rebrand/packages/twenty-front/public/images/icons/android/android-launchericon-192-192.png',
  defaultWorkspaceLogoUrl:
    'https://raw.githubusercontent.com/melon-1999/twenty/product/rebrand/packages/twenty-front/public/images/icons/android/android-launchericon-192-192.png',
  legalEntityLine: 'YourCRM',
  legalEntityLocationLine: '',
};
