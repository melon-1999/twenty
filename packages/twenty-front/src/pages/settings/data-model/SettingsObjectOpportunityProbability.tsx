import { useParams } from 'react-router-dom';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useOpportunityStageProbabilityConfig } from '@/object-record/record-show/opportunity/hooks/useOpportunityStageProbabilityConfig';
import { useUpdateOpportunityStageProbability } from '@/object-record/record-show/opportunity/hooks/useUpdateOpportunityStageProbability';
import { OpportunityProbabilityForm } from '@/settings/data-model/object-details/components/OpportunityProbabilityForm';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSectionSkeletonLoader } from '@/settings/components/SettingsSectionSkeletonLoader';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';

export const SettingsObjectOpportunityProbability = () => {
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

  const { config, loading: probabilityConfigLoading } =
    useOpportunityStageProbabilityConfig();
  const { updateProbability } = useUpdateOpportunityStageProbability();

  const handleSave = async (nextConfig: Record<string, number>) => {
    await updateProbability(nextConfig);
    enqueueSuccessSnackBar({ message: t`Probability defaults updated` });
  };

  return (
    <SettingsPageLayout
      title={t`Probability`}
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
          children: t`Probability`,
        },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Probability defaults`}
            description={t`Default win probability applied to a deal when it enters a stage`}
          />
          {probabilityConfigLoading ? (
            <SettingsSectionSkeletonLoader />
          ) : (
            <OpportunityProbabilityForm
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
