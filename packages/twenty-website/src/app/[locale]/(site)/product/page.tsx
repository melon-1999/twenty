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
import { Faq } from '@/sections/faq';
import { Menu } from '@/sections/menu';
import { ProductFeature } from '@/sections/product-feature';
import { ProductHero } from '@/sections/product-hero';
import { ProductSignoff } from '@/sections/product-signoff';
import { ProductStepper } from '@/sections/product-stepper';
import { ProductThreeCards } from '@/sections/three-cards';
import { TrustedBy } from '@/sections/trusted-by';

export const generateMetadata = buildRouteMetadata('product');

export default async function ProductPage({
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
            { name: 'Product', path: '/product' },
          ],
          locale,
        )}
      />
      <Menu />
      <main>
        <ProductHero />
        <TrustedBy />
        <ProductFeature />
        <ProductThreeCards />
        <ProductStepper />
        <ProductSignoff />
        <Faq />
      </main>
    </>
  );
}
