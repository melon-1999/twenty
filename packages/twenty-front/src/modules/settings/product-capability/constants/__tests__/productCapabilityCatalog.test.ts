import { PRODUCT_CAPABILITY_DISPLAY_CATALOG } from '@/settings/product-capability/constants/productCapabilityCatalog';
import { ProductCapabilityKey } from 'twenty-shared/types';

describe('productCapabilityCatalog', () => {
  it('should have a display entry for every ProductCapabilityKey', () => {
    const catalogKeys = Object.keys(PRODUCT_CAPABILITY_DISPLAY_CATALOG);

    expect(catalogKeys.sort()).toEqual(
      Object.values(ProductCapabilityKey).sort(),
    );
  });

  it('should mark CONTACTS, COMPANIES, DEALS and ACTIVITIES as core', () => {
    const coreKeys = Object.values(PRODUCT_CAPABILITY_DISPLAY_CATALOG)
      .filter((capability) => capability.isCore)
      .map((capability) => capability.key)
      .sort();

    expect(coreKeys).toEqual(
      [
        ProductCapabilityKey.ACTIVITIES,
        ProductCapabilityKey.COMPANIES,
        ProductCapabilityKey.CONTACTS,
        ProductCapabilityKey.DEALS,
      ].sort(),
    );
  });

  it('should mark the remaining five capabilities as optional', () => {
    const optionalKeys = Object.values(PRODUCT_CAPABILITY_DISPLAY_CATALOG)
      .filter((capability) => !capability.isCore)
      .map((capability) => capability.key)
      .sort();

    expect(optionalKeys).toEqual(
      [
        ProductCapabilityKey.AI_ASSISTANT,
        ProductCapabilityKey.AUTOMATIONS,
        ProductCapabilityKey.CALENDAR,
        ProductCapabilityKey.DASHBOARDS,
        ProductCapabilityKey.EMAIL,
      ].sort(),
    );
  });
});
