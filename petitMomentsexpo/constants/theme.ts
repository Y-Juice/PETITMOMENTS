/**
 * Brand palette (aligned with the website).
 */

import { Platform } from 'react-native';

export const Brand = {
  primary: '#C44536',
  secondary: '#FF5F1F',
  accent: '#9236C4',
  textLight: '#272727',
  textDark: '#FFFDE2',
  neutral: '#6B7C6E',
} as const;

export const Colors = {
  light: {
    text: Brand.textLight,
    background: '#FFFFFF',
    tint: Brand.primary,
    icon: Brand.neutral,
    tabIconDefault: Brand.neutral,
    tabIconSelected: Brand.primary,
    secondary: Brand.secondary,
    accent: Brand.accent,
    neutral: Brand.neutral,
    tabBarBackground: '#FFF8EF',
    tabBarBorder: 'rgba(39, 39, 39, 0.08)',
    tabBarInactive: 'rgba(196, 69, 54, 0.42)',
  },
  dark: {
    text: Brand.textDark,
    background: '#1E1E1C',
    tint: Brand.secondary,
    icon: 'rgba(255, 253, 226, 0.7)',
    tabIconDefault: 'rgba(255, 253, 226, 0.45)',
    tabIconSelected: Brand.secondary,
    secondary: Brand.secondary,
    accent: Brand.accent,
    neutral: Brand.neutral,
    tabBarBackground: '#2A2520',
    tabBarBorder: 'rgba(255, 253, 226, 0.1)',
    tabBarInactive: 'rgba(255, 95, 31, 0.45)',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
