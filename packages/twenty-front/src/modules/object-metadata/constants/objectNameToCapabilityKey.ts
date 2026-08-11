import { ProductCapabilityKey } from '~/generated-metadata/graphql';

// Object-backed capabilities: an object hidden from nav when its module is
// unavailable on this deployment.
export const OBJECT_NAME_TO_CAPABILITY_KEY: Record<
  string,
  ProductCapabilityKey
> = {
  dashboard: ProductCapabilityKey.DASHBOARDS,
};
