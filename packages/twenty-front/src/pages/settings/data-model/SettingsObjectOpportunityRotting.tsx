import { useParams } from 'react-router-dom';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useOpportunityStageRottingConfig } from '@/object-record/record-show/opportunity/hooks/useOpportunityStageRottingConfig';
import { useUpdateOpportunityStageRottingDays } from '@/object-record/record-show/opportunity/hooks/useUpdateOpportunityStageRottingDays';
import { OpportunityRottingForm } from '@/settings/data-model/object-details/components/OpportunityRottingForm';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSectionSkeletonLoader } from '@/settings/components/SettingsSectionSkeletonLoader';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';

export const SettingsObjectOpportunityRotting = () => {
  const { objectNamePlural = '' } = useParams();
  const { enqueueSuccessSnackBar } = useSnackBar();

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const stageField = objectMetadataItem.fields.find(
    (field) => field.name === 'stage',
  );
  const options = (stageField?.options ?? []).map((option) => ({
    value: option.value,
    label: option.label,
  }));

  const { config, loading: rottingConfigLoading } =
    useOpportunityStageRottingConfig();
  const { updateRottingDays } = useUpdateOpportunityStageRottingDays();

  const handleSave = async (nextConfig: Record<string, number>) => {
    await updateRottingDays(nextConfig);
    enqueueSuccessSnackBar({ message: t`Rotting thresholds updated` });
  };

  return (
    <SettingsPageLayout
      title={t`Deal-Aging`}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.General),
        },
        {
          children: t`Objects`,
          href: getSettingsPath(SettingsPath.Objects),
        },
        {
          children: objectMetadataItem.labelPlural,
          href: getSettingsPath(SettingsPath.ObjectDetail, {
            objectNamePlural: objectNamePlural || objectMetadataItem.namePlural,
          }),
        },
        {
          children: t`Deal-Aging`,
        },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Rotting thresholds`}
            description={t`Number of days a deal can stay in a stage before it is flagged as rotting`}
          />
          {rottingConfigLoading ? (
            <SettingsSectionSkeletonLoader />
          ) : (
            <OpportunityRottingForm
              options={options}
              initialConfig={config}
              onSave={handleSave}
            />
          )}
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
