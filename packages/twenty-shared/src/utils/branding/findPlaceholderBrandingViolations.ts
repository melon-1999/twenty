// Detects placeholder branding values that must never reach a production
// build. Used by the production branding guard (twenty-front vite build)
// and the product release workflow. See docs/product/rebranding.md
const PLACEHOLDER_BRANDING_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'placeholder product name "YourCRM"', pattern: /yourcrm/i },
  {
    label: 'placeholder domain "example.com"',
    pattern: /(^|[^a-z0-9-])example\.com/i,
  },
  {
    label: 'placeholder support address "support@example.com"',
    pattern: /support@example\.com/i,
  },
  {
    label:
      'raw.githubusercontent.com URL pinned to a movable ref (use a product/v* release tag)',
    pattern: /raw\.githubusercontent\.com\/[^/\s]+\/[^/\s]+\/(?!product\/v\d)/i,
  },
];

export const findPlaceholderBrandingViolations = (
  valuesByLabel: Record<string, string>,
): string[] => {
  const violations: string[] = [];

  for (const [valueLabel, value] of Object.entries(valuesByLabel)) {
    for (const { label, pattern } of PLACEHOLDER_BRANDING_PATTERNS) {
      if (pattern.test(value)) {
        violations.push(`${valueLabel}: ${label}`);
      }
    }
  }

  return violations;
};
