import {
  getRouteI18n,
  type LocaleRouteParams,
} from '@/platform/i18n/get-route-i18n';
import { resolveLocaleParam } from '@/platform/i18n/resolve-locale-param';
import {
  buildBreadcrumbListJsonLd,
  buildRouteMetadata,
  JsonLd,
} from '@/platform/seo';
import { Menu } from '@/sections/menu';
import { ReleasesFeed } from '@/sections/releases-feed';
import { ReleasesHero } from '@/sections/releases-hero';

export const generateMetadata = buildRouteMetadata('releases');

// Hero only for now; the release feed lands below it as its port arrives.
export default async function ReleasesPage({
  params,
}: {
  params: Promise<LocaleRouteParams>;
}) {
  await getRouteI18n(params);
  const locale = resolveLocaleParam((await params).locale);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbListJsonLd(
          [
            { name: 'Home', path: '/' },
            { name: 'Releases', path: '/releases' },
          ],
          locale,
        )}
      />
      <Menu />
      <main>
        <ReleasesHero />
        <ReleasesFeed locale={locale} />
      </main>
    </>
  );
}
