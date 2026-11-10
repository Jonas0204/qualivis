export enum Size {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export type Theme = { primary: string; surface: string };

export const defaultTheme = {
  primary: '#3366ff',
  surface: '#ffffff',
} satisfies Theme;
