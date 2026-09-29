// Central branding configuration for the rebranded product.
// Replace these values (and the assets listed in docs/product/rebranding.md)
// to rebrand the whole app, emails and server-rendered surfaces.
// The product name is final (Novi CRM by Novicode) and the domains are the
// real novicode.de ones. legalTermsUrl/legalDpaUrl are still empty because
// those documents do not exist yet - consumers must hide the links while
// they are unset (see FooterNote.tsx, SettingsLegal.tsx, base-schema.utils.ts).
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
  websiteUrl: 'https://novicode.de',
  supportUrl: 'https://novicode.de/kontakt',
  repositoryUrl: 'https://github.com/melon-1999/twenty',
  // Exact source of the deployed version, internal reference for operators
  sourceCodeUrl: `https://github.com/melon-1999/twenty/tree/${PRODUCT_RELEASE_TAG}`,
  sourceDownloadUrl: `https://assets.melondevsolutions.cloud/novi/source/product-v${PRODUCT_VERSION}.tar.gz`,
  // No Terms/DPA documents exist yet; empty strings signal consumers to hide these links
  legalTermsUrl: '',
  legalPrivacyUrl: 'https://novicode.de/datenschutz',
  legalDpaUrl: '',
  supportEmail: 'kontakt@novicode.de',
  emailLogoUrl:
    'https://assets.melondevsolutions.cloud/novi/brand/email-logo.png',
  defaultWorkspaceLogoUrl:
    'https://assets.melondevsolutions.cloud/novi/brand/workspace-logo.png',
  legalEntityLine: 'Novicode',
  legalEntityLocationLine: '',
};
