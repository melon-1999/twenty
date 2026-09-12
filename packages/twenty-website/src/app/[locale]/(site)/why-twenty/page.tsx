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
import { WhyTwentyEditorials } from '@/sections/why-twenty-editorial';
import { WhyTwentyHero } from '@/sections/why-twenty-hero';
import { WhyTwentyMarquee } from '@/sections/why-twenty-marquee';
import { WhyTwentySignoff } from '@/sections/why-twenty-signoff';

export const generateMetadata = buildRouteMetadata('whyTwenty');

export default async function WhyTwentyPage({
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
            { name: 'Why Twenty', path: '/why-twenty' },
          ],
          locale,
        )}
      />
      <Menu scheme="dark" />
      <main>
        <WhyTwentyHero />
        <WhyTwentyEditorials />
        <WhyTwentyMarquee />
        <WhyTwentySignoff />
      </main>
    </>
  );
}
