import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Rider app is always-dark by design (outdoor/sunlight legibility, battery
 * savings on a phone mounted on a bike all shift) — no light-mode variant.
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './design-system/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        rider: {
          bg: 'var(--rider-bg)',
          surface: 'var(--rider-surface)',
          surface2: 'var(--rider-surface-2)',
          border: 'var(--rider-border)',
          text: 'var(--rider-text)',
          muted: 'var(--rider-muted)',
          accent: 'var(--rider-accent)',
          'accent-foreground': 'var(--rider-accent-foreground)',
          online: 'var(--rider-online)',
          danger: 'var(--rider-danger)',
          info: 'var(--rider-info)',
        },
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,0.35)',
        pop: '0 8px 28px rgba(0,0,0,0.45)',
        sheet: '0 -8px 30px rgba(0,0,0,0.5)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(251,191,36,0.5)' },
          '100%': { boxShadow: '0 0 0 14px rgba(251,191,36,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'sheet-up': 'sheet-up 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [animate],
};

export default config;
