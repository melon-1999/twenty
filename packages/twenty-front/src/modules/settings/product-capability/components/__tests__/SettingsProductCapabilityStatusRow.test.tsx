import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';

import { SettingsProductCapabilityStatusRow } from '@/settings/product-capability/components/SettingsProductCapabilityStatusRow';
import { PRODUCT_CAPABILITY_DISPLAY_CATALOG } from '@/settings/product-capability/constants/productCapabilityCatalog';
import { useUpdateWorkspaceCapability } from '@/settings/product-capability/hooks/useUpdateWorkspaceCapability';
import { useIsCapabilityEnabled } from '@/workspace/hooks/useIsCapabilityEnabled';
import { ProductCapabilityKey } from '~/generated-metadata/graphql';

jest.mock('@/workspace/hooks/useIsCapabilityEnabled', () => ({
  useIsCapabilityEnabled: jest.fn(),
}));

// The read-only row must never touch the mutation hook — mocking it here lets
// us assert it is never invoked, and would surface a hard failure (real hook
// needs Apollo context) if the component still imported and called it.
const mockUpdateWorkspaceCapability = jest.fn();
jest.mock(
  '@/settings/product-capability/hooks/useUpdateWorkspaceCapability',
  () => ({
    useUpdateWorkspaceCapability: jest.fn(),
  }),
);

const mockedUseIsCapabilityEnabled = useIsCapabilityEnabled as jest.Mock;
const mockedUseUpdateWorkspaceCapability =
  useUpdateWorkspaceCapability as jest.MockedFunction<
    typeof useUpdateWorkspaceCapability
  >;

const dashboardsCapability =
  PRODUCT_CAPABILITY_DISPLAY_CATALOG[ProductCapabilityKey.DASHBOARDS];

const renderStatusRow = (
  { alwaysIncluded }: { alwaysIncluded?: boolean } = {},
) =>
  render(
    <I18nProvider i18n={i18n}>
      <SettingsProductCapabilityStatusRow
        capability={dashboardsCapability}
        alwaysIncluded={alwaysIncluded}
      />
    </I18nProvider>,
  );

describe('SettingsProductCapabilityStatusRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render a toggle/switch', () => {
    mockedUseIsCapabilityEnabled.mockReturnValue(true);

    renderStatusRow();

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('shows an "Included" status when the capability is enabled', () => {
    mockedUseIsCapabilityEnabled.mockReturnValue(true);

    renderStatusRow();

    expect(screen.getByText('Included')).toBeInTheDocument();
    expect(screen.queryByText('Not included')).not.toBeInTheDocument();
  });

  it('shows a "Not included" status when the capability is disabled', () => {
    mockedUseIsCapabilityEnabled.mockReturnValue(false);

    renderStatusRow();

    expect(screen.getByText('Not included')).toBeInTheDocument();
    expect(screen.queryByText('Included')).not.toBeInTheDocument();
  });

  it('shows "Included" for an alwaysIncluded row regardless of availability', () => {
    mockedUseIsCapabilityEnabled.mockReturnValue(false);

    renderStatusRow({ alwaysIncluded: true });

    expect(screen.getByText('Included')).toBeInTheDocument();
    expect(screen.queryByText('Not included')).not.toBeInTheDocument();
  });

  it('never calls useUpdateWorkspaceCapability', () => {
    mockedUseIsCapabilityEnabled.mockReturnValue(true);

    renderStatusRow();

    expect(mockedUseUpdateWorkspaceCapability).not.toHaveBeenCalled();
    expect(mockUpdateWorkspaceCapability).not.toHaveBeenCalled();
  });
});
