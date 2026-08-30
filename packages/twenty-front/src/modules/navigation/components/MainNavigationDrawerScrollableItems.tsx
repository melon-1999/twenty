import { NavigationDrawerOpenedSection } from '@/navigation-menu-item/display/sections/components/NavigationDrawerOpenedSection';
import { NavigationDrawerWorkspaceSectionSkeletonLoader } from '@/object-metadata/components/NavigationDrawerWorkspaceSectionSkeletonLoader';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';

import { IconChartBar, IconHourglassHigh, IconTrendingDown } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const FavoritesSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/favorites/components/FavoritesSectionDispatcher').then(
    (module) => ({
      default: module.FavoritesSectionDispatcher,
    }),
  ),
);

const WorkspaceSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/workspace/components/WorkspaceSectionDispatcher').then(
    (module) => ({
      default: module.WorkspaceSectionDispatcher,
    }),
  ),
);

const StyledScrollableItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

export const MainNavigationDrawerScrollableItems = () => {
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const { pathname } = useLocation();

  const hasOpportunityObject = objectMetadataItems.some(
    (objectMetadataItem) =>
      objectMetadataItem.nameSingular === CoreObjectNameSingular.Opportunity,
  );

  return (
    <StyledScrollableItemsContainer>
      <NavigationDrawerOpenedSection />
      <Suspense fallback={<NavigationDrawerWorkspaceSectionSkeletonLoader />}>
        <FavoritesSectionDispatcher />
        <WorkspaceSectionDispatcher />
      </Suspense>
      {hasOpportunityObject && (
        <>
          <NavigationDrawerItem
            label={t`Forecast`}
            to={AppPath.ForecastPage}
            Icon={IconChartBar}
            active={pathname === AppPath.ForecastPage}
          />
          <NavigationDrawerItem
            label={t`Verlustgründe`}
            to={AppPath.LostReasonReportPage}
            Icon={IconTrendingDown}
            active={pathname === AppPath.LostReasonReportPage}
          />
          <NavigationDrawerItem
            label={t`Phasen-Dauer`}
            to={AppPath.StageAnalyticsPage}
            Icon={IconHourglassHigh}
            active={pathname === AppPath.StageAnalyticsPage}
          />
        </>
      )}
    </StyledScrollableItemsContainer>
  );
};
