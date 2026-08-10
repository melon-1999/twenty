import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsFeaturesContent } from '@/settings/product-capability/components/SettingsFeaturesContent';
import { t } from '@lingui/core/macro';

export const SettingsFeatures = () => {
  return (
    <SettingsPageLayout
      title={t`Features`}
      links={[{ children: t`Workspace` }, { children: t`Features` }]}
    >
      <SettingsPageContainer>
        <SettingsFeaturesContent />
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
