/** JebDekho design tokens (Design System v2 — neutral premium) */
export const space = {
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
} as const;

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '14px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;

/** Standard breakpoints the buyer-web must look native on. */
export const breakpoints = {
  xs: 320,
  sm: 360,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1440,
  '3xl': 1600,
} as const;

export const colors = {
  cream: {
    1: '#f1eedf',
    2: '#f2efe0',
    3: '#f4f1e2',
    4: '#f0edde',
    5: '#eeebda',
  },
  primary: '#2E5E4E',
  secondary: '#3D7A66',
  accent: '#F59E0B',
  success: '#16A34A',
  danger: '#DC2626',
  text: {
    primary: '#111827',
    secondary: '#374151',
    muted: '#6B7280',
  },
} as const;

export const typography = {
  display: 'text-3xl font-bold tracking-tight text-jd-text-primary',
  h1: 'text-2xl font-bold tracking-tight text-jd-text-primary',
  h2: 'text-xl font-semibold text-jd-text-primary',
  h3: 'text-lg font-semibold text-jd-text-primary',
  body: 'text-base text-jd-text-secondary',
  bodySm: 'text-sm text-jd-text-muted',
  caption: 'text-xs text-jd-text-muted',
  label: 'text-sm font-medium text-jd-text-primary',
  price: 'text-base font-bold text-jd-text-primary',
} as const;

export const LIFESTYLE_CARDS = [
  { id: 'healthy', title: 'Healthy Living', href: '/search?q=organic', emoji: '🥗' },
  { id: 'budget', title: 'Budget Shopping', href: '/search?deals=1', emoji: '💰' },
  { id: 'family', title: 'Family Essentials', href: '/search?categoryId=', emoji: '👨‍👩‍👧' },
  { id: 'student', title: 'Student Essentials', href: '/search?q=snacks', emoji: '🎒' },
  { id: 'quick', title: 'Quick Meals', href: '/search?q=ready', emoji: '⚡' },
] as const;

export const TRUST_FEATURES = [
  { id: 'compare', label: 'Price Comparison', description: 'Compare across local stores' },
  { id: 'local', label: 'Local Stores', description: 'Neighbourhood vendors first' },
  { id: 'cod', label: 'COD Available', description: 'Pay when you receive' },
  { id: 'fast', label: 'Fast Delivery', description: 'Minutes, not hours' },
  { id: 'verified', label: 'Verified Merchants', description: 'Approved store partners' },
] as const;

export const TRENDING_SEARCHES = [
  'milk', 'atta', 'banana', 'bread', 'eggs', 'rice', 'tomato', 'onion',
] as const;

export const FRESH_CATEGORIES = [
  { id: 'fruits', name: 'Fruits', slug: 'fruits', gradient: 'from-orange-100 to-orange-50' },
  { id: 'vegetables', name: 'Vegetables', slug: 'vegetables', gradient: 'from-green-100 to-green-50' },
  { id: 'dairy', name: 'Dairy', slug: 'dairy', gradient: 'from-blue-100 to-blue-50' },
] as const;
