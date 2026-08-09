export enum ProductCapabilityKey {
  CONTACTS = 'CONTACTS',
  COMPANIES = 'COMPANIES',
  DEALS = 'DEALS',
  ACTIVITIES = 'ACTIVITIES',
  DASHBOARDS = 'DASHBOARDS',
  EMAIL = 'EMAIL',
  CALENDAR = 'CALENDAR',
  AUTOMATIONS = 'AUTOMATIONS',
  AI_ASSISTANT = 'AI_ASSISTANT',
}

export type ProductCapabilityCategory = 'core' | 'optional';

export type ProductCapabilityDefinition = {
  key: ProductCapabilityKey;
  name: string;
  description: string;
  category: ProductCapabilityCategory;
  isCore: boolean;
  defaultEnabled: boolean;
  dependsOn: ProductCapabilityKey[];
  availability: {
    entitlementKey?: string;
    configFlag?: string;
  };
  effect: {
    objectStandardIds?: string[];
    gatesRoutes?: string[];
    navKeys?: string[];
  };
};
