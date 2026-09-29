/**
 * Design token dung chung. Moi mau/khoang cach trong app phai lay tu day,
 * khong hardcode hex hay so pixel trong component.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#60646C',
    background: '#FFFFFF',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    border: '#D7DBDF',
    primary: '#208AEF',
    primaryText: '#FFFFFF',
    accent: '#F59E0B',
    danger: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
    /** Nen nhat cho chip, icon tron, di kem mau cung ten o tren. */
    primarySoft: '#DBEAFE',
    accentSoft: '#FEF3C7',
    successSoft: '#DCFCE7',
    dangerSoft: '#FEE2E2',
    /** Lop phu mo phia sau bottom sheet va modal. */
    overlay: 'rgba(15, 23, 42, 0.4)',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#B0B4BA',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    border: '#3A3D42',
    primary: '#3C9DF5',
    primaryText: '#FFFFFF',
    accent: '#FBBF24',
    danger: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
    primarySoft: '#172554',
    accentSoft: '#451A03',
    successSoft: '#052E16',
    dangerSoft: '#450A0A',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type AppTheme = (typeof Colors)['light'];

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
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  /** O nhap, nut, chip nho: muc toi thieu cua design-mobile.md. */
  control: 12,
  lg: 16,
  /** Khoi lon, anh lon (design-mobile.md). */
  xl: 24,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
