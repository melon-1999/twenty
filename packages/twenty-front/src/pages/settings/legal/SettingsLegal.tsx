import { SettingsCard } from '@/settings/components/SettingsCard';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useContext } from 'react';
import { PRODUCT_BRANDING, PRODUCT_VERSION } from 'twenty-shared/constants';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { IconDownload, IconFileText, IconLock } from 'twenty-ui/icon';
import { Section } from 'twenty-ui/layout';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';

const StyledCardLink = styled.a`
  display: block;
  min-width: 0;
  text-decoration: none;

  & + & {
    margin-top: ${themeCssVariables.spacing[2]};
  }
`;

export const SettingsLegal = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <SettingsPageLayout
      title={t`Legal`}
      links={[
        {
          children: t`Other`,
          href: getSettingsPath(SettingsPath.Legal),
        },
        { children: t`Legal` },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Legal documents`}
            description={t`How we handle your data and the terms that apply to your use of this product.`}
          />
          <StyledCardLink
            href={PRODUCT_BRANDING.legalPrivacyUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SettingsCard
              Icon={
                <IconLock
                  size={theme.icon.size.md}
                  stroke={theme.icon.stroke.sm}
                />
              }
              title={t`Privacy Policy`}
            />
          </StyledCardLink>
          <StyledCardLink
            href={PRODUCT_BRANDING.legalTermsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SettingsCard
              Icon={
                <IconFileText
                  size={theme.icon.size.md}
                  stroke={theme.icon.stroke.sm}
                />
              }
              title={t`Terms of Service`}
            />
          </StyledCardLink>
        </Section>
        <Section>
          <H2Title
            title={t`Software licenses`}
            description={t`${PRODUCT_BRANDING.name} by ${PRODUCT_BRANDING.legalEntityLine} (version ${PRODUCT_VERSION}) is based on software licensed under the GNU AGPL-3.0, with MIT-licensed components. The complete corresponding source code of this version is available for download.`}
          />
          <StyledCardLink
            href={PRODUCT_BRANDING.sourceDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SettingsCard
              Icon={
                <IconDownload
                  size={theme.icon.size.md}
                  stroke={theme.icon.stroke.sm}
                />
              }
              title={t`Download source code (version ${PRODUCT_VERSION})`}
            />
          </StyledCardLink>
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
