// Central branding configuration for the rebranded product.
// Replace these values (and the assets listed in docs/product/rebranding.md)
// to rebrand the whole app, emails and server-rendered surfaces.
// The product name is final (Novi CRM by Novicode); the example.com domains
// are intentional placeholders until the real domains are configured.
// The production branding guard (findPlaceholderBrandingViolations) blocks
// production builds while placeholders are active.
import { PRODUCT_RELEASE_TAG } from './ProductReleaseTag';
import { PRODUCT_VERSION } from './ProductVersion';

type ProductBranding = {
  name: string;
  shortName: string;
  // Lowercase technical identifier used for MCP server slugs and config keys
  slug: string;
  description: string;
  websiteUrl: string;
  supportUrl: string;
  repositoryUrl: string;
  sourceCodeUrl: string;
  // Customer-facing source archive of the deployed version, served from our
  // own domain (AGPL section 13 source offer without exposing GitHub)
  sourceDownloadUrl: string;
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
  name: 'Novi CRM',
  shortName: 'Novi',
  slug: 'novi',
  description: 'A modern CRM',
  websiteUrl: 'https://example.com',
  supportUrl: 'https://example.com/support',
  repositoryUrl: 'https://github.com/melon-1999/twenty',
  // Exact source of the deployed version, internal reference for operators
  sourceCodeUrl: `https://github.com/melon-1999/twenty/tree/${PRODUCT_RELEASE_TAG}`,
  sourceDownloadUrl: `https://legal.example.com/source/product-v${PRODUCT_VERSION}.tar.gz`,
  legalTermsUrl: 'https://example.com/legal/terms',
  legalPrivacyUrl: 'https://example.com/legal/privacy',
  legalDpaUrl: 'https://example.com/legal/dpa',
  supportEmail: 'support@example.com',
  emailLogoUrl: 'https://assets.example.com/brand/email-logo.png',
  defaultWorkspaceLogoUrl:
    'https://assets.example.com/brand/workspace-logo.png',
  legalEntityLine: 'Novicode',
  legalEntityLocationLine: '',
};
