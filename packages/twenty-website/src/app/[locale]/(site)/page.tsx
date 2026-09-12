import {
  getRouteI18n,
  type LocaleRouteParams,
} from '@/platform/i18n/get-route-i18n';
import { buildRouteMetadata } from '@/platform/seo';
import { Faq } from '@/sections/faq';
import { FeatureCards } from '@/sections/feature-cards';
import { HomeHero } from '@/sections/home-hero';
import { Menu } from '@/sections/menu';
import { Problem } from '@/sections/problem';
import { HomeStepper } from '@/sections/home-stepper';
import { ThreeCards } from '@/sections/three-cards';

export const generateMetadata = buildRouteMetadata('home');

export default async function HomePage({
  params,
}: {
  params: Promise<LocaleRouteParams>;
}) {
  await getRouteI18n(params);

  return (
    <>
      <Menu scheme="muted" />
      <main>
        <HomeHero />
        <Problem />
        <ThreeCards />
        <HomeStepper />
        <FeatureCards />
        <Faq />
      </main>
    </>
  );
}
