import { msg } from '@lingui/core/macro';

import { SITE_URLS } from '@/platform/site-urls';

import { type MenuNavItem } from '../types/menu-nav-item';
import { type MenuSocialLink } from '../types/menu-social-link';

export const MENU: {
  appUrl: string;
  navItems: readonly MenuNavItem[];
  socialLinks: readonly MenuSocialLink[];
} = {
  appUrl: SITE_URLS.appWelcome,
  navItems: [
    { href: '/product', label: msg`Product` },
    { href: '/pricing', label: msg`Pricing` },
  ],
  socialLinks: [],
};
