import {
  getRouteI18n,
  type LocaleRouteParams,
} from '@/platform/i18n/get-route-i18n';
import { buildRouteMetadata } from '@/platform/seo';
import { PricingStateProvider } from '@/pricing-state';
import { Faq } from '@/sections/faq';
import { Menu } from '@/sections/menu';
import { PlanTable } from '@/sections/pricing-plan-table';
import { PricingPlans } from '@/sections/pricing-plans';

export const generateMetadata = buildRouteMetadata('pricing');

export default async function PricingPage({
  params,
}: {
  params: Promise<LocaleRouteParams>;
}) {
  await getRouteI18n(params);

  return (
    <>
      <Menu scheme="muted" />
      <main>
        <PricingStateProvider>
          <PricingPlans />
          <PlanTable />
        </PricingStateProvider>
        <Faq />
      </main>
    </>
  );
}
