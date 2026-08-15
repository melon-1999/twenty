import { clsx } from 'clsx';

import { themeCssVariables } from '@ui/theme-constants';

import {
  statusPillVariantColor,
  type StatusPillVariant,
} from './statusPillVariantColor';

import styles from './StatusPill.module.scss';

export type StatusPillProps = {
  variant: StatusPillVariant;
  label: string;
  withDot?: boolean;
  className?: string;
};

export const StatusPill = ({
  variant,
  label,
  withDot = false,
  className,
}: StatusPillProps) => {
  const color = statusPillVariantColor(variant);

  return (
    <div
      className={clsx(styles.pill, className)}
      style={
        {
          '--status-pill-background': themeCssVariables.tag.background[color],
          '--status-pill-text': themeCssVariables.tag.text[color],
        } as React.CSSProperties
      }
    >
      {withDot ? <span className={styles.dot} aria-hidden /> : null}
      <span className={styles.label}>{label}</span>
    </div>
  );
};
