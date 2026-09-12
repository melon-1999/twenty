// Central branding configuration for the rebranded product.
// Replace these values (and the assets listed in docs/product/rebranding.md)
// to rebrand the whole app, emails and server-rendered surfaces.
// Placeholder values are intentional: no final product name exists yet.
// The production branding guard (findPlaceholderBrandingViolations) blocks
// production builds while placeholders are active.

// Bump on every product release; the release tag `product/v<version>` must
// point at the released commit so source and asset URLs stay immutable.
export const PRODUCT_VERSION = '0.1.0';

export const PRODUCT_RELEASE_TAG = `product/v${PRODUCT_VERSION}`;

const REPOSITORY_URL = 'https://github.com/melon-1999/twenty';

const RAW_ASSETS_BASE_URL = `https://raw.githubusercontent.com/melon-1999/twenty/${PRODUCT_RELEASE_TAG}`;

const DEFAULT_LOGO_ASSET_PATH =
  'packages/twenty-front/public/images/icons/android/android-launchericon-192-192.png';

type ProductBranding = {
  name: string;
  shortName: string;
  description: string;
  websiteUrl: string;
  supportUrl: string;
  repositoryUrl: string;
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
  repositoryUrl: REPOSITORY_URL,
  // Exact source of the deployed version (AGPL section 13 source offer)
  sourceCodeUrl: `${REPOSITORY_URL}/tree/${PRODUCT_RELEASE_TAG}`,
  legalTermsUrl: 'https://example.com/legal/terms',
  legalPrivacyUrl: 'https://example.com/legal/privacy',
  legalDpaUrl: 'https://example.com/legal/dpa',
  supportEmail: 'support@example.com',
  emailLogoUrl: `${RAW_ASSETS_BASE_URL}/${DEFAULT_LOGO_ASSET_PATH}`,
  defaultWorkspaceLogoUrl: `${RAW_ASSETS_BASE_URL}/${DEFAULT_LOGO_ASSET_PATH}`,
  legalEntityLine: 'YourCRM',
  legalEntityLocationLine: '',
};
