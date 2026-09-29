import { render } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { IconLink, IconWorld } from 'twenty-ui/icon';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { allowRequestsToTwentyIconsState } from '@/client-config/states/allowRequestsToTwentyIcons';
import { LinkIconWithLinkOverlay } from '@/navigation-menu-item/display/link/components/LinkIconWithLinkOverlay';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';

const renderIcon = (allowRequestsToTwentyIcons: boolean) => {
  jotaiStore.set(
    allowRequestsToTwentyIconsState.atom,
    allowRequestsToTwentyIcons,
  );

  return render(
    <JotaiProvider store={jotaiStore}>
      <ThemeProvider colorScheme="light">
        <LinkIconWithLinkOverlay
          link="https://intranet.acme.com/wiki"
          LinkIcon={IconLink}
          DefaultIcon={IconWorld}
        />
      </ThemeProvider>
    </JotaiProvider>,
  );
};

describe('LinkIconWithLinkOverlay', () => {
  it('does not reference twenty-icons when requests to it are not allowed', () => {
    const { container } = renderIcon(false);

    expect(container.innerHTML).not.toContain('twenty-icons.com');
  });

  it('shows the link favicon when requests to twenty-icons are allowed', () => {
    const { container } = renderIcon(true);

    expect(container.innerHTML).toContain('twenty-icons.com/');
  });
});
