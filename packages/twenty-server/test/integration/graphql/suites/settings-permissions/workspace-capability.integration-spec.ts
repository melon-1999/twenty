import gql from 'graphql-tag';
import {
  createTestDashboardWithGraphQL,
  destroyDashboardWithGraphQL,
  findDashboardWithGraphQL,
} from 'test/integration/metadata/suites/dashboard/utils/dashboard-graphql.util';
import { findManyObjectMetadata } from 'test/integration/metadata/suites/object-metadata/utils/find-many-object-metadata.util';
import { makeMetadataAPIRequest } from 'test/integration/metadata/suites/utils/make-metadata-api-request.util';
import { ProductCapabilityKey } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { ErrorCode } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { PermissionsExceptionMessage } from 'src/engine/metadata-modules/permissions/permissions.exception';

// Reads the resolved capabilities map through the same GraphQL field the app
// consumes (currentWorkspace.enabledCapabilities) and returns the boolean value
// for a single key.
const getEnabledCapabilityValue = async (
  key: ProductCapabilityKey,
): Promise<boolean | undefined> => {
  const query = gql`
    query GetEnabledCapabilities {
      currentWorkspace {
        id
        enabledCapabilities {
          key
          value
        }
      }
    }
  `;

  const response = await makeMetadataAPIRequest({ query });

  expect(response.body.errors).toBeUndefined();

  const capabilities: { key: ProductCapabilityKey; value: boolean }[] =
    response.body.data.currentWorkspace.enabledCapabilities;

  return capabilities.find((capability) => capability.key === key)?.value;
};

// Reads the dashboard standard object's isActive over the metadata `objects`
// query (the same endpoint the app uses to build its object schema view).
const getDashboardObjectIsActive = async (): Promise<boolean | undefined> => {
  const { objects } = await findManyObjectMetadata({
    expectToFail: false,
    input: {
      filter: {},
      paging: { first: 100 },
    },
    gqlFields: `
      id
      nameSingular
      isActive
    `,
  });

  return objects.find((object) => object.nameSingular === 'dashboard')
    ?.isActive;
};

const updateWorkspaceCapability = async (
  {
    key,
    enabled,
  }: {
    key: ProductCapabilityKey;
    enabled: boolean;
  },
  token?: string,
) => {
  const query = gql`
    mutation UpdateWorkspaceCapability(
      $input: UpdateWorkspaceCapabilityInput!
    ) {
      updateWorkspaceCapability(input: $input) {
        key
        value
      }
    }
  `;

  return makeMetadataAPIRequest(
    {
      query,
      variables: { input: { key, enabled } },
    },
    token,
  );
};

// Guarantees DASHBOARDS is left enabled so a shared test workspace is not
// poisoned for other suites, regardless of where an assertion fails.
const ensureDashboardsEnabled = async () => {
  await updateWorkspaceCapability({
    key: ProductCapabilityKey.DASHBOARDS,
    enabled: true,
  });
};

describe('Dashboards capability isActive effect (integration)', () => {
  let createdDashboardId: string | undefined;

  afterAll(async () => {
    await ensureDashboardsEnabled();

    if (isDefined(createdDashboardId)) {
      await destroyDashboardWithGraphQL(createdDashboardId);
    }
  });

  it('toggles the dashboard object isActive with the capability while preserving records (admin)', async () => {
    // 1. Baseline: capability enabled + object active.
    expect(
      await getEnabledCapabilityValue(ProductCapabilityKey.DASHBOARDS),
    ).toBe(true);
    expect(await getDashboardObjectIsActive()).toBe(true);

    // 4 (setup): create a dashboard record to prove the toggle preserves data.
    const dashboard = await createTestDashboardWithGraphQL({
      title: 'Capability Effect Test Dashboard',
    });

    createdDashboardId = dashboard.id;
    expect(createdDashboardId).toBeDefined();

    // 2. Toggle OFF and assert the mutation echoes the new value.
    const disableResponse = await updateWorkspaceCapability({
      key: ProductCapabilityKey.DASHBOARDS,
      enabled: false,
    });

    expect(disableResponse.body.errors).toBeUndefined();
    expect(disableResponse.body.data.updateWorkspaceCapability).toEqual({
      key: ProductCapabilityKey.DASHBOARDS,
      value: false,
    });

    // 3. Assert the effect applied over the real path: object isActive flipped
    // and the resolved capability map now reports DASHBOARDS as disabled.
    expect(await getDashboardObjectIsActive()).toBe(false);
    expect(
      await getEnabledCapabilityValue(ProductCapabilityKey.DASHBOARDS),
    ).toBe(false);

    // 4. Data preservation: the dashboard record still exists after OFF (the
    // isActive flip is data-preserving, not a destructive delete).
    const dashboardAfterDisable =
      await findDashboardWithGraphQL(createdDashboardId);

    expect(dashboardAfterDisable).not.toBeNull();
    expect(dashboardAfterDisable?.id).toBe(createdDashboardId);

    // 5. Lossless reactivation: toggle ON, object active again, capability true,
    // and the record from step 4 is still present.
    const enableResponse = await updateWorkspaceCapability({
      key: ProductCapabilityKey.DASHBOARDS,
      enabled: true,
    });

    expect(enableResponse.body.errors).toBeUndefined();
    expect(enableResponse.body.data.updateWorkspaceCapability).toEqual({
      key: ProductCapabilityKey.DASHBOARDS,
      value: true,
    });

    expect(await getDashboardObjectIsActive()).toBe(true);
    expect(
      await getEnabledCapabilityValue(ProductCapabilityKey.DASHBOARDS),
    ).toBe(true);

    const dashboardAfterReenable =
      await findDashboardWithGraphQL(createdDashboardId);

    expect(dashboardAfterReenable).not.toBeNull();
    expect(dashboardAfterReenable?.id).toBe(createdDashboardId);
  });

  it('rejects disabling a core capability (CONTACTS)', async () => {
    const response = await updateWorkspaceCapability({
      key: ProductCapabilityKey.CONTACTS,
      enabled: false,
    });

    expect(response.body.data?.updateWorkspaceCapability ?? null).toBeNull();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain(
      'core capability and cannot be disabled',
    );

    // The core object stays active — the rejected toggle applied no effect.
    expect(await getEnabledCapabilityValue(ProductCapabilityKey.CONTACTS)).toBe(
      true,
    );
  });

  it('denies updateWorkspaceCapability for a non-admin member', async () => {
    const response = await updateWorkspaceCapability(
      {
        key: ProductCapabilityKey.DASHBOARDS,
        enabled: false,
      },
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.data).toBeNull();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      PermissionsExceptionMessage.PERMISSION_DENIED,
    );
    expect(response.body.errors[0].extensions.code).toBe(ErrorCode.FORBIDDEN);

    // The denied member call must not have changed state.
    expect(
      await getEnabledCapabilityValue(ProductCapabilityKey.DASHBOARDS),
    ).toBe(true);
  });
});
