import { useParams } from 'react-router-dom';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useTaskReminders } from '@/settings/data-model/task-reminders/hooks/useTaskReminders';
import { useUpdateTaskReminders } from '@/settings/data-model/task-reminders/hooks/useUpdateTaskReminders';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSectionSkeletonLoader } from '@/settings/components/SettingsSectionSkeletonLoader';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { CoreObjectNameSingular, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { Toggle } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { H2Title } from 'twenty-ui/typography';

export const SettingsObjectTaskReminders = () => {
  const { objectNamePlural = '' } = useParams();
  const { enqueueSuccessSnackBar } = useSnackBar();

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Task,
  });

  const { enabled, loading } = useTaskReminders();
  const { updateTaskReminders } = useUpdateTaskReminders();

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [hasSeeded, setHasSeeded] = useState(false);

  if (!loading && !hasSeeded) {
    setHasSeeded(true);
    setRemindersEnabled(enabled);
  }

  const handleToggle = async (next: boolean) => {
    setRemindersEnabled(next);
    await updateTaskReminders(next);
    enqueueSuccessSnackBar({ message: t`Aktivitäts-Reminder aktualisiert` });
  };

  return (
    <SettingsPageLayout
      title={t`Aktivitäts-Reminder`}
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
          children: t`Aktivitäts-Reminder`,
        },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Aktivitäts-Reminder`}
            description={t`Erinnerungen für fällige Aufgaben aktivieren oder deaktivieren`}
          />
          {loading ? (
            <SettingsSectionSkeletonLoader />
          ) : (
            <Toggle
              value={remindersEnabled}
              onChange={(next) => {
                handleToggle(next);
              }}
              aria-label={t`Aktivitäts-Reminder`}
            />
          )}
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
