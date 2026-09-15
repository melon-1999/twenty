import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { useNavigationDrawerExpanded } from '@/navigation/hooks/useNavigationDrawerExpanded';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { render, screen } from '@testing-library/react';

jest.mock('@/navigation/hooks/useNavigationDrawerExpanded');
jest.mock('@/ui/utilities/responsive/hooks/useIsMobile');

jest.mock(
  '@/ui/navigation/navigation-drawer/components/NavigationDrawerCollapseButton',
  () => ({
    NavigationDrawerCollapseButton: () => (
      <button type="button">Expand sidebar</button>
    ),
  }),
);

describe('PageCardHeader', () => {
  beforeEach(() => {
    jest.mocked(useIsMobile).mockReturnValue(false);
    jest.mocked(useNavigationDrawerExpanded).mockReturnValue(false);
  });

  it('offers the expand affordance on desktop when the drawer is collapsed', () => {
    render(<PageCardHeader title="Profile" />);

    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toBeInTheDocument();
  });

  it('offers the expand affordance on mobile when the drawer is collapsed', () => {
    jest.mocked(useIsMobile).mockReturnValue(true);

    render(<PageCardHeader title="Profile" />);

    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toBeInTheDocument();
  });

  it('hides the expand affordance while the drawer is expanded', () => {
    jest.mocked(useNavigationDrawerExpanded).mockReturnValue(true);

    render(<PageCardHeader title="Profile" />);

    expect(
      screen.queryByRole('button', { name: 'Expand sidebar' }),
    ).not.toBeInTheDocument();
  });
});
