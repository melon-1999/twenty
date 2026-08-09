import { type CurrentWorkspace } from '@/auth/states/currentWorkspaceState';
import { checkIfCapabilityIsEnabledOnWorkspace } from '@/workspace/utils/checkIfCapabilityIsEnabledOnWorkspace';

const makeWorkspace = (
  enabledCapabilities?: Array<{ key: string; value: boolean }>,
): CurrentWorkspace =>
  ({
    id: 'workspace-1',
    enabledCapabilities,
  }) as unknown as CurrentWorkspace;

describe('checkIfCapabilityIsEnabledOnWorkspace', () => {
  it('should return false when capabilityKey is null', () => {
    const workspace = makeWorkspace([]);

    expect(checkIfCapabilityIsEnabledOnWorkspace(null, workspace)).toBe(false);
  });

  it('should return false when capabilityKey is undefined', () => {
    const workspace = makeWorkspace([]);

    expect(checkIfCapabilityIsEnabledOnWorkspace(undefined, workspace)).toBe(
      false,
    );
  });

  it('should return false when workspace is null', () => {
    expect(checkIfCapabilityIsEnabledOnWorkspace('CONTACTS' as any, null)).toBe(
      false,
    );
  });

  it('should return false when workspace has no enabledCapabilities', () => {
    const workspace = makeWorkspace(undefined);

    expect(
      checkIfCapabilityIsEnabledOnWorkspace('CONTACTS' as any, workspace),
    ).toBe(false);
  });

  it('should return false when capability is not found', () => {
    const workspace = makeWorkspace([{ key: 'OTHER_CAPABILITY', value: true }]);

    expect(
      checkIfCapabilityIsEnabledOnWorkspace('CONTACTS' as any, workspace),
    ).toBe(false);
  });

  it('should return false when capability exists but is disabled', () => {
    const workspace = makeWorkspace([{ key: 'CONTACTS', value: false }]);

    expect(
      checkIfCapabilityIsEnabledOnWorkspace('CONTACTS' as any, workspace),
    ).toBe(false);
  });

  it('should return true when capability exists and is enabled', () => {
    const workspace = makeWorkspace([{ key: 'CONTACTS', value: true }]);

    expect(
      checkIfCapabilityIsEnabledOnWorkspace('CONTACTS' as any, workspace),
    ).toBe(true);
  });
});
