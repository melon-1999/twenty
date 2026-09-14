import { type ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { getNavigationMenuItemFlatEntitySeeds } from 'src/engine/workspace-manager/dev-seeder/core/utils/get-navigation-menu-item-data-seeds.util';
import { getPageLayoutWidgetDataSeeds } from 'src/engine/workspace-manager/dev-seeder/core/utils/get-page-layout-widget-data-seeds.util';

// Seeded navigation items and page layout widgets render directly into the
// customer-facing navigation drawer and dashboards, so they must stay free of
// upstream Twenty/GitHub/OSS branding.
const FORBIDDEN_BRANDING_PATTERN =
  /github|twentyhq|star[-\s]history|discord|twenty\.com/i;

const WORKSPACE_ID = '20202020-1c25-4d02-bf25-6aeccf7ea419';

const FLAT_APPLICATION_STUB = {
  id: '20202020-0b58-4a4c-935d-2f9c6c1e42dd',
  universalIdentifier: '20202020-0b58-4a4c-935d-2f9c6c1e42dd',
} as Parameters<
  typeof getNavigationMenuItemFlatEntitySeeds
>[0]['flatApplication'];

describe('dev-seeder customer-visible branding', () => {
  it('seeds navigation menu items without upstream branding', () => {
    const seeds = getNavigationMenuItemFlatEntitySeeds({
      workspaceId: WORKSPACE_ID,
      flatApplication: FLAT_APPLICATION_STUB,
    });

    for (const seed of seeds) {
      expect(JSON.stringify(seed)).not.toMatch(FORBIDDEN_BRANDING_PATTERN);
    }
  });

  it('seeds page layout widgets without upstream branding', () => {
    const seeds = getPageLayoutWidgetDataSeeds(
      WORKSPACE_ID,
      [] as ObjectMetadataEntity[],
    );

    for (const seed of seeds) {
      expect(JSON.stringify(seed)).not.toMatch(FORBIDDEN_BRANDING_PATTERN);
    }
  });
});
