import { MockedProvider } from '@apollo/client/testing/react';
import { act, renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';
import {
  query,
  responseData,
  variables,
} from '@/object-metadata/hooks/__mocks__/useFilteredObjectMetadataItems';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { isAutomationsModuleEnabledState } from '@/client-config/states/isAutomationsModuleEnabledState';
import { isDashboardsModuleEnabledState } from '@/client-config/states/isDashboardsModuleEnabledState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { setTestObjectMetadataItemsInMetadataStore } from '~/testing/utils/setTestObjectMetadataItemsInMetadataStore';
import { isDefined } from 'twenty-shared/utils';
import { getTestEnrichedObjectMetadataItemsMock } from '~/testing/utils/getTestEnrichedObjectMetadataItemsMock';

const mocks = [
  {
    request: {
      query,
      variables,
    },
    result: jest.fn(() => ({
      data: {
        updateOneObject: responseData,
      },
    })),
  },
];

const Wrapper = ({ children }: { children: ReactNode }) => {
  setTestObjectMetadataItemsInMetadataStore(
    jotaiStore,
    getTestEnrichedObjectMetadataItemsMock(),
  );

  return (
    <JotaiProvider store={jotaiStore}>
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    </JotaiProvider>
  );
};

describe('useFilteredObjectMetadataItems', () => {
  it('should findActiveObjectMetadataItemByNamePlural', async () => {
    const { result } = renderHook(useFilteredObjectMetadataItems, {
      wrapper: Wrapper,
    });

    act(() => {
      const res =
        result.current.findActiveObjectMetadataItemByNamePlural('people');
      expect(res).toBeDefined();
      expect(res?.namePlural).toBe('people');
    });
  });

  it('should findObjectMetadataItemByNamePlural', async () => {
    const { result } = renderHook(useFilteredObjectMetadataItems, {
      wrapper: Wrapper,
    });

    act(() => {
      const res = result.current.findObjectMetadataItemByNamePlural('people');
      expect(res).toBeDefined();
      expect(res?.namePlural).toBe('people');
    });
  });

  it('should findObjectMetadataItemById', async () => {
    const peopleObjectMetadata = getTestEnrichedObjectMetadataItemsMock().find(
      (item) => item.namePlural === 'people',
    );

    if (!isDefined(peopleObjectMetadata)) {
      throw new Error('People object metadata not found');
    }

    const { result } = renderHook(useFilteredObjectMetadataItems, {
      wrapper: Wrapper,
    });

    act(() => {
      const res = result.current.findObjectMetadataItemById(
        peopleObjectMetadata.id,
      );
      expect(res).toBeDefined();
      expect(res?.namePlural).toBe('people');
    });
  });

  it('should findObjectMetadataItemByNamePlural', async () => {
    const { result } = renderHook(useFilteredObjectMetadataItems, {
      wrapper: Wrapper,
    });

    act(() => {
      const res =
        result.current.findObjectMetadataItemByNamePlural('opportunities');
      expect(res).toBeDefined();
      expect(res?.namePlural).toBe('opportunities');
    });
  });

  it('should exclude the dashboard object when the Dashboards deploy flag is disabled', async () => {
    const { result } = renderHook(
      () => {
        const filteredObjectMetadataItems = useFilteredObjectMetadataItems();
        const setIsDashboardsModuleEnabled = useSetAtomState(
          isDashboardsModuleEnabledState,
        );

        return { filteredObjectMetadataItems, setIsDashboardsModuleEnabled };
      },
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.setIsDashboardsModuleEnabled(false);
    });

    const { activeNonSystemObjectMetadataItems, activeObjectMetadataItems } =
      result.current.filteredObjectMetadataItems;

    expect(
      activeNonSystemObjectMetadataItems.find(
        (item) => item.nameSingular === 'dashboard',
      ),
    ).toBeUndefined();
    expect(
      activeObjectMetadataItems.find(
        (item) => item.nameSingular === 'dashboard',
      ),
    ).toBeUndefined();

    expect(
      activeNonSystemObjectMetadataItems.find(
        (item) => item.nameSingular === 'person',
      ),
    ).toBeDefined();
  });

  it('should include the dashboard object when the Dashboards deploy flag is enabled', async () => {
    const { result } = renderHook(
      () => {
        const filteredObjectMetadataItems = useFilteredObjectMetadataItems();
        const setIsDashboardsModuleEnabled = useSetAtomState(
          isDashboardsModuleEnabledState,
        );

        return { filteredObjectMetadataItems, setIsDashboardsModuleEnabled };
      },
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.setIsDashboardsModuleEnabled(true);
    });

    const { activeNonSystemObjectMetadataItems, activeObjectMetadataItems } =
      result.current.filteredObjectMetadataItems;

    expect(
      activeNonSystemObjectMetadataItems.find(
        (item) => item.nameSingular === 'dashboard',
      ),
    ).toBeDefined();
    expect(
      activeObjectMetadataItems.find(
        (item) => item.nameSingular === 'dashboard',
      ),
    ).toBeDefined();
  });

  it('should exclude the workflow object when the Automations deploy flag is disabled', async () => {
    const { result } = renderHook(
      () => {
        const filteredObjectMetadataItems = useFilteredObjectMetadataItems();
        const setIsAutomationsModuleEnabled = useSetAtomState(
          isAutomationsModuleEnabledState,
        );

        return { filteredObjectMetadataItems, setIsAutomationsModuleEnabled };
      },
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.setIsAutomationsModuleEnabled(false);
    });

    const { activeNonSystemObjectMetadataItems, activeObjectMetadataItems } =
      result.current.filteredObjectMetadataItems;

    expect(
      activeNonSystemObjectMetadataItems.find(
        (item) => item.nameSingular === 'workflow',
      ),
    ).toBeUndefined();
    expect(
      activeObjectMetadataItems.find(
        (item) => item.nameSingular === 'workflow',
      ),
    ).toBeUndefined();

    expect(
      activeNonSystemObjectMetadataItems.find(
        (item) => item.nameSingular === 'person',
      ),
    ).toBeDefined();
  });

  it('should include the workflow object when the Automations deploy flag is enabled', async () => {
    const { result } = renderHook(
      () => {
        const filteredObjectMetadataItems = useFilteredObjectMetadataItems();
        const setIsAutomationsModuleEnabled = useSetAtomState(
          isAutomationsModuleEnabledState,
        );

        return { filteredObjectMetadataItems, setIsAutomationsModuleEnabled };
      },
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.setIsAutomationsModuleEnabled(true);
    });

    const { activeNonSystemObjectMetadataItems, activeObjectMetadataItems } =
      result.current.filteredObjectMetadataItems;

    expect(
      activeNonSystemObjectMetadataItems.find(
        (item) => item.nameSingular === 'workflow',
      ),
    ).toBeDefined();
    expect(
      activeObjectMetadataItems.find(
        (item) => item.nameSingular === 'workflow',
      ),
    ).toBeDefined();
  });
});
