import { PRODUCT_BRANDING } from '../ProductBranding';
import { PRODUCT_RELEASE_TAG } from '../ProductReleaseTag';
import { PRODUCT_VERSION } from '../ProductVersion';

describe('PRODUCT_BRANDING', () => {
  it('should define a non-empty product name and short name', () => {
    expect(PRODUCT_BRANDING.name.length).toBeGreaterThan(0);
    expect(PRODUCT_BRANDING.shortName.length).toBeGreaterThan(0);
  });

  it('should not reference the upstream Twenty brand in user-visible values', () => {
    const userVisibleValues = [
      PRODUCT_BRANDING.name,
      PRODUCT_BRANDING.shortName,
      PRODUCT_BRANDING.description,
      PRODUCT_BRANDING.legalEntityLine,
    ];

    for (const value of userVisibleValues) {
      expect(value.toLowerCase()).not.toContain('twenty');
    }
  });

  it('should use absolute https URLs for all link targets', () => {
    const urls = [
      PRODUCT_BRANDING.websiteUrl,
      PRODUCT_BRANDING.supportUrl,
      PRODUCT_BRANDING.sourceCodeUrl,
      PRODUCT_BRANDING.sourceDownloadUrl,
      PRODUCT_BRANDING.legalTermsUrl,
      PRODUCT_BRANDING.legalPrivacyUrl,
      PRODUCT_BRANDING.legalDpaUrl,
      PRODUCT_BRANDING.emailLogoUrl,
      PRODUCT_BRANDING.defaultWorkspaceLogoUrl,
    ];

    for (const url of urls) {
      expect(url).toMatch(/^https:\/\//);
    }
  });

  it('should derive the release tag from the product version', () => {
    expect(PRODUCT_RELEASE_TAG).toBe(`product/v${PRODUCT_VERSION}`);
  });

  it('should pin the source code reference to the release tag, not a branch', () => {
    expect(PRODUCT_BRANDING.sourceCodeUrl).toBe(
      `${PRODUCT_BRANDING.repositoryUrl}/tree/${PRODUCT_RELEASE_TAG}`,
    );
  });

  it('should version the customer source download and keep it off github', () => {
    expect(PRODUCT_BRANDING.sourceDownloadUrl).toContain(PRODUCT_VERSION);
    expect(PRODUCT_BRANDING.sourceDownloadUrl).not.toContain('github');
  });

  it('should keep customer-visible asset URLs off github', () => {
    expect(PRODUCT_BRANDING.emailLogoUrl).not.toContain('github');
    expect(PRODUCT_BRANDING.defaultWorkspaceLogoUrl).not.toContain('github');
  });

  it('should use a lowercase url-safe slug', () => {
    expect(PRODUCT_BRANDING.slug).toMatch(/^[a-z][a-z0-9-]*$/);
  });
});
