/** 4px grid spacing scale — single source of truth for Sprint 2 UI */
export const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
} as const;

export const colors = {
  brand: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    400: '#94a3b8',
    600: '#475569',
    800: '#1e293b',
    900: '#0f172a',
  },
  danger: { 500: '#ef4444', 600: '#dc2626' },
  warning: { 500: '#f59e0b' },
} as const;

export const typography = {
  display: 'text-3xl font-bold tracking-tight',
  h1: 'text-2xl font-bold tracking-tight',
  h2: 'text-xl font-semibold',
  h3: 'text-lg font-semibold',
  body: 'text-base text-neutral-800',
  bodySm: 'text-sm text-neutral-600',
  caption: 'text-xs text-neutral-500',
  label: 'text-sm font-medium text-neutral-800',
} as const;
