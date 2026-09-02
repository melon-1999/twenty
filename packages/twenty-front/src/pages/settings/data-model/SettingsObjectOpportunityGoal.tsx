import { useParams } from 'react-router-dom';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useOpportunityMonthlyGoal } from '@/object-record/record-show/opportunity/hooks/useOpportunityMonthlyGoal';
import { useUpdateOpportunityMonthlyGoal } from '@/object-record/record-show/opportunity/hooks/useUpdateOpportunityMonthlyGoal';
import { OpportunityGoalForm } from '@/settings/data-model/object-details/components/OpportunityGoalForm';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSectionSkeletonLoader } from '@/settings/components/SettingsSectionSkeletonLoader';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';

export const SettingsObjectOpportunityGoal = () => {
  const { objectNamePlural = '' } = useParams();
  const { enqueueSuccessSnackBar } = useSnackBar();

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const { config, loading } = useOpportunityMonthlyGoal();
  const { updateMonthlyGoal } = useUpdateOpportunityMonthlyGoal();

  const handleSave = async (targetAmount: number) => {
    await updateMonthlyGoal(targetAmount);
    enqueueSuccessSnackBar({ message: t`Verkaufsziel aktualisiert` });
  };

  return (
    <SettingsPageLayout
      title={t`Verkaufsziel`}
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
          children: t`Verkaufsziel`,
        },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Monatsziel`}
            description={t`Monatliches Umsatzziel fürs Team; der Fortschritt zählt gewonnene Deals des Monats`}
          />
          {loading ? (
            <SettingsSectionSkeletonLoader />
          ) : (
            <OpportunityGoalForm
              initialTargetAmount={config?.targetAmount ?? null}
              onSave={handleSave}
            />
          )}
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
