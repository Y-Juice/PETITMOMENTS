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

/** Home feed moment cards: accent → primary → secondary → yellow → neutral, then repeat by index. */
export type MomentCardPalette = { bg: string; text: string; sub: string };

const CARD_TEXT_ON_DARK = { text: '#FFFFFF' as const, sub: 'rgba(255,255,255,0.9)' as const };
const CARD_TEXT_ON_LIGHT = {
  text: Brand.textLight,
  sub: 'rgba(39, 39, 39, 0.75)',
} as const;

export const MOMENT_CARD_COLOR_SEQUENCE: MomentCardPalette[] = [
  { bg: Brand.accent, ...CARD_TEXT_ON_DARK }, // paars
  { bg: Brand.primary, ...CARD_TEXT_ON_DARK }, // rood
  { bg: '#F5D742', ...CARD_TEXT_ON_LIGHT }, // geel
  { bg: Brand.neutral, ...CARD_TEXT_ON_DARK }, // grijsgroen
  { bg: Brand.secondary, ...CARD_TEXT_ON_DARK }, // oranje
  { bg: '#2A9D8F', ...CARD_TEXT_ON_DARK }, // teal
  { bg: '#2D6CDF', ...CARD_TEXT_ON_DARK }, // blauw
  { bg: '#E25C8B', ...CARD_TEXT_ON_DARK }, // roze
  { bg: '#2E7D52', ...CARD_TEXT_ON_DARK }, // bosgroen
  { bg: '#5B5BD6', ...CARD_TEXT_ON_DARK }, // indigo
  { bg: '#C77DFF', ...CARD_TEXT_ON_DARK }, // lila
  { bg: '#E08A3C', ...CARD_TEXT_ON_DARK }, // amber
  { bg: '#6FC3DF', ...CARD_TEXT_ON_LIGHT }, // lichtblauw
  { bg: '#7FD1AE', ...CARD_TEXT_ON_LIGHT }, // mint
  { bg: '#F2A6C0', ...CARD_TEXT_ON_LIGHT }, // zachtroze
];

export function getMomentCardColors(colorIndex: number): MomentCardPalette {
  const n = MOMENT_CARD_COLOR_SEQUENCE.length;
  return MOMENT_CARD_COLOR_SEQUENCE[colorIndex % n];
}

/**
 * Kleur-index die altijd hetzelfde is voor een bepaald id (simpele hash).
 * Zo krijgt een moment of discussie overal dezelfde kaartkleur, ook in de
 * detailweergave.
 */
export function getCardColorIndexForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1000000007;
  }
  return Math.abs(hash) % MOMENT_CARD_COLOR_SEQUENCE.length;
}

export function getCardColorsForId(id: string): MomentCardPalette {
  return MOMENT_CARD_COLOR_SEQUENCE[getCardColorIndexForId(id)];
}

/** True als de tekstkleur van het palet wit is (donkere achtergrond). */
export function isPaletteOnDark(palette: MomentCardPalette): boolean {
  return palette.text === "#FFFFFF";
}

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
