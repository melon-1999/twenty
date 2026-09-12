import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { type IconComponent } from '@/icons';
import { PRODUCT_BRANDING } from 'twenty-shared/constants';

import { SITE_URLS } from '@/platform/site-urls';

export type FooterNavLink = {
  label: MessageDescriptor;
  href: string;
  external?: boolean;
};

export type FooterCta =
  | {
      kind: 'contact-modal';
      label: MessageDescriptor;
      variant: 'filled' | 'outlined';
    }
  | {
      kind: 'link';
      label: MessageDescriptor;
      href: string;
      variant: 'filled' | 'outlined';
    };

export type FooterNavGroup = {
  id: string;
  title: MessageDescriptor;
  links: readonly FooterNavLink[];
  ctas?: readonly FooterCta[];
};

export type FooterSocialLink = {
  ariaLabel: MessageDescriptor;
  href: string;
  icon: IconComponent;
};

export const FOOTER: {
  navGroups: readonly FooterNavGroup[];
  socialLinks: readonly FooterSocialLink[];
} = {
  navGroups: [
    {
      id: 'footer-sitemap',
      title: msg`Sitemap`,
      links: [
        { label: msg`Home`, href: '/' },
        { label: msg`Product`, href: '/product' },
        { label: msg`Pricing`, href: '/pricing' },
      ],
    },
    {
      id: 'footer-legal',
      title: msg`Legal`,
      links: [
        {
          label: msg`Privacy Policy`,
          href: PRODUCT_BRANDING.legalPrivacyUrl,
          external: true,
        },
        {
          label: msg`Terms and Conditions`,
          href: PRODUCT_BRANDING.legalTermsUrl,
          external: true,
        },
      ],
    },
    {
      id: 'footer-connect',
      title: msg`Connect`,
      links: [],
      ctas: [
        {
          kind: 'contact-modal',
          label: msg`Talk to us`,
          variant: 'filled',
        },
        {
          kind: 'link',
          label: msg`Get started`,
          href: SITE_URLS.appWelcome,
          variant: 'outlined',
        },
      ],
    },
  ],
  socialLinks: [],
};
