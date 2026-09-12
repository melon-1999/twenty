import { findPlaceholderBrandingViolations } from '../findPlaceholderBrandingViolations';

describe('findPlaceholderBrandingViolations', () => {
  it('should flag the placeholder product name', () => {
    const violations = findPlaceholderBrandingViolations({
      name: 'YourCRM',
    });

    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('name');
    expect(violations[0]).toContain('YourCRM');
  });

  it('should flag placeholder example.com URLs and support address', () => {
    const violations = findPlaceholderBrandingViolations({
      websiteUrl: 'https://example.com',
      legalTermsUrl: 'https://example.com/legal/terms',
      supportEmail: 'support@example.com',
    });

    expect(violations.length).toBeGreaterThanOrEqual(3);
  });

  it('should flag raw.githubusercontent.com URLs pinned to a branch', () => {
    const violations = findPlaceholderBrandingViolations({
      emailLogoUrl:
        'https://raw.githubusercontent.com/melon-1999/twenty/product/rebrand/packages/twenty-front/public/logo.png',
      otherUrl:
        'https://raw.githubusercontent.com/melon-1999/twenty/main/logo.png',
    });

    expect(violations).toHaveLength(2);
  });

  it('should accept raw.githubusercontent.com URLs pinned to a product release tag', () => {
    const violations = findPlaceholderBrandingViolations({
      emailLogoUrl:
        'https://raw.githubusercontent.com/melon-1999/twenty/product/v0.1.0/packages/twenty-front/public/logo.png',
    });

    expect(violations).toHaveLength(0);
  });

  it('should accept real branding values', () => {
    const violations = findPlaceholderBrandingViolations({
      name: 'AcmeCRM',
      websiteUrl: 'https://acme-crm.io',
      supportEmail: 'support@acme-crm.io',
      html: '<title>AcmeCRM</title><p>Example content mentioning examples.</p>',
    });

    expect(violations).toHaveLength(0);
  });

  it('should not flag domains merely containing example.com as a suffix of another word', () => {
    const violations = findPlaceholderBrandingViolations({
      websiteUrl: 'https://myexample.company.io',
    });

    expect(violations).toHaveLength(0);
  });
});
