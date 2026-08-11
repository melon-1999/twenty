import { Separator } from '@/settings/components/Separator';
import {
  StyledSettingsCardDescription,
  StyledSettingsCardTextContainer,
  StyledSettingsCardTitle,
} from '@/settings/components/SettingsOptions/SettingsCardContentBase';
import { type ProductCapabilityDisplay } from '@/settings/product-capability/constants/productCapabilityCatalog';
import { useIsCapabilityEnabled } from '@/workspace/hooks/useIsCapabilityEnabled';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { Tag } from 'twenty-ui/data-display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledSettingsCardStatusContent = styled.div`
  align-items: center;
  background-color: ${themeCssVariables.background.secondary};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledTagContainer = styled.span`
  flex-shrink: 0;
`;

type SettingsProductCapabilityStatusRowProps = {
  capability: ProductCapabilityDisplay;
  divider?: boolean;
  // Core capabilities are always available and shouldn't depend on the
  // per-workspace availability check to decide their status label.
  alwaysIncluded?: boolean;
};

export const SettingsProductCapabilityStatusRow = ({
  capability,
  divider,
  alwaysIncluded = false,
}: SettingsProductCapabilityStatusRowProps) => {
  // Hooks can't be called conditionally, so we always call this even for
  // core capabilities and just ignore its result when alwaysIncluded is set.
  const isEnabled = useIsCapabilityEnabled(capability.key);
  const isIncluded = alwaysIncluded || isEnabled;

  return (
    <>
      <StyledSettingsCardStatusContent>
        <StyledSettingsCardTextContainer>
          <StyledSettingsCardTitle>{t(capability.label)}</StyledSettingsCardTitle>
          <StyledSettingsCardDescription>
            {t(capability.description)}
          </StyledSettingsCardDescription>
        </StyledSettingsCardTextContainer>
        <StyledTagContainer>
          {isIncluded ? (
            <Tag color="green" text={t`Included`} />
          ) : (
            <Tag color="gray" text={t`Not included`} />
          )}
        </StyledTagContainer>
      </StyledSettingsCardStatusContent>
      {divider && <Separator />}
    </>
  );
};
