import type { Metadata } from 'next';
import { Sprint2Providers } from '@/components/providers/s2-providers';

export const metadata: Metadata = {
  title: 'Account',
};

export default function Sprint2Layout({ children }: { children: React.ReactNode }) {
  return <Sprint2Providers>{children}</Sprint2Providers>;
}
