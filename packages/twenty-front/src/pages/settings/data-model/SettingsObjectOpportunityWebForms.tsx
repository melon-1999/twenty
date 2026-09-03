import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { v4 } from 'uuid';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSectionSkeletonLoader } from '@/settings/components/SettingsSectionSkeletonLoader';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useUpdateWebForms } from '@/settings/data-model/web-forms/hooks/useUpdateWebForms';
import { useWebForms } from '@/settings/data-model/web-forms/hooks/useWebForms';
import { type WebForm } from '@/settings/data-model/web-forms/types/WebForm';
import { Select } from '@/ui/input/components/Select';
import { TextInput } from '@/ui/input/components/TextInput';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { CoreObjectNameSingular, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { Button, Toggle } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const StyledFormsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledFormCard = styled.div`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledFormCardHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledFormCardHeaderActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledFieldsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledFieldContainer = styled.div`
  flex: 1;
  min-width: 200px;
`;

const StyledPublicUrlRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPublicUrl = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const SettingsObjectOpportunityWebForms = () => {
  const { objectNamePlural = '' } = useParams();
  const { enqueueSuccessSnackBar } = useSnackBar();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const stageOptions = [
    ...(objectMetadataItem.fields.find((field) => field.name === 'stage')
      ?.options ?? []),
  ]
    .sort((a, b) => a.position - b.position)
    .map((option) => ({ label: option.label, value: option.value }));

  const { webForms, loading } = useWebForms();
  const { updateWebForms } = useUpdateWebForms();

  const [forms, setForms] = useState<WebForm[]>([]);
  const [hasSeeded, setHasSeeded] = useState(false);

  if (!loading && !hasSeeded) {
    setHasSeeded(true);
    setForms(webForms);
  }

  const handleAddForm = () => {
    setForms((prev) => [
      ...prev,
      {
        id: v4(),
        title: 'Neues Formular',
        description: '',
        enabled: true,
        stage: stageOptions[0]?.value ?? 'NEW',
        dealNameTemplate: 'Web-Lead: {firstName} {lastName}',
        thankYouText: 'Danke für deine Anfrage.',
      },
    ]);
  };

  const handleUpdateForm = (id: string, patch: Partial<WebForm>) => {
    setForms((prev) =>
      prev.map((form) => (form.id === id ? { ...form, ...patch } : form)),
    );
  };

  const handleDeleteForm = (id: string) => {
    setForms((prev) => prev.filter((form) => form.id !== id));
  };

  const handleCopyLink = async (form: WebForm) => {
    const url = `${REACT_APP_SERVER_BASE_URL}/forms/${currentWorkspace?.id}/${form.id}`;
    await navigator.clipboard.writeText(url);
    enqueueSuccessSnackBar({ message: t`Link kopiert` });
  };

  const handleSave = async () => {
    await updateWebForms(forms);
    enqueueSuccessSnackBar({ message: t`Web-Formulare aktualisiert` });
  };

  return (
    <SettingsPageLayout
      title={t`Web-Formulare`}
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
          children: t`Web-Formulare`,
        },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Web-Formulare`}
            description={t`Formulare für die Lead-Erfassung über die Website verwalten`}
          />
          {loading ? (
            <SettingsSectionSkeletonLoader />
          ) : (
            <StyledFormsList>
              {forms.map((form) => {
                const publicUrl = `${REACT_APP_SERVER_BASE_URL}/forms/${currentWorkspace?.id}/${form.id}`;

                return (
                  <StyledFormCard key={form.id}>
                    <StyledFormCardHeader>
                      <Toggle
                        value={form.enabled}
                        onChange={(enabled) =>
                          handleUpdateForm(form.id, { enabled })
                        }
                        aria-label={t`Aktiviert`}
                      />
                      <StyledFormCardHeaderActions>
                        <Button
                          title={t`Löschen`}
                          accent="danger"
                          onClick={() => handleDeleteForm(form.id)}
                        />
                      </StyledFormCardHeaderActions>
                    </StyledFormCardHeader>
                    <StyledFieldsRow>
                      <StyledFieldContainer>
                        <TextInput
                          label={t`Titel`}
                          fullWidth
                          value={form.title}
                          onChange={(text) =>
                            handleUpdateForm(form.id, { title: text })
                          }
                        />
                      </StyledFieldContainer>
                      <StyledFieldContainer>
                        <Select
                          dropdownId={`web-form-stage-${form.id}`}
                          label={t`Phase`}
                          fullWidth
                          value={form.stage}
                          options={stageOptions}
                          onChange={(stage) =>
                            handleUpdateForm(form.id, { stage })
                          }
                        />
                      </StyledFieldContainer>
                    </StyledFieldsRow>
                    <StyledFieldContainer>
                      <TextInput
                        label={t`Beschreibung`}
                        fullWidth
                        value={form.description}
                        onChange={(text) =>
                          handleUpdateForm(form.id, { description: text })
                        }
                      />
                    </StyledFieldContainer>
                    <StyledFieldContainer>
                      <TextInput
                        label={t`Deal-Namensvorlage`}
                        fullWidth
                        value={form.dealNameTemplate}
                        onChange={(text) =>
                          handleUpdateForm(form.id, {
                            dealNameTemplate: text,
                          })
                        }
                      />
                    </StyledFieldContainer>
                    <StyledFieldContainer>
                      <TextInput
                        label={t`Dankestext`}
                        fullWidth
                        value={form.thankYouText}
                        onChange={(text) =>
                          handleUpdateForm(form.id, { thankYouText: text })
                        }
                      />
                    </StyledFieldContainer>
                    <StyledPublicUrlRow>
                      <StyledPublicUrl>{publicUrl}</StyledPublicUrl>
                      <Button
                        title={t`Kopieren`}
                        variant="secondary"
                        onClick={() => {
                          handleCopyLink(form);
                        }}
                      />
                    </StyledPublicUrlRow>
                  </StyledFormCard>
                );
              })}
              <StyledFooter>
                <Button title={t`Neues Formular`} onClick={handleAddForm} />
              </StyledFooter>
            </StyledFormsList>
          )}
        </Section>
        {!loading && (
          <StyledFooter>
            <Button
              title={t`Speichern`}
              variant="primary"
              accent="blue"
              onClick={() => {
                handleSave();
              }}
            />
          </StyledFooter>
        )}
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
