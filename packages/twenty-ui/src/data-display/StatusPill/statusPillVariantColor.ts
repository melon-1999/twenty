import { type ThemeColor } from '@ui/theme';

export type StatusPillVariant =
  | 'success'
  | 'danger'
  | 'neutral'
  | 'warning'
  | 'info';

const STATUS_PILL_VARIANT_COLOR: Record<StatusPillVariant, ThemeColor> = {
  success: 'green',
  danger: 'red',
  warning: 'orange',
  info: 'blue',
  neutral: 'gray',
};

export const statusPillVariantColor = (
  variant: StatusPillVariant,
): ThemeColor => STATUS_PILL_VARIANT_COLOR[variant];
