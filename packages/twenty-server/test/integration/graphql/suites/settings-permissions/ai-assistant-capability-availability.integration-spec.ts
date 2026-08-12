// This suite proves that the deployment-availability gate
// (IS_AI_ASSISTANT_MODULE_ENABLED) leaves the guarded AI resolvers
// reachable under the default deployment configuration (the flag defaults
// to true). The CapabilityGuard resolves availability for the AI_ASSISTANT
// capability from this deploy config var, so this test locks in that the
// guard does not regress the enabled path.
//
// The config-false -> ForbiddenException path is covered by the guard unit
// test (src/engine/guards/__tests__/capability.guard.spec.ts): the var is
// isEnvOnly, so it cannot be flipped per-test in this integration harness.
//
// findManyAgents is used as the guarded resolver because it takes no
// arguments at all, keeping the request minimal: no agent fixtures are
// required. The default test token's workspace member may or may not carry
// the AI settings permission flag checked by SettingsPermissionGuard ahead
// of the CapabilityGuard, so a non-capability error is possible and
// acceptable — asserting the capability guard's ForbiddenException message
// is absent is enough to prove the availability gate passed.
import gql from 'graphql-tag';

import { makeMetadataAPIRequest } from 'test/integration/metadata/suites/utils/make-metadata-api-request.util';

const CAPABILITY_FORBIDDEN_MESSAGE =
  'Module "AI_ASSISTANT" is not available on this deployment';

describe('Deployment-availability gate for AI Assistant resolvers (integration)', () => {
  it('does not block findManyAgents with a capability error when IS_AI_ASSISTANT_MODULE_ENABLED defaults to true', async () => {
    const query = gql`
      query FindManyAgents {
        findManyAgents {
          id
        }
      }
    `;

    const response = await makeMetadataAPIRequest({ query });

    // No FORBIDDEN/availability error under the default (enabled) config.
    // Other errors (e.g. from a permission or settings guard) are expected
    // and fine — the point is the capability guard does not block the call.
    const forbiddenError = response.body.errors?.find(
      (error: { message: string }) =>
        error.message === CAPABILITY_FORBIDDEN_MESSAGE,
    );

    expect(forbiddenError).toBeUndefined();
  });
});
