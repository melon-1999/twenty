import {
  PRODUCT_BRANDING,
  PRODUCT_RELEASE_TAG,
  PRODUCT_VERSION,
} from '../ProductBranding';

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

  it('should pin source code and asset URLs to the release tag, not a branch', () => {
    expect(PRODUCT_BRANDING.sourceCodeUrl).toBe(
      `${PRODUCT_BRANDING.repositoryUrl}/tree/${PRODUCT_RELEASE_TAG}`,
    );
    expect(PRODUCT_BRANDING.emailLogoUrl).toContain(`/${PRODUCT_RELEASE_TAG}/`);
    expect(PRODUCT_BRANDING.defaultWorkspaceLogoUrl).toContain(
      `/${PRODUCT_RELEASE_TAG}/`,
    );
  });
});
