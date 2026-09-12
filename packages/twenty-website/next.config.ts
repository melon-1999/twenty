import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import withLinaria, { type LinariaConfig } from 'next-with-linaria';
import path from 'path';
import { PRODUCT_BRANDING } from 'twenty-shared/constants';
import { findPlaceholderBrandingViolations } from 'twenty-shared/utils';

import { WEBSITE_LOCALE_LIST } from './src/platform/i18n/website-locale-list';
import { buildLocaleRewrites } from './src/platform/routing/locale-rewrite-patterns';

// Production branding guard, same contract as the twenty-front vite plugin:
// a production build of the marketing site must not ship placeholder branding.
if (
  process.env.NODE_ENV === 'production' &&
  process.env.ALLOW_PLACEHOLDER_BRANDING !== 'true'
) {
  const violations = findPlaceholderBrandingViolations(
    Object.fromEntries(
      Object.entries(PRODUCT_BRANDING).map(([key, value]) => [
        `PRODUCT_BRANDING.${key}`,
        value,
      ]),
    ),
  );
  if (violations.length > 0) {
    throw new Error(
      [
        'Website production build blocked: placeholder branding is active.',
        ...violations.map((violation) => `  - ${violation}`),
        'Set ALLOW_PLACEHOLDER_BRANDING=true for CI/test builds only.',
      ].join('\n'),
    );
  }
}

const SECURITY_HEADERS: { key: string; value: string }[] = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
];

// Skew protection: CI sets DEPLOYMENT_ID at build time so it's baked into
// prerendered HTML + the RSC payloads. The Worker reads the same value at
// runtime (via the worker env var) and routes mismatched requests to the
// matching older Worker version via its preview URL. Required whenever
// open-next.config.ts has cloudflare.skewProtection.enabled.
const deploymentId = process.env.DEPLOYMENT_ID;

const nextConfig: LinariaConfig = {
  deploymentId,
  reactCompiler: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  linaria: {
    configFile: path.resolve(__dirname, 'wyw-in-js.config.cjs'),
  },
  experimental: {
    swcPlugins: [
      [
        '@lingui/swc-plugin',
        {
          runtimeModules: {
            i18n: ['@lingui/core', 'i18n'],
            trans: ['@lingui/react', 'Trans'],
          },
        },
      ],
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      {
        source: '/(images|illustrations|lottie)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Clean public URLs: the source locale is unprefixed, other locales get a
  // short segment. Rewrites map unprefixed paths onto the internal /[locale]
  // tree; redirects canonicalize away explicit source-locale prefixes.
  async rewrites() {
    return {
      beforeFiles: buildLocaleRewrites(WEBSITE_LOCALE_LIST),
    };
  },
  async redirects() {
    return [
      // Strip the source-locale prefix: /en/foo → /foo (301).
      { source: '/en', destination: '/', statusCode: 301 },
      { source: '/en/:path*', destination: '/:path*', statusCode: 301 },
      // /partners/list folded into the lead page, whose directory zone is the
      // same grid. Both the unprefixed and the locale-prefixed URLs were in the
      // sitemap, so both need the 308.
      { source: '/partners/list', destination: '/partners', permanent: true },
      {
        source: `/:locale(${WEBSITE_LOCALE_LIST.join('|')})/partners/list`,
        destination: '/:locale/partners',
        permanent: true,
      },
      // Upstream Twenty marketing pages retired for the rebranded product:
      // routes stay reachable in the codebase but customers land on the
      // homepage instead of Twenty-specific content.
      ...[
        'why-twenty',
        'partners',
        'partners/:path*',
        'releases',
        'enterprise/:path*',
        'compare-pricing/:path*',
        'apps',
        'apps/:path*',
        'customers',
        'customers/:path*',
        'terms',
        'privacy-policy',
        'halftone',
      ].flatMap((retiredPath) => [
        { source: `/${retiredPath}`, destination: '/', permanent: true },
        {
          source: `/:locale(${WEBSITE_LOCALE_LIST.join('|')})/${retiredPath}`,
          destination: '/:locale',
          permanent: true,
        },
      ]),
      {
        source: '/user-guide',
        destination: '/',
        permanent: true,
      },
      {
        source: '/user-guide/section/:folder/:slug*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/user-guide/:folder/:slug*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/developers',
        destination: '/',
        permanent: true,
      },
      {
        source: '/developers/section/:folder/:slug*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/developers/:folder/:slug*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/twenty-ui',
        destination: '/',
        permanent: true,
      },
      {
        source: '/twenty-ui/section/:folder/:slug*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/twenty-ui/:folder/:slug*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/resources/why-twenty',
        destination: '/why-twenty',
        permanent: true,
      },
      {
        source: '/story',
        destination: '/why-twenty',
        permanent: true,
      },
      {
        source: '/legal/privacy',
        destination: '/privacy-policy',
        permanent: true,
      },
      {
        source: '/legal/terms',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/legal/dpa',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/case-studies/9-dots-story',
        destination: '/customers/9dots',
        permanent: true,
      },
      {
        source: '/case-studies/act-immi-story',
        destination: '/customers/act-education',
        permanent: true,
      },
      {
        source: '/case-studies/:slug*',
        destination: '/customers',
        permanent: true,
      },
      {
        source: '/implementation-services',
        destination: '/partners',
        permanent: true,
      },
      {
        source: '/onboarding-packages',
        destination: '/partners',
        permanent: true,
      },
    ];
  },
};

export default withLinaria(nextConfig);

// Binds the Cloudflare dev context (R2 incremental cache, env vars) into
// `next dev` so local runs mirror the deployed OpenNext worker.
initOpenNextCloudflareForDev();
