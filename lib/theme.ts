export type ThemeName = 'dark' | 'light';
export type ThemePreference = 'auto' | 'dark' | 'light';

export type Palette = {
  bg: string;
  bgElevated: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  textSoft: string;
  accent: string;
  accentDim: string;
  pin: string;
  user: string;
  warning: string;
  danger: string;
  overlay: string;
  tabBar: string;
  success: string;
  mapTiles: 'dark' | 'light';
};

export const darkPalette: Palette = {
  bg: '#070B12',
  bgElevated: '#0E141E',
  surface: '#151C28',
  surface2: '#1C2534',
  border: 'rgba(255,255,255,0.08)',
  text: '#F3F6FB',
  textMuted: '#8B95A8',
  textSoft: '#C5CDD8',
  accent: '#3DDC97',
  accentDim: 'rgba(61,220,151,0.16)',
  pin: '#FF4D6A',
  user: '#5B8CFF',
  warning: '#FFB020',
  danger: '#FF4D6A',
  overlay: 'rgba(7,11,18,0.72)',
  tabBar: '#0B1018',
  success: '#3DDC97',
  mapTiles: 'dark',
};

export const lightPalette: Palette = {
  bg: '#EEF1F6',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surface2: '#F4F6FA',
  border: 'rgba(15,23,42,0.08)',
  text: '#0D1321',
  textMuted: '#667085',
  textSoft: '#3A4458',
  accent: '#0F9F6E',
  accentDim: 'rgba(15,159,110,0.12)',
  pin: '#E11D48',
  user: '#2563EB',
  warning: '#D97706',
  danger: '#E11D48',
  overlay: 'rgba(15,23,42,0.45)',
  tabBar: '#FFFFFF',
  success: '#0F9F6E',
  mapTiles: 'light',
};

export const RADIUS_PRESETS = [
  { label: '100 m', value: 100 },
  { label: '200 m', value: 200 },
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
] as const;
