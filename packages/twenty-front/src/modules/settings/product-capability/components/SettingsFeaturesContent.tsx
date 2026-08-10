import { SettingsProductCapabilityToggleRow } from '@/settings/product-capability/components/SettingsProductCapabilityToggleRow';
import { PRODUCT_CAPABILITY_DISPLAY_CATALOG } from '@/settings/product-capability/constants/productCapabilityCatalog';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { Section } from 'twenty-ui/layout';
import { Card } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';

const StyledSectionsContainer = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[8]};
`;

export const SettingsFeaturesContent = () => {
  const allCapabilities = Object.values(PRODUCT_CAPABILITY_DISPLAY_CATALOG);
  const optionalCapabilities = allCapabilities.filter(
    (capability) => !capability.isCore,
  );
  const coreCapabilities = allCapabilities.filter(
    (capability) => capability.isCore,
  );

  return (
    <StyledSectionsContainer>
      <Section>
        <H2Title
          title={t`Optional features`}
          description={t`Turn features on or off for your workspace.`}
        />
        <Card rounded backgroundColor={themeCssVariables.background.secondary}>
          {optionalCapabilities.map((capability, index) => (
            <SettingsProductCapabilityToggleRow
              key={capability.key}
              capability={capability}
              divider={index < optionalCapabilities.length - 1}
            />
          ))}
        </Card>
      </Section>

      <Section>
        <H2Title
          title={t`Core features`}
          description={t`Always included in every workspace and cannot be turned off.`}
        />
        <Card rounded backgroundColor={themeCssVariables.background.secondary}>
          {coreCapabilities.map((capability, index) => (
            <SettingsProductCapabilityToggleRow
              key={capability.key}
              capability={capability}
              divider={index < coreCapabilities.length - 1}
              disabled
            />
          ))}
        </Card>
      </Section>
    </StyledSectionsContainer>
  );
};
