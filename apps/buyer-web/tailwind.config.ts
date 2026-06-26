import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

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
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Surface ramp + brand tokens are CSS-var driven so dark mode works */
        cream: {
          1: 'var(--cream-1)',
          2: 'var(--cream-2)',
          3: 'var(--cream-3)',
          4: 'var(--cream-4)',
          5: 'var(--cream-5)',
        },
        jd: {
          primary: 'var(--jd-primary)',
          secondary: 'var(--jd-secondary)',
          accent: 'var(--jd-accent)',
          text: {
            primary: 'var(--jd-text-primary)',
            secondary: 'var(--jd-text-secondary)',
            muted: 'var(--jd-text-muted)',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)',
        soft: '0 2px 8px rgba(17,24,39,0.06)',
        elevated: '0 4px 14px rgba(17,24,39,0.08)',
        pop: '0 8px 24px rgba(17,24,39,0.10)',
        float: '0 12px 32px rgba(17,24,39,0.14)',
        sheet: '0 -8px 30px rgba(17,24,39,0.16)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'sheet-down': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100%)' },
        },
        'overlay-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        's2-slide-up-lg': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'scale-in': 'scale-in 0.18s ease-out',
        'sheet-up': 'sheet-up 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-down': 'sheet-down 0.2s ease-in',
        'overlay-in': 'overlay-in 0.2s ease-out',
        's2-slide-up-lg': 's2-slide-up-lg 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [animate],
};

export default config;
