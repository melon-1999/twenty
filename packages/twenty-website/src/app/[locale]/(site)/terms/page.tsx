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
import { LegalDocument, TermsDocument } from '@/sections/legal';
import { Menu } from '@/sections/menu';

export const generateMetadata = buildRouteMetadata('terms');

export default async function TermsPage({
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
            { name: 'Terms of Service', path: '/terms' },
          ],
          locale,
        )}
      />
      <Menu />
      <main>
        <LegalDocument title={i18n._(msg`Terms of Service`)}>
          <TermsDocument />
        </LegalDocument>
      </main>
    </>
  );
}
