import '@/global.css';

import { Platform } from 'react-native';

// Semantic colour tokens. Dark values match the Mtaa mock (assets/images/Theme.png);
// light values keep the same roles with AA contrast on white.
export const Colors = {
  light: {
    text: '#0B0B0C',
    background: '#ffffff',
    backgroundElement: '#F2F3F5',
    backgroundSelected: '#E3E5EA',
    textSecondary: '#5B606A',
    placeholder: '#6B7280',
    border: '#D5D8DE',
    iconButton: '#E6E8EC',
    primary: '#2563eb',
    onPrimary: '#ffffff',
    primarySoft: 'rgba(37, 99, 235, 0.10)',
    primaryText: '#1d4ed8',
    success: '#15803d',
    successSoft: 'rgba(34, 197, 94, 0.14)',
    warning: '#b45309',
    warningSoft: 'rgba(245, 158, 11, 0.16)',
    danger: '#b91c1c',
    dangerSoft: 'rgba(239, 68, 68, 0.12)',
    dangerButton: '#dc2626',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#1a1a1a',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    placeholder: '#8A8F98',
    border: '#333333',
    iconButton: '#222222',
    primary: '#2563eb',
    onPrimary: '#ffffff',
    primarySoft: 'rgba(37, 99, 235, 0.18)',
    primaryText: '#60a5fa',
    success: '#4ade80',
    successSoft: 'rgba(34, 197, 94, 0.16)',
    warning: '#fbbf24',
    warningSoft: 'rgba(245, 158, 11, 0.16)',
    danger: '#f87171',
    dangerSoft: 'rgba(239, 68, 68, 0.16)',
    dangerButton: '#dc2626',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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

export const Radius = { sm: 10, md: 14, lg: 16, pill: 999 } as const;

// Room under scrolling content so the floating tab bar never hides the last card or button.
export const TabBarClearance = 200;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
