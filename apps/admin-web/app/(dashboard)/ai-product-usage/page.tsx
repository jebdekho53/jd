import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AiProductUsageContent } from '@/features/ai-product-usage/ai-product-usage-content';

export const metadata: Metadata = { title: 'AI Product Usage' };

export default function AiProductUsagePage() {
  return (
    <DashboardShell title="AI Product Usage">
      <AiProductUsageContent />
    </DashboardShell>
  );
}
