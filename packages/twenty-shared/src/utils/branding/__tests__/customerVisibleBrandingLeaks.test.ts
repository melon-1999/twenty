import * as fs from 'fs';
import * as path from 'path';

// Regression test against Twenty/GitHub/OSS branding leaking back into
// customer-visible surfaces. Deliberately scoped to a fixed list of
// user-visible source files: internal technical names, license texts and
// operator-only surfaces stay legitimate and are not scanned.
const REPO_ROOT = path.resolve(__dirname, '../../../../../..');

const CUSTOMER_VISIBLE_FILES = [
  'packages/twenty-front/index.html',
  'packages/twenty-front/public/manifest.json',
  'packages/twenty-front/src/modules/settings/hooks/useSettingsNavigationItems.tsx',
  'packages/twenty-front/src/pages/settings/legal/SettingsLegal.tsx',
  'packages/twenty-front/src/modules/auth/sign-in-up/components/FooterNote.tsx',
  'packages/twenty-front/src/pages/auth/SignInUp.tsx',
  'packages/twenty-front/src/pages/onboarding/InstallAppsContent.tsx',
  'packages/twenty-front/src/pages/onboarding/ImportContacts.tsx',
  'packages/twenty-front/src/modules/settings/mcp-and-apis/constants/McpSetup.ts',
  'packages/twenty-front/src/modules/settings/mcp-and-apis/utils/mcpSetup.ts',
  'packages/twenty-front/src/modules/settings/mcp-and-apis/utils/buildMcpSetupCategories.tsx',
  'packages/twenty-front/src/pages/settings/applications/utils/getStandardApplicationDescription.ts',
  'packages/twenty-front/src/pages/settings/applications/utils/getCustomApplicationDescription.ts',
  'packages/twenty-front/src/modules/settings/data-model/constants/SettingsCompositeFieldTypeConfigs.ts',
  'packages/twenty-shared/src/constants/DocumentationBaseUrl.ts',
  'packages/twenty-front/src/modules/workflow/workflow-steps/workflow-actions/form-action/components/WorkflowEditActionFormBuilder.tsx',
  'packages/twenty-emails/src/components/Footer.tsx',
  'packages/twenty-emails/src/components/Logo.tsx',
  'packages/twenty-emails/src/components/BaseHead.tsx',
  'packages/twenty-server/src/engine/core-modules/well-known/utils/build-mcp-server-card.util.ts',
  'packages/twenty-server/src/engine/api/mcp/constants/mcp-server-info.const.ts',
  'packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/constants/standard-command-menu-item.constant.ts',
  'packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/agent-metadata/create-standard-flat-agent-metadata.util.ts',
  'packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/page-layout-widget/compute-my-first-dashboard-widgets.util.ts',
  'packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/utils/prefill-people.util.ts',
  'packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/utils/prefill-workflows.util.ts',
  'packages/twenty-server/src/engine/core-modules/well-known/utils/build-api-catalog.util.ts',
  // Dev/demo seeds render directly into the customer navigation and dashboards
  'packages/twenty-server/src/engine/workspace-manager/dev-seeder/core/utils/get-navigation-menu-item-data-seeds.util.ts',
  'packages/twenty-server/src/engine/workspace-manager/dev-seeder/core/utils/get-page-layout-widget-data-seeds.util.ts',
  'packages/twenty-server/src/engine/workspace-manager/dev-seeder/core/utils/get-page-layout-widget-data-seeds-v2.util.ts',
  'packages/twenty-server/src/engine/workspace-manager/dev-seeder/core/constants/navigation-menu-item-seeds.constant.ts',
  // Marketing website: navbar, footer, central URLs, SEO, public well-known
  'packages/twenty-website/src/sections/menu/data/menu.ts',
  'packages/twenty-website/src/sections/footer/footer.data.ts',
  'packages/twenty-website/src/sections/footer/FooterBottom.tsx',
  'packages/twenty-website/src/platform/site-urls.ts',
  'packages/twenty-website/src/platform/seo/build-page-metadata.ts',
  'packages/twenty-website/src/platform/seo/get-site-url.ts',
  'packages/twenty-website/src/platform/routing/static-website-routes.ts',
  'packages/twenty-website/src/sections/home-hero/HomeHero.tsx',
  'packages/twenty-website/src/sections/faq/faq.data.ts',
  'packages/twenty-website/src/sections/pricing-plans/plans-data.ts',
  'packages/twenty-website/src/sections/pricing-plan-table/plan-table-data.ts',
  'packages/twenty-website/src/sections/case-study-detail/CaseStudyArticleNav.tsx',
  'packages/twenty-website/src/app/[locale]/(site)/page.tsx',
  'packages/twenty-website/public/llms.txt',
  'packages/twenty-website/public/.well-known/security.txt',
  'packages/twenty-website/public/.well-known/mcp/server-card.json',
  'packages/twenty-website/next.config.ts',
  'packages/twenty-website/src/sections/menu/Menu.tsx',
  'packages/twenty-website/src/sections/three-cards/three-cards.data.ts',
  'packages/twenty-website/src/sections/home-stepper/data/stepper.data.ts',
  'packages/twenty-website/src/sections/feature-cards/feature-cards.data.ts',
  'packages/twenty-website/src/sections/faq/Faq.tsx',
  'packages/twenty-website/src/app/[locale]/(site)/product/page.tsx',
  'packages/twenty-website/src/app/[locale]/(site)/pricing/page.tsx',
  'packages/twenty-website/src/app/.well-known/api-catalog/route.ts',
  'packages/twenty-website/src/app-preview/data/sidebar-config.ts',
  'packages/twenty-website/src/app-preview/primitives/FaviconLogo.tsx',
  'packages/twenty-website/src/sections/product-feature/ImportVisual/ImportVisual.tsx',
  'packages/twenty-front/src/modules/settings/billing/components/AddPaymentMethodForm.tsx',
  'packages/twenty-front/src/modules/settings/billing/hooks/useHandleCheckoutSession.ts',
  'packages/twenty-front/src/modules/settings/billing/hooks/useSubmitSubscriptionPayment.ts',
  'packages/twenty-front/src/modules/settings/billing/hooks/useEndSubscriptionTrialPeriod.ts',
  'packages/twenty-front/src/modules/settings/billing/hooks/useBillingPortalSession.ts',
  'packages/twenty-front/src/modules/settings/billing/constants/SettingsBillingPlanComparisonRows.ts',
];

const FORBIDDEN_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'twentyhq reference', pattern: /twentyhq/i },
  { label: 'twenty.com link', pattern: /twenty\.com/i },
  { label: 'github reference', pattern: /github/i },
  { label: 'discord link', pattern: /discord/i },
  { label: 'ChatGPT Twenty app link', pattern: /chatgpt\.com\/apps/i },
  { label: 'visible "Powered by" credit', pattern: /powered by/i },
  {
    label: 'twenty-icons.com service reference',
    pattern: /twenty-icons\.com/i,
  },
  {
    label: 'upstream Cal.com booking form (centralise in contact-cal-config)',
    pattern: /cal\.com\/forms\/[a-z0-9]/i,
  },
  {
    label: 'GitHub star-history widget or navigation item',
    pattern: /star[-\s]history/i,
  },
];

const stripLineComments = (source: string): string =>
  source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');

describe('customer-visible branding leaks', () => {
  it.each(CUSTOMER_VISIBLE_FILES)(
    'should not leak upstream branding in %s',
    (relativeFilePath) => {
      const absolutePath = path.join(REPO_ROOT, relativeFilePath);
      expect(fs.existsSync(absolutePath)).toBe(true);
      const source = stripLineComments(fs.readFileSync(absolutePath, 'utf-8'));

      const leaks = FORBIDDEN_PATTERNS.filter(({ pattern }) =>
        pattern.test(source),
      ).map(({ label }) => label);

      expect(leaks).toEqual([]);
    },
  );
});
