import { msg } from '@lingui/core/macro';

import {
  getRouteI18n,
  type LocaleRouteParams,
} from '@/platform/i18n/get-route-i18n';
import { getServerI18n } from '@/platform/i18n/get-server-i18n';
import { resolveLocaleParam } from '@/platform/i18n/resolve-locale-param';
import {
  buildBreadcrumbListJsonLd,
  buildRouteMetadata,
  JsonLd,
} from '@/platform/seo';
import { LegalDocument, PrivacyPolicyDocument } from '@/sections/legal';
import { Menu } from '@/sections/menu';

export const generateMetadata = buildRouteMetadata('privacyPolicy');

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<LocaleRouteParams>;
}) {
  await getRouteI18n(params);
  const i18n = getServerI18n();
  const locale = resolveLocaleParam((await params).locale);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbListJsonLd(
          [
            { name: 'Home', path: '/' },
            { name: 'Privacy Policy', path: '/privacy-policy' },
          ],
          locale,
        )}
      />
      <Menu />
      <main>
        <LegalDocument title={i18n._(msg`Privacy Policy`)}>
          <PrivacyPolicyDocument />
        </LegalDocument>
      </main>
    </>
  );
}
