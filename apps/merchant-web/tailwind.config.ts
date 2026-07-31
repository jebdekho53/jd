import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './design-system/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tailwind's default "green" scale. 200/300/400/900 used to be
        // missing here even though every shade is referenced somewhere in
        // the app (login side panel, onboarding cards, dashboard banners,
        // button disabled state...) — those classes silently generated no
        // CSS at all, rendering as no color rather than a wrong one.
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        surface: '#f8fafc',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
