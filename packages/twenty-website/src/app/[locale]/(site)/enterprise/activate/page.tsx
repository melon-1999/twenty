import {
  getRouteI18n,
  type LocaleRouteParams,
} from '@/platform/i18n/get-route-i18n';
import { buildRouteMetadata } from '@/platform/seo';
import {
  EnterpriseActivateHero,
  EnterpriseActivatePanel,
} from '@/sections/enterprise-activate';
import { Menu } from '@/sections/menu';

export const generateMetadata = buildRouteMetadata('enterpriseActivate');

export default async function EnterpriseActivatePage({
  params,
}: {
  params: Promise<LocaleRouteParams>;
}) {
  await getRouteI18n(params);

  return (
    <>
      <Menu scheme="muted" />
      <main>
        <EnterpriseActivateHero />
        <EnterpriseActivatePanel />
      </main>
    </>
  );
}
