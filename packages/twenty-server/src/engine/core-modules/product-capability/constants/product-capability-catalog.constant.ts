import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-shared/metadata';
import {
  type ProductCapabilityDefinition,
  ProductCapabilityKey,
} from 'twenty-shared/types';

// Foundation catalog: every capability defaults to enabled and declares no
// availability entitlement/config or effect yet, so the resolved map is
// all-true and this layer introduces zero behavior change.
export const PRODUCT_CAPABILITY_CATALOG: Record<
  ProductCapabilityKey,
  ProductCapabilityDefinition
> = {
  [ProductCapabilityKey.CONTACTS]: {
    key: ProductCapabilityKey.CONTACTS,
    name: 'Contacts',
    description: 'Store and manage people you do business with.',
    category: 'core',
    isCore: true,
    defaultEnabled: true,
    dependsOn: [],
    availability: {},
    effect: {},
  },
  [ProductCapabilityKey.COMPANIES]: {
    key: ProductCapabilityKey.COMPANIES,
    name: 'Companies',
    description: 'Track organizations and the people who work at them.',
    category: 'core',
    isCore: true,
    defaultEnabled: true,
    dependsOn: [],
    availability: {},
    effect: {},
  },
  [ProductCapabilityKey.DEALS]: {
    key: ProductCapabilityKey.DEALS,
    name: 'Deals',
    description: 'Manage opportunities as they move through your pipeline.',
    category: 'core',
    isCore: true,
    defaultEnabled: true,
    dependsOn: [],
    availability: {},
    effect: {},
  },
  [ProductCapabilityKey.ACTIVITIES]: {
    key: ProductCapabilityKey.ACTIVITIES,
    name: 'Activities',
    description: 'Log tasks, notes and interactions across your records.',
    category: 'core',
    isCore: true,
    defaultEnabled: true,
    dependsOn: [],
    availability: {},
    effect: {},
  },
  [ProductCapabilityKey.DASHBOARDS]: {
    key: ProductCapabilityKey.DASHBOARDS,
    name: 'Dashboards',
    description: 'Visualize your CRM data with charts and metrics.',
    category: 'optional',
    isCore: false,
    defaultEnabled: true,
    dependsOn: [
      ProductCapabilityKey.CONTACTS,
      ProductCapabilityKey.COMPANIES,
      ProductCapabilityKey.DEALS,
    ],
    availability: { configFlag: 'IS_DASHBOARDS_MODULE_ENABLED' },
    // Toggling DASHBOARDS flips the dashboard standard object's isActive per
    // workspace (UI-hide + lossless data preservation). This is NOT an API
    // access boundary — enforcement lives on the discrete dashboard endpoints
    // via @RequireCapability(DASHBOARDS). See WorkspaceCapabilityService.
    effect: {
      objectStandardIds: [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.dashboard],
    },
  },
  [ProductCapabilityKey.EMAIL]: {
    key: ProductCapabilityKey.EMAIL,
    name: 'Email',
    description: 'Sync and send emails alongside your contacts.',
    category: 'optional',
    isCore: false,
    defaultEnabled: true,
    dependsOn: [ProductCapabilityKey.CONTACTS],
    availability: {},
    effect: {},
  },
  [ProductCapabilityKey.CALENDAR]: {
    key: ProductCapabilityKey.CALENDAR,
    name: 'Calendar',
    description: 'Bring calendar events into your activity timeline.',
    category: 'optional',
    isCore: false,
    defaultEnabled: true,
    dependsOn: [ProductCapabilityKey.ACTIVITIES],
    availability: {},
    effect: {},
  },
  [ProductCapabilityKey.AUTOMATIONS]: {
    key: ProductCapabilityKey.AUTOMATIONS,
    name: 'Automations',
    description: 'Automate repetitive work with workflows.',
    category: 'optional',
    isCore: false,
    defaultEnabled: true,
    dependsOn: [
      ProductCapabilityKey.CONTACTS,
      ProductCapabilityKey.COMPANIES,
      ProductCapabilityKey.DEALS,
    ],
    availability: {},
    effect: {},
  },
  [ProductCapabilityKey.AI_ASSISTANT]: {
    key: ProductCapabilityKey.AI_ASSISTANT,
    name: 'AI Assistant',
    description: 'Get AI-powered help across your workspace.',
    category: 'optional',
    isCore: false,
    defaultEnabled: true,
    dependsOn: [],
    availability: {},
    effect: {},
  },
};

export const PRODUCT_CAPABILITY_KEYS = Object.values(ProductCapabilityKey);

export const getProductCapabilityDefinition = (
  key: ProductCapabilityKey,
): ProductCapabilityDefinition => PRODUCT_CAPABILITY_CATALOG[key];
