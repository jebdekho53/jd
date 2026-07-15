import {
  LayoutDashboard,
  Store,
  Package,
  Layers,
  ShoppingBag,
  Tags,
  Wallet,
  Monitor,
  Star,
  Tag,
  Headphones,
  Users,
  UtensilsCrossed,
  ChefHat,
  BarChart3,
  RefreshCw,
  Share2,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra terms the command palette matches on, beyond the label. */
  keywords?: string;
}

export const baseNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, keywords: 'home overview' },
  { href: '/stores', label: 'My Stores', icon: Store, keywords: 'shop outlet timings' },
  { href: '/settings/delivery-coverage', label: 'Delivery Coverage', icon: Store, keywords: 'radius pincode serviceability free delivery' },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/products', label: 'Products', icon: Package, keywords: 'catalog items sku' },
  { href: '/inventory', label: 'Inventory', icon: Layers, keywords: 'stock quantity' },
  { href: '/orders', label: 'Orders', icon: ShoppingBag, keywords: 'sales' },
  { href: '/orders/live', label: 'Live Orders', icon: Monitor, keywords: 'incoming new orders' },
  { href: '/claims', label: 'Returns & Claims', icon: RefreshCw, keywords: 'refund dispute' },
  { href: '/reviews', label: 'Reviews', icon: Star, keywords: 'ratings feedback' },
  { href: '/promotions', label: 'Promotions', icon: Tag, keywords: 'offers coupons discounts' },
  { href: '/earnings', label: 'Earnings', icon: Wallet, keywords: 'payouts settlement money' },
  { href: '/finance', label: 'Finance', icon: Wallet, keywords: 'money invoice ledger' },
  { href: '/gst', label: 'GST & Tax', icon: Wallet, keywords: 'tax invoice hsn' },
  { href: '/support', label: 'Support', icon: Headphones, keywords: 'help ticket contact' },
  { href: '/customers', label: 'Customers', icon: Users, keywords: 'buyers' },
  { href: '/growth', label: 'Growth', icon: Star, keywords: 'marketing insights' },
  { href: '/marketing-card', label: 'My Card', icon: Share2, keywords: 'share whatsapp business card qr poster' },
  { href: '/ai', label: 'AI Commerce', icon: Star, keywords: 'ai credits image generation wallet' },
  { href: '/network', label: 'Network', icon: Layers },
  { href: '/procurement', label: 'Procurement', icon: Package, keywords: 'purchase supplier' },
  { href: '/ads', label: 'Ads', icon: Tag, keywords: 'sponsored advertising' },
  { href: '/seo', label: 'SEO', icon: Tag },
];

export function restaurantNav(storeId: string): NavItem[] {
  return [
    { href: `/stores/${storeId}/restaurant-dashboard`, label: 'Restaurant', icon: BarChart3, keywords: 'food dashboard' },
    { href: `/stores/${storeId}/menu`, label: 'Menu', icon: UtensilsCrossed, keywords: 'dishes food items' },
    { href: `/stores/${storeId}/kitchen`, label: 'Kitchen', icon: ChefHat, keywords: 'kds cooking' },
  ];
}
