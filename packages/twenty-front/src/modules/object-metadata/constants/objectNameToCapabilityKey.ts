import { ProductCapabilityKey } from '~/generated-metadata/graphql';

// Object-backed capabilities: an object hidden from nav when its module is
// unavailable on this deployment.
export const OBJECT_NAME_TO_CAPABILITY_KEY = {
  dashboard: ProductCapabilityKey.DASHBOARDS,
  workflow: ProductCapabilityKey.AUTOMATIONS,
} as const satisfies Record<string, ProductCapabilityKey>;

// The distinct capabilities that back an object; useIsCapabilityEnabled must
// be read for each of these in useFilteredObjectMetadataItems.
export type ObjectBackedCapabilityKey =
  (typeof OBJECT_NAME_TO_CAPABILITY_KEY)[keyof typeof OBJECT_NAME_TO_CAPABILITY_KEY];
