// This suite proves that the deployment-availability gate
// (IS_AUTOMATIONS_MODULE_ENABLED) leaves the guarded workflow resolvers
// reachable under the default deployment configuration (the flag defaults
// to true). The CapabilityGuard resolves availability for the AUTOMATIONS
// capability from this deploy config var, so this test locks in that the
// guard does not regress the enabled path.
//
// The config-false -> ForbiddenException path is covered by the guard unit
// test (src/engine/guards/__tests__/capability.guard.spec.ts): the var is
// isEnvOnly, so it cannot be flipped per-test in this integration harness.
//
// activateWorkflowVersion is used as the guarded resolver because it takes
// a single scalar UUID argument, keeping the request minimal: no workflow
// fixtures are required. Calling it with a random, non-existent
// workflowVersionId is expected to fail with a not-found/validation error
// from the workspace service, which is distinct from the capability
// guard's ForbiddenException — asserting the latter is absent is enough to
// prove the availability gate passed.
import gql from 'graphql-tag';
import { v4 } from 'uuid';

import { makeMetadataAPIRequest } from 'test/integration/metadata/suites/utils/make-metadata-api-request.util';

const CAPABILITY_FORBIDDEN_MESSAGE =
  'Module "AUTOMATIONS" is not available on this deployment';

describe('Deployment-availability gate for Automations resolvers (integration)', () => {
  it('does not block activateWorkflowVersion with a capability error when IS_AUTOMATIONS_MODULE_ENABLED defaults to true', async () => {
    const mutation = gql`
      mutation ActivateWorkflowVersion($workflowVersionId: UUID!) {
        activateWorkflowVersion(workflowVersionId: $workflowVersionId)
      }
    `;

    const response = await makeMetadataAPIRequest({
      query: mutation,
      variables: { workflowVersionId: v4() },
    });

    // No FORBIDDEN/availability error under the default (enabled) config.
    // A not-found/validation error from the workspace service is expected
    // and fine — the point is the guard does not block the call.
    const forbiddenError = response.body.errors?.find(
      (error: { message: string }) =>
        error.message === CAPABILITY_FORBIDDEN_MESSAGE,
    );

    expect(forbiddenError).toBeUndefined();
  });
});
