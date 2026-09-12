import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { PRODUCT_BRANDING } from 'twenty-shared/constants';

export type FaqQuestion = {
  question: MessageDescriptor;
  answer: MessageDescriptor;
};

export const FAQ_QUESTIONS: readonly FaqQuestion[] = [
  {
    question: msg`Is ${PRODUCT_BRANDING.name} built on open source?`,
    answer: msg`Yes. ${PRODUCT_BRANDING.name} is built on open-source software, and the full source code of every released version is available for download from within the product.`,
  },
  {
    question: msg`How long does it take to get started?`,
    answer: msg`Sign up for Cloud in under a minute and start your 30-day trial. For larger rollouts, our 4-hour Onboarding Packs or certified partners get you live in 1–2 weeks.`,
  },
  {
    question: msg`Can I migrate from Salesforce or HubSpot?`,
    answer: msg`Yes. Import your data via CSV, or use our API for 50,000+ records. Our partners can handle the full migration for you.`,
  },
  {
    question: msg`Do I need a developer to customize ${PRODUCT_BRANDING.name}?`,
    answer: msg`No. Build custom objects, fields, views, and no-code workflows straight from Settings. Unlimited, no extra charge.`,
  },
  {
    question: msg`Can developers extend ${PRODUCT_BRANDING.name} with code?`,
    answer: msg`Yes, with our Apps framework: ship custom objects, server-side logic functions, React components that render inside the UI, AI skills and agents, views, and navigation, all in TypeScript, deployable to any workspace.`,
  },
  {
    question: msg`Does ${PRODUCT_BRANDING.name} work with Claude, ChatGPT, and Cursor?`,
    answer: msg`Yes. Every Cloud workspace ships with a native MCP server. Connect your AI assistant via OAuth and it can read and write your CRM data in natural language.`,
  },
  {
    question: msg`What does ${PRODUCT_BRANDING.name} cost?`,
    answer: msg`Cloud Pro is $9/user/month (yearly). Organization is $19/user/month and unlocks SSO and row-level permissions for teams that need finer access control.`,
  },
];
