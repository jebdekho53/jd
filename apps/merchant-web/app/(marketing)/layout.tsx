import type { ReactNode } from 'react';
import { AppProviders } from '@/components/providers/app-providers';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
