import { Img } from 'react-email';
import { PRODUCT_BRANDING } from 'twenty-shared/constants';

const logoStyle = {
  marginBottom: '40px',
};

export const Logo = () => {
  return (
    <Img
      src={PRODUCT_BRANDING.emailLogoUrl}
      alt={`${PRODUCT_BRANDING.name} logo`}
      width="40"
      height="40"
      style={logoStyle}
    />
  );
};
