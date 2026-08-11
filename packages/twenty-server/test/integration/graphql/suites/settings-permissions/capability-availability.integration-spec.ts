// This suite proves that the deployment-availability gate
// (IS_DASHBOARDS_MODULE_ENABLED) leaves the guarded Dashboards endpoints
// reachable under the default deployment configuration (the flag defaults to
// true). The CapabilityGuard now resolves availability from this deploy
// config var instead of the per-workspace DB toggle, so this test locks in
// that the repointed guard does not regress the enabled path.
//
// The config-false -> ForbiddenException path is covered by the guard unit
// test (src/engine/guards/__tests__/capability.guard.spec.ts): the var is
// isEnvOnly, so it cannot be flipped per-test in this integration harness.
import { isDefined } from 'twenty-shared/utils';

import {
  createTestDashboardWithGraphQL,
  destroyDashboardWithGraphQL,
} from 'test/integration/metadata/suites/dashboard/utils/dashboard-graphql.util';
import { duplicateOneDashboard } from 'test/integration/metadata/suites/dashboard/utils/duplicate-one-dashboard.util';

describe('Deployment-availability gate for Dashboards endpoints (integration)', () => {
  let createdDashboardId: string | undefined;
  let duplicatedDashboardId: string | undefined;

  afterAll(async () => {
    if (isDefined(duplicatedDashboardId)) {
      await destroyDashboardWithGraphQL(duplicatedDashboardId);
    }

    if (isDefined(createdDashboardId)) {
      await destroyDashboardWithGraphQL(createdDashboardId);
    }
  });

  it('allows duplicateDashboard when IS_DASHBOARDS_MODULE_ENABLED defaults to true', async () => {
    const dashboard = await createTestDashboardWithGraphQL({
      title: 'Capability Availability Gate Test Dashboard',
    });

    createdDashboardId = dashboard.id;
    expect(createdDashboardId).toBeDefined();

    const { data, errors } = await duplicateOneDashboard({
      expectToFail: false,
      input: { id: createdDashboardId as string },
    });

    // No FORBIDDEN/availability error under the default (enabled) config.
    expect(errors).toBeUndefined();
    expect(data.duplicateDashboard).toBeDefined();
    expect(data.duplicateDashboard.id).not.toBe(createdDashboardId);

    duplicatedDashboardId = data.duplicateDashboard.id;
  });
});
