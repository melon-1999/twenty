import { styled } from '@linaria/react';

import { DURATION, EASING, semanticColor } from '@/tokens';

// Brand mark, matching packages/twenty-front/public/images/brand/logo.svg
// (tile + "N" glyph geometry scaled from the 512x512 source down to this 40x40 viewBox).
const LogoSvg = styled.svg`
  rect,
  path {
    transition:
      fill ${DURATION.md} ${EASING.gentle},
      stroke ${DURATION.md} ${EASING.gentle};
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
      <rect fill={semanticColor.ink} height={40} rx={8.125} width={40} />
      <rect
        fill={semanticColor.surface}
        height={19.375}
        rx={2.8125}
        width={5.625}
        x={9.84375}
        y={10.3125}
      />
      <rect
        fill={semanticColor.surface}
        height={19.375}
        rx={2.8125}
        width={5.625}
        x={24.53125}
        y={10.3125}
      />
      <path
        d="M12.8125 13.28125 L27.1875 26.875"
        fill="none"
        stroke={semanticColor.surface}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={6.09375}
      />
    </LogoSvg>
  );
}
