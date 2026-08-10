import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { fireEvent, render, screen } from '@testing-library/react';

import { PRODUCT_CAPABILITY_DISPLAY_CATALOG } from '@/settings/product-capability/constants/productCapabilityCatalog';
import { SettingsProductCapabilityToggleRow } from '@/settings/product-capability/components/SettingsProductCapabilityToggleRow';
import { useUpdateWorkspaceCapability } from '@/settings/product-capability/hooks/useUpdateWorkspaceCapability';
import { useIsCapabilityEnabled } from '@/workspace/hooks/useIsCapabilityEnabled';
import { ProductCapabilityKey } from '~/generated-metadata/graphql';

jest.mock(
  '@/settings/product-capability/hooks/useUpdateWorkspaceCapability',
  () => ({
    useUpdateWorkspaceCapability: jest.fn(),
  }),
);

jest.mock('@/workspace/hooks/useIsCapabilityEnabled', () => ({
  useIsCapabilityEnabled: jest.fn(),
}));

const mockedUseUpdateWorkspaceCapability =
  useUpdateWorkspaceCapability as jest.MockedFunction<
    typeof useUpdateWorkspaceCapability
  >;

const mockedUseIsCapabilityEnabled = useIsCapabilityEnabled as jest.Mock;

const dashboardsCapability =
  PRODUCT_CAPABILITY_DISPLAY_CATALOG[ProductCapabilityKey.DASHBOARDS];

const renderToggleRow = ({ disabled = false }: { disabled?: boolean } = {}) =>
  render(
    <I18nProvider i18n={i18n}>
      <SettingsProductCapabilityToggleRow
        capability={dashboardsCapability}
        disabled={disabled}
      />
    </I18nProvider>,
  );

describe('SettingsProductCapabilityToggleRow', () => {
  const mockUpdateWorkspaceCapability = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateWorkspaceCapability.mockResolvedValue(true);
  });

  it('disables the toggle while a capability update is in flight', () => {
    mockedUseIsCapabilityEnabled.mockReturnValue(false);
    mockedUseUpdateWorkspaceCapability.mockReturnValue({
      updateWorkspaceCapability: mockUpdateWorkspaceCapability,
      isUpdatingCapability: true,
    });

    renderToggleRow();

    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not call updateWorkspaceCapability when clicked while updating', () => {
    mockedUseIsCapabilityEnabled.mockReturnValue(false);
    mockedUseUpdateWorkspaceCapability.mockReturnValue({
      updateWorkspaceCapability: mockUpdateWorkspaceCapability,
      isUpdatingCapability: true,
    });

    renderToggleRow();

    fireEvent.click(screen.getByRole('switch'));

    expect(mockUpdateWorkspaceCapability).not.toHaveBeenCalled();
  });

  it('enables the toggle and reflects checked state when not updating', () => {
    mockedUseIsCapabilityEnabled.mockReturnValue(true);
    mockedUseUpdateWorkspaceCapability.mockReturnValue({
      updateWorkspaceCapability: mockUpdateWorkspaceCapability,
      isUpdatingCapability: false,
    });

    renderToggleRow();

    const toggle = screen.getByRole('switch');
    expect(toggle).not.toHaveAttribute('aria-disabled', 'true');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('renders checked and locked when disabled (core capability)', () => {
    mockedUseIsCapabilityEnabled.mockReturnValue(false);
    mockedUseUpdateWorkspaceCapability.mockReturnValue({
      updateWorkspaceCapability: mockUpdateWorkspaceCapability,
      isUpdatingCapability: false,
    });

    renderToggleRow({ disabled: true });

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });
});
