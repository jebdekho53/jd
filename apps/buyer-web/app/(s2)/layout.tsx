import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account',
};

export default function Sprint2Layout({ children }: { children: React.ReactNode }) {
  return children;
}
