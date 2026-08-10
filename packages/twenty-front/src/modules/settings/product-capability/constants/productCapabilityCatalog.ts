import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { ProductCapabilityKey } from '~/generated-metadata/graphql';

export type ProductCapabilityDisplay = {
  key: ProductCapabilityKey;
  label: MessageDescriptor;
  description: MessageDescriptor;
  isCore: boolean;
  // Toggling this capability flips the isActive of a backing object metadata item
  // server-side, so the client must refresh object metadata to update the nav.
  objectBacked?: boolean;
};

// Display-only catalog: labels/descriptions for rendering the Features settings
// page. The authoritative capability catalog (dependencies, availability, effects)
// lives server-side in product-capability-catalog.constant.ts.
export const PRODUCT_CAPABILITY_DISPLAY_CATALOG: Record<
  ProductCapabilityKey,
  ProductCapabilityDisplay
> = {
  [ProductCapabilityKey.CONTACTS]: {
    key: ProductCapabilityKey.CONTACTS,
    label: msg`Contacts`,
    description: msg`Store and manage people you do business with.`,
    isCore: true,
  },
  [ProductCapabilityKey.COMPANIES]: {
    key: ProductCapabilityKey.COMPANIES,
    label: msg`Companies`,
    description: msg`Track organizations and the people who work at them.`,
    isCore: true,
  },
  [ProductCapabilityKey.DEALS]: {
    key: ProductCapabilityKey.DEALS,
    label: msg`Deals`,
    description: msg`Manage opportunities as they move through your pipeline.`,
    isCore: true,
  },
  [ProductCapabilityKey.ACTIVITIES]: {
    key: ProductCapabilityKey.ACTIVITIES,
    label: msg`Activities`,
    description: msg`Log tasks, notes and interactions across your records.`,
    isCore: true,
  },
  [ProductCapabilityKey.DASHBOARDS]: {
    key: ProductCapabilityKey.DASHBOARDS,
    label: msg`Dashboards`,
    description: msg`Visualize your CRM data with charts and metrics.`,
    isCore: false,
    objectBacked: true,
  },
  [ProductCapabilityKey.EMAIL]: {
    key: ProductCapabilityKey.EMAIL,
    label: msg`Email`,
    description: msg`Sync and send emails alongside your contacts.`,
    isCore: false,
  },
  [ProductCapabilityKey.CALENDAR]: {
    key: ProductCapabilityKey.CALENDAR,
    label: msg`Calendar`,
    description: msg`Bring calendar events into your activity timeline.`,
    isCore: false,
  },
  [ProductCapabilityKey.AUTOMATIONS]: {
    key: ProductCapabilityKey.AUTOMATIONS,
    label: msg`Automations`,
    description: msg`Automate repetitive work with workflows.`,
    isCore: false,
  },
  [ProductCapabilityKey.AI_ASSISTANT]: {
    key: ProductCapabilityKey.AI_ASSISTANT,
    label: msg`AI Assistant`,
    description: msg`Get AI-powered help across your workspace.`,
    isCore: false,
  },
};
