import {
  getRouteI18n,
  type LocaleRouteParams,
} from '@/platform/i18n/get-route-i18n';
import { buildRouteMetadata } from '@/platform/seo';
import { ComparePage } from '@/sections/compare/ComparePage';
import { COMPARISONS } from '@/sections/compare/compare-data';
import { Menu } from '@/sections/menu';

export const generateMetadata = buildRouteMetadata('comparePricingPipedrive');

export default async function ComparePipedrivePricingPage({
  params,
}: {
  params: Promise<LocaleRouteParams>;
}) {
  await getRouteI18n(params);

  return (
    <>
      <Menu scheme="muted" />
      <main>
        <ComparePage comparison={COMPARISONS.pipedrive} />
      </main>
    </>
  );
}
