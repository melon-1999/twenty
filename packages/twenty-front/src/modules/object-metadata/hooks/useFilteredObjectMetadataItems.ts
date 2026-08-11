import { OBJECT_NAME_TO_CAPABILITY_KEY } from '@/object-metadata/constants/objectNameToCapabilityKey';
import { objectMetadataItemsWithFieldsSelector } from '@/object-metadata/states/objectMetadataItemsWithFieldsSelector';
import { useMemo } from 'react';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useIsCapabilityEnabled } from '@/workspace/hooks/useIsCapabilityEnabled';
import { ProductCapabilityKey } from '~/generated-metadata/graphql';

export const useFilteredObjectMetadataItems = () => {
  const objectMetadataItemsWithFields = useAtomStateValue(
    objectMetadataItemsWithFieldsSelector,
  );
  const objectMetadataItems = objectMetadataItemsWithFields;

  // Object-backed capabilities disabled by deploy config are hidden from nav.
  const isDashboardsAvailable = useIsCapabilityEnabled(
    ProductCapabilityKey.DASHBOARDS,
  );
  const isAutomationsAvailable = useIsCapabilityEnabled(
    ProductCapabilityKey.AUTOMATIONS,
  );

  const unavailableObjectNames = useMemo(() => {
    // Map each object-backed capability to whether it is available on this deploy.
    const availabilityByCapability: Partial<
      Record<ProductCapabilityKey, boolean>
    > = {
      [ProductCapabilityKey.DASHBOARDS]: isDashboardsAvailable,
      [ProductCapabilityKey.AUTOMATIONS]: isAutomationsAvailable,
    };

    const names = new Set<string>();
    Object.entries(OBJECT_NAME_TO_CAPABILITY_KEY).forEach(
      ([objectName, capabilityKey]) => {
        if (availabilityByCapability[capabilityKey] === false) {
          names.add(objectName);
        }
      },
    );
    return names;
  }, [isDashboardsAvailable, isAutomationsAvailable]);

  const activeNonSystemObjectMetadataItems = useMemo(
    () =>
      objectMetadataItems.filter(
        ({ isActive, isSystem, nameSingular }) =>
          isActive && !isSystem && !unavailableObjectNames.has(nameSingular),
      ),
    [objectMetadataItems, unavailableObjectNames],
  );

  const activeObjectMetadataItems = useMemo(
    () =>
      objectMetadataItems
        .filter(
          ({ isActive, nameSingular }) =>
            isActive && !unavailableObjectNames.has(nameSingular),
        )
        .sort((a, b) => a.labelSingular.localeCompare(b.labelSingular)),
    [objectMetadataItems, unavailableObjectNames],
  );

  const alphaSortedActiveNonSystemObjectMetadataItems = [
    ...activeNonSystemObjectMetadataItems,
  ].sort((a, b) => {
    if (a.nameSingular < b.nameSingular) {
      return -1;
    }
    if (a.nameSingular > b.nameSingular) {
      return 1;
    }
    return 0;
  });

  const inactiveNonSystemObjectMetadataItems = objectMetadataItems.filter(
    ({ isActive, isSystem }) => !isActive && !isSystem,
  );

  const findActiveObjectMetadataItemByNamePlural = (namePlural: string) =>
    activeNonSystemObjectMetadataItems.find(
      (activeObjectMetadataItem) =>
        activeObjectMetadataItem.namePlural === namePlural,
    );

  const findObjectMetadataItemById = (id: string) =>
    objectMetadataItems.find(
      (objectMetadataItem) => objectMetadataItem.id === id,
    );

  const findObjectMetadataItemByNamePlural = (namePlural: string) =>
    objectMetadataItems.find(
      (objectMetadataItem) => objectMetadataItem.namePlural === namePlural,
    );

  return {
    activeNonSystemObjectMetadataItems,
    activeObjectMetadataItems,
    findObjectMetadataItemById,
    findObjectMetadataItemByNamePlural,
    findActiveObjectMetadataItemByNamePlural,
    inactiveNonSystemObjectMetadataItems,
    objectMetadataItems,
    alphaSortedActiveNonSystemObjectMetadataItems,
  };
};
