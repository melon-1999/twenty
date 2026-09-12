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
  'packages/twenty-emails/src/components/Footer.tsx',
  'packages/twenty-emails/src/components/Logo.tsx',
  'packages/twenty-emails/src/components/BaseHead.tsx',
  'packages/twenty-server/src/engine/core-modules/well-known/utils/build-mcp-server-card.util.ts',
  'packages/twenty-server/src/engine/api/mcp/constants/mcp-server-info.const.ts',
];

const FORBIDDEN_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'twentyhq reference', pattern: /twentyhq/i },
  { label: 'twenty.com link', pattern: /twenty\.com/i },
  { label: 'github.com link', pattern: /github\.com/i },
  { label: 'discord link', pattern: /discord/i },
  { label: 'ChatGPT Twenty app link', pattern: /chatgpt\.com\/apps/i },
  { label: 'visible "Powered by" credit', pattern: /powered by/i },
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
      const source = stripLineComments(fs.readFileSync(absolutePath, 'utf-8'));

      const leaks = FORBIDDEN_PATTERNS.filter(({ pattern }) =>
        pattern.test(source),
      ).map(({ label }) => label);

      expect(leaks).toEqual([]);
    },
  );
});
