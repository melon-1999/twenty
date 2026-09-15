import { isEnvOnlyConfigVar } from 'src/engine/core-modules/twenty-config/utils/is-env-only-config-var.util';

describe('isEnvOnlyConfigVar', () => {
  it('flags IS_MULTIWORKSPACE_ENABLED as env-only so it cannot be flipped from the admin panel at runtime', () => {
    expect(isEnvOnlyConfigVar('IS_MULTIWORKSPACE_ENABLED')).toBe(true);
  });

  it('does not flag a regular DB-editable variable as env-only', () => {
    expect(isEnvOnlyConfigVar('LOGGER_IS_BUFFER_ENABLED')).toBe(false);
  });
});
