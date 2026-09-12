import fs from 'fs';
import path from 'path';
import { PRODUCT_BRANDING } from 'twenty-shared/constants';
import { findPlaceholderBrandingViolations } from 'twenty-shared/utils';
import { type PluginOption } from 'vite';

// Blocks production builds while placeholder branding is active.
// CI and test builds opt out with ALLOW_PLACEHOLDER_BRANDING=true;
// deployment pipelines must not set it. See docs/product/rebranding.md
export const assertProductionBrandingPlugin = (
  mode: string,
  frontRootDir: string,
): PluginOption => ({
  name: 'assert-production-branding',
  apply: 'build',
  buildStart() {
    if (mode !== 'production') {
      return;
    }

    if (process.env.ALLOW_PLACEHOLDER_BRANDING === 'true') {
      return;
    }

    const brandingValues = Object.fromEntries(
      Object.entries(PRODUCT_BRANDING).map(([key, value]) => [
        `PRODUCT_BRANDING.${key}`,
        value,
      ]),
    );

    const staticFiles = Object.fromEntries(
      ['index.html', path.join('public', 'manifest.json')].map((filePath) => [
        filePath,
        fs.readFileSync(path.resolve(frontRootDir, filePath), 'utf-8'),
      ]),
    );

    const violations = findPlaceholderBrandingViolations({
      ...brandingValues,
      ...staticFiles,
    });

    if (violations.length > 0) {
      throw new Error(
        [
          'Production build blocked: placeholder branding is still active.',
          ...violations.map((violation) => `  - ${violation}`),
          'Replace the placeholders (see docs/product/rebranding.md) or set',
          'ALLOW_PLACEHOLDER_BRANDING=true for CI/test builds only.',
        ].join('\n'),
      );
    }
  },
});
