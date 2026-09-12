import { Font, Head } from 'react-email';

import { canvasTheme } from 'src/common-style';
import { PRODUCT_BRANDING } from 'twenty-shared/constants';

export const BaseHead = () => {
  return (
    <Head>
      <title>{`${PRODUCT_BRANDING.name} email`}</title>
      <Font
        fontFamily={canvasTheme.font.family}
        fallbackFontFamily="sans-serif"
        fontStyle="normal"
        fontWeight={canvasTheme.font.weight.regular}
      />
    </Head>
  );
};
