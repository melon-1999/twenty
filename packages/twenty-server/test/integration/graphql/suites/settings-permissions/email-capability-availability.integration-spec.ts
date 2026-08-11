// This suite proves that the deployment-availability gate
// (IS_EMAIL_MODULE_ENABLED) leaves the guarded email resolvers reachable
// under the default deployment configuration (the flag defaults to true).
// The CapabilityGuard resolves availability for the EMAIL capability from
// this deploy config var, so this test locks in that the guard does not
// regress the enabled path.
//
// The config-false -> ForbiddenException path is covered by the guard unit
// test (src/engine/guards/__tests__/capability.guard.spec.ts): the var is
// isEnvOnly, so it cannot be flipped per-test in this integration harness.
import gql from 'graphql-tag';

import { makeMetadataAPIRequest } from 'test/integration/metadata/suites/utils/make-metadata-api-request.util';

describe('Deployment-availability gate for Email resolvers (integration)', () => {
  it('allows myMessageChannels when IS_EMAIL_MODULE_ENABLED defaults to true', async () => {
    const query = gql`
      query MyMessageChannels {
        myMessageChannels {
          id
          type
        }
      }
    `;

    const response = await makeMetadataAPIRequest({ query });

    // No FORBIDDEN/availability error under the default (enabled) config.
    // An empty list is fine — the point is the guard does not block the call.
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.myMessageChannels).toBeDefined();
  });
});
