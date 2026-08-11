import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { Provider as JotaiProvider } from 'jotai';

import { isDashboardsModuleEnabledState } from '@/client-config/states/isDashboardsModuleEnabledState';
import { isEmailModuleEnabledState } from '@/client-config/states/isEmailModuleEnabledState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { useIsCapabilityEnabled } from '@/workspace/hooks/useIsCapabilityEnabled';
import { ProductCapabilityKey } from '~/generated-metadata/graphql';

const Wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(JotaiProvider, { store: jotaiStore }, children);

const renderHooks = (capabilityKey: ProductCapabilityKey | null) => {
  const { result } = renderHook(
    () => {
      const isCapabilityEnabled = useIsCapabilityEnabled(capabilityKey);
      const setIsDashboardsModuleEnabled = useSetAtomState(
        isDashboardsModuleEnabledState,
      );
      const setIsEmailModuleEnabled = useSetAtomState(
        isEmailModuleEnabledState,
      );

      return {
        isCapabilityEnabled,
        setIsDashboardsModuleEnabled,
        setIsEmailModuleEnabled,
      };
    },
    {
      wrapper: Wrapper,
    },
  );
  return { result };
};

describe('useIsCapabilityEnabled', () => {
  it('should return false when the DASHBOARDS deploy flag is disabled', () => {
    const { result } = renderHooks(ProductCapabilityKey.DASHBOARDS);

    act(() => {
      result.current.setIsDashboardsModuleEnabled(false);
    });

    expect(result.current.isCapabilityEnabled).toBe(false);
  });

  it('should return true when the DASHBOARDS deploy flag is enabled', () => {
    const { result } = renderHooks(ProductCapabilityKey.DASHBOARDS);

    act(() => {
      result.current.setIsDashboardsModuleEnabled(true);
    });

    expect(result.current.isCapabilityEnabled).toBe(true);
  });

  it('should return false when the EMAIL deploy flag is disabled', () => {
    const { result } = renderHooks(ProductCapabilityKey.EMAIL);

    act(() => {
      result.current.setIsEmailModuleEnabled(false);
    });

    expect(result.current.isCapabilityEnabled).toBe(false);
  });

  it('should return true when the EMAIL deploy flag is enabled', () => {
    const { result } = renderHooks(ProductCapabilityKey.EMAIL);

    act(() => {
      result.current.setIsEmailModuleEnabled(true);
    });

    expect(result.current.isCapabilityEnabled).toBe(true);
  });

  it('should return true for a capability with no deploy flag', () => {
    const { result } = renderHooks(ProductCapabilityKey.CONTACTS);

    expect(result.current.isCapabilityEnabled).toBe(true);
  });

  it('should return false when the capability key is null', () => {
    const { result } = renderHooks(null);

    expect(result.current.isCapabilityEnabled).toBe(false);
  });
});
