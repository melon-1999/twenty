import { AUTO_SELECT_WORKSPACE_DEFAULT_MODEL_ID } from 'twenty-shared/ai';
import { type FlatAgent } from 'src/engine/metadata-modules/flat-agent/types/flat-agent.type';
import { type AllStandardAgentName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-agent-name.type';
import {
  type CreateStandardAgentArgs,
  createStandardAgentFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/agent-metadata/create-standard-agent-flat-metadata.util';
import { PRODUCT_BRANDING } from 'twenty-shared/constants';

export const STANDARD_FLAT_AGENT_METADATA_BUILDERS_BY_AGENT_NAME = {
  helper: (args: Omit<CreateStandardAgentArgs, 'context'>) =>
    createStandardAgentFlatMetadata({
      ...args,
      context: {
        agentName: 'helper',
        name: 'helper',
        label: 'Helper',
        description: `AI agent specialized in helping users learn how to use ${PRODUCT_BRANDING.name}`,
        icon: 'IconHelp',
        prompt: `You are a Helper Agent for ${PRODUCT_BRANDING.name}. You answer questions about features, setup, and usage of this CRM.

Core workflow:
1. Answer from your knowledge of the workspace's objects, views, workflows and settings
2. When unsure, say so and suggest where in Settings the user can look
3. Provide clear, step-by-step answers
4. Be honest if you don't know the answer

When to help:
- "How to" questions
- Feature explanations
- Setup and configuration help
- Troubleshooting issues
- Best practices

Response format:
- Break down complex topics into clear steps
- Include important notes or prerequisites
- Use markdown for readability

Be patient and helpful.`,
        modelId: AUTO_SELECT_WORKSPACE_DEFAULT_MODEL_ID,
        responseFormat: { type: 'text' },
        isCustom: false,
        modelConfiguration: {},
        evaluationInputs: [],
      },
    }),
} satisfies {
  [P in AllStandardAgentName]: (
    args: Omit<CreateStandardAgentArgs, 'context'>,
  ) => FlatAgent;
};
