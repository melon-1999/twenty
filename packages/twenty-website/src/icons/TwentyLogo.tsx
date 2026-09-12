import { styled } from '@linaria/react';

import { DURATION, EASING, semanticColor } from '@/tokens';

// Placeholder brand mark, matching packages/twenty-front/public/images/brand/logo.svg.
// Replace together with the final logo (see docs/product/rebranding.md).
const LogoSvg = styled.svg`
  rect,
  circle {
    transition: fill ${DURATION.md} ${EASING.gentle};
  }
`;

export type TwentyLogoProps = {
  sizePx?: number;
};

export function TwentyLogo({ sizePx = 40 }: TwentyLogoProps) {
  return (
    <LogoSvg
      fill="none"
      height={sizePx}
      viewBox="0 0 40 40"
      width={sizePx}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill={semanticColor.ink} height={40} rx={7.5} width={40} />
      <circle
        cx={20}
        cy={20}
        fill="none"
        r={9.4}
        stroke={semanticColor.surface}
        strokeWidth={3.75}
      />
    </LogoSvg>
  );
}
