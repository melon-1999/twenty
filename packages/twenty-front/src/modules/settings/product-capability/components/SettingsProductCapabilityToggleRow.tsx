import { SettingsOptionCardContentToggle } from '@/settings/components/SettingsOptions/SettingsOptionCardContentToggle';
import { type ProductCapabilityDisplay } from '@/settings/product-capability/constants/productCapabilityCatalog';
import { useUpdateWorkspaceCapability } from '@/settings/product-capability/hooks/useUpdateWorkspaceCapability';
import { useIsCapabilityEnabled } from '@/workspace/hooks/useIsCapabilityEnabled';
import { t } from '@lingui/core/macro';

type SettingsProductCapabilityToggleRowProps = {
  capability: ProductCapabilityDisplay;
  divider?: boolean;
  disabled?: boolean;
};

export const SettingsProductCapabilityToggleRow = ({
  capability,
  divider,
  disabled = false,
}: SettingsProductCapabilityToggleRowProps) => {
  const isEnabled = useIsCapabilityEnabled(capability.key);
  const { updateWorkspaceCapability, isUpdatingCapability } =
    useUpdateWorkspaceCapability();

  const handleChange = async (value: boolean) => {
    if (disabled || isUpdatingCapability) {
      return;
    }

    await updateWorkspaceCapability(capability.key, value);
  };

  return (
    <SettingsOptionCardContentToggle
      title={t(capability.label)}
      description={t(capability.description)}
      checked={disabled ? true : isEnabled}
      onChange={handleChange}
      toggleCentered={false}
      divider={divider}
      disabled={disabled || isUpdatingCapability}
    />
  );
};
